# Design Document: Streaming GenAI Implementation

## Overview

Este diseño implementa streaming en tiempo real para la generación de resúmenes y flashcards usando el Google GenAI SDK con Gemini 2.5 Flash Lite. El sistema mostrará el contenido progresivamente mientras se genera, mejorando significativamente la experiencia del usuario al proporcionar feedback inmediato y reducir la percepción de tiempo de espera.

### Key Design Principles

1. **Streaming Nativo**: Usar `sendMessageStream()` del SDK de Google GenAI para streaming real
2. **Typewriter Adaptativo**: Velocidad de escritura que se adapta dinámicamente a la velocidad del stream
3. **Performance Optimizado**: Usar requestAnimationFrame para animaciones fluidas sin bloquear la UI
4. **Manejo Robusto de Errores**: Capturar y manejar errores específicos del streaming
5. **Compatibilidad Total**: Funcionar tanto en flujo simple como en workflows múltiples
6. **Accesibilidad**: Soporte completo para lectores de pantalla y navegación por teclado

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     UI Components                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  StreamingText Component                              │  │
│  │    - Typewriter Effect                                │  │
│  │    - Adaptive Speed                                   │  │
│  │    - Accessibility Support                            │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  WorkflowCard / StageCard                             │  │
│  │    - Streaming Status                                 │  │
│  │    - Cancel Button                                    │  │
│  │    - Progress Indicator                               │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Streaming Service Layer                         │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  streamingSummaryService                              │  │
│  │    - generateSummaryStream()                          │  │
│  │    - generateFlashcardsStream()                       │  │
│  │    - handleStreamChunks()                             │  │
│  │    - extractUsageMetadata()                           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Google GenAI SDK                                │
│  - GoogleGenAI Client                                        │
│  - Chat Session with streaming                              │
│  - sendMessageStream()                                       │
│  - Chunk processing                                          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Data Models

#### StreamingState
```typescript
interface StreamingState {
  isStreaming: boolean;
  text: string;
  charDelay: number;
  error?: string;
  usageMetadata?: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  };
}
```

#### StreamChunk
```typescript
interface StreamChunk {
  text: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}
```

#### StreamingCallbacks
```typescript
interface StreamingCallbacks {
  onChunk: (chunk: string, charDelay: number) => void;
  onComplete: (fullText: string, metadata: UsageMetadata) => void;
  onError: (error: Error) => void;
}
```

### 2. Streaming Service

#### streamingSummaryService.ts

```typescript
import { GoogleGenAI, Chat } from '@google/genai';

const MODEL_NAME = 'gemini-2.5-flash-lite';

class StreamingSummaryService {
  private chat: Chat | null = null;
  private abortController: AbortController | null = null;
  
  /**
   * Initialize chat session with Gemini
   */
  private initializeChat(apiKey: string): Chat {
    const ai = new GoogleGenAI({ apiKey });
    
    return ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: 'Eres un asistente experto en crear resúmenes educativos...',
        temperature: 1,
        topP: 0.8,
        topK: 40,
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
  }
  
  /**
   * Generate summary with streaming
   */
  async generateSummaryStream(
    prompt: string,
    apiKey: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      if (!this.chat) {
        this.chat = this.initializeChat(apiKey);
      }
      
      const stream = await this.chat.sendMessageStream({ 
        message: prompt 
      });
      
      let totalText = '';
      let lastChunkTime = performance.now();
      let smoothedCharDelay = 20; // Start with default
      const smoothingFactor = 0.4;
      let usageMetadata = null;
      
      for await (const chunk of stream) {
        // Check if aborted
        if (this.abortController.signal.aborted) {
          throw new Error('Aborted');
        }
        
        // Extract usage metadata from first chunk
        if (chunk.usageMetadata && !usageMetadata) {
          usageMetadata = chunk.usageMetadata;
        }
        
        const now = performance.now();
        const newText = chunk.text;
        
        if (!newText) continue;
        
        // Calculate adaptive char delay
        const deltaTime = now - lastChunkTime;
        const deltaChars = newText.length;
        
        if (deltaTime > 1 && deltaChars > 0) {
          const charsPerSecond = (deltaChars / deltaTime) * 1000;
          const newCharDelay = 1000 / charsPerSecond;
          smoothedCharDelay = (smoothingFactor * newCharDelay) + 
                             ((1 - smoothingFactor) * smoothedCharDelay);
        }
        
        totalText += newText;
        lastChunkTime = now;
        
        // Call chunk callback
        callbacks.onChunk(totalText, Math.max(0.1, smoothedCharDelay));
      }
      
      // Call complete callback
      callbacks.onComplete(totalText, {
        promptTokens: usageMetadata?.promptTokenCount || 0,
        candidatesTokens: usageMetadata?.candidatesTokenCount || 0,
        totalTokens: usageMetadata?.totalTokenCount || 0
      });
      
    } catch (error: any) {
      if (error.message === 'Aborted') {
        callbacks.onError(new Error('Generación cancelada por el usuario'));
      } else {
        callbacks.onError(this.mapError(error));
      }
    } finally {
      this.abortController = null;
    }
  }
  
  /**
   * Generate flashcards with streaming
   */
  async generateFlashcardsStream(
    summaryText: string,
    apiKey: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    // Similar implementation to generateSummaryStream
    // but with flashcard-specific prompt
  }
  
  /**
   * Cancel current streaming operation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
  
  /**
   * Map errors to user-friendly messages
   */
  private mapError(error: any): Error {
    if (error.message?.includes('API key not valid')) {
      return new Error('API Key inválida. Verifica tu configuración.');
    }
    if (error.message?.includes('quota') || error.status === 429) {
      return new Error('Cuota excedida. Intenta más tarde.');
    }
    if (error.name === 'FetchError') {
      return new Error('Error de red. Verifica tu conexión.');
    }
    return new Error(error.message || 'Error desconocido');
  }
}

export const streamingSummaryService = new StreamingSummaryService();
```

### 3. StreamingText Component

#### streaming-text.tsx

```typescript
import React, { useState, useRef, useEffect } from 'react';

interface StreamingTextProps {
  textToType: string;
  charDelay: number;
  isStreaming: boolean;
  onComplete?: () => void;
}

export const StreamingText: React.FC<StreamingTextProps> = ({
  textToType,
  charDelay,
  isStreaming,
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const textIndexRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const timeAccumulatorRef = useRef<number>(0);
  
  // Reset if text doesn't start with current displayed text
  useEffect(() => {
    if (!textToType.startsWith(displayedText)) {
      setDisplayedText('');
      textIndexRef.current = 0;
    }
  }, [textToType, displayedText]);
  
  // Update text index when displayed text changes
  useEffect(() => {
    textIndexRef.current = displayedText.length;
    
    const animate = (currentTime: number) => {
      if (!lastFrameTimeRef.current) {
        lastFrameTimeRef.current = currentTime;
      }
      
      const deltaTime = currentTime - lastFrameTimeRef.current;
      lastFrameTimeRef.current = currentTime;
      timeAccumulatorRef.current += deltaTime;
      
      const effectiveDelay = Math.max(0.1, charDelay);
      const charsToRender = Math.floor(timeAccumulatorRef.current / effectiveDelay);
      
      if (charsToRender > 0) {
        const newIndex = Math.min(
          textIndexRef.current + charsToRender,
          textToType.length
        );
        
        if (newIndex > textIndexRef.current) {
          setDisplayedText(textToType.substring(0, newIndex));
          textIndexRef.current = newIndex;
          timeAccumulatorRef.current -= charsToRender * effectiveDelay;
        }
      }
      
      if (textIndexRef.current < textToType.length) {
        frameRef.current = requestAnimationFrame(animate);
      } else if (!isStreaming && onComplete) {
        onComplete();
      }
    };
    
    if (displayedText.length < textToType.length) {
      frameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
      lastFrameTimeRef.current = 0;
      timeAccumulatorRef.current = 0;
    };
  }, [textToType, charDelay, displayedText, isStreaming, onComplete]);
  
  return (
    <div 
      className="whitespace-pre-wrap"
      aria-live="polite"
      aria-atomic="false"
    >
      {displayedText}
      {isStreaming && (
        <span className="inline-block w-1 h-4 ml-1 bg-primary animate-pulse" 
              aria-label="Generando contenido" />
      )}
    </div>
  );
};
```

### 4. Integration with Workflow System

#### Enhanced WorkflowProcessor

```typescript
class WorkflowProcessor {
  // ... existing code ...
  
  /**
   * Process stage with streaming support
   */
  async processStageWithStreaming(
    workflowId: string,
    stage: StageType
  ): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }
    
    // Mark as streaming
    this.store.updateStageStatus(workflowId, stage, 'processing');
    this.store.setStageStreaming(workflowId, stage, true);
    
    const apiKey = this.getUserApiKey();
    
    try {
      switch (stage) {
        case 'summary':
          await this.processSummaryWithStreaming(workflowId, apiKey);
          break;
        case 'flashcards':
          await this.processFlashcardsWithStreaming(workflowId, apiKey);
          break;
        default:
          // Content stage doesn't need streaming
          await this.processStage(workflowId, stage);
      }
    } catch (error) {
      this.store.setStageError(workflowId, stage, error.message);
      throw error;
    } finally {
      this.store.setStageStreaming(workflowId, stage, false);
    }
  }
  
  /**
   * Process summary with streaming
   */
  private async processSummaryWithStreaming(
    workflowId: string,
    apiKey: string
  ): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    const prompt = this.buildSummaryPrompt(workflow.file);
    
    await streamingSummaryService.generateSummaryStream(
      prompt,
      apiKey,
      {
        onChunk: (text, charDelay) => {
          this.store.updateStageStreamingText(
            workflowId,
            'summary',
            text,
            charDelay
          );
        },
        onComplete: (fullText, metadata) => {
          this.store.setStageResult(
            workflowId,
            'summary',
            fullText,
            {
              promptTokens: metadata.promptTokens,
              candidatesTokens: metadata.candidatesTokens,
              totalTokens: metadata.totalTokens
            }
          );
        },
        onError: (error) => {
          throw error;
        }
      }
    );
  }
  
  /**
   * Process flashcards with streaming
   */
  private async processFlashcardsWithStreaming(
    workflowId: string,
    apiKey: string
  ): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    const summaryText = workflow.stages.summary.result;
    
    if (!summaryText) {
      throw new Error('Summary must be completed first');
    }
    
    await streamingSummaryService.generateFlashcardsStream(
      summaryText,
      apiKey,
      {
        onChunk: (text, charDelay) => {
          this.store.updateStageStreamingText(
            workflowId,
            'flashcards',
            text,
            charDelay
          );
        },
        onComplete: (fullText, metadata) => {
          this.store.setStageResult(
            workflowId,
            'flashcards',
            fullText,
            {
              promptTokens: metadata.promptTokens,
              candidatesTokens: metadata.candidatesTokens,
              totalTokens: metadata.totalTokens
            }
          );
        },
        onError: (error) => {
          throw error;
        }
      }
    );
  }
}
```

### 5. Enhanced Store

```typescript
interface StageState {
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;
  result?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  stats?: GenerationStats;
  // New streaming fields
  isStreaming?: boolean;
  streamingText?: string;
  charDelay?: number;
}

// New actions in store
interface WorkflowStore {
  // ... existing actions ...
  
  setStageStreaming: (
    workflowId: string,
    stage: StageType,
    isStreaming: boolean
  ) => void;
  
  updateStageStreamingText: (
    workflowId: string,
    stage: StageType,
    text: string,
    charDelay: number
  ) => void;
  
  cancelStageStreaming: (
    workflowId: string,
    stage: StageType
  ) => void;
}
```

## Data Flow

### Streaming Flow

```
User initiates generation
    ↓
WorkflowProcessor.processStageWithStreaming()
    ↓
streamingSummaryService.generateSummaryStream()
    ↓
Initialize GoogleGenAI chat session
    ↓
Call chat.sendMessageStream()
    ↓
For each chunk received:
    ├─ Calculate adaptive char delay
    ├─ Update total text
    ├─ Call onChunk callback
    └─ Store updates streamingText and charDelay
    ↓
UI renders StreamingText component
    ├─ requestAnimationFrame loop
    ├─ Calculate chars to render
    ├─ Update displayed text
    └─ Show cursor if still streaming
    ↓
Stream completes
    ├─ Extract usage metadata
    ├─ Call onComplete callback
    └─ Store marks stage as completed
```

### Cancellation Flow

```
User clicks cancel button
    ↓
WorkflowProcessor.cancelStageStreaming()
    ↓
streamingSummaryService.cancel()
    ↓
AbortController.abort()
    ↓
Stream loop detects abort signal
    ↓
Throw 'Aborted' error
    ↓
onError callback called
    ↓
Store marks stage as error
    ↓
UI shows error message with retry button
```

## Error Handling

### Error Types and Recovery

1. **Network Errors**
   - **Detection**: FetchError or network timeout
   - **UI**: "Error de red. Verifica tu conexión."
   - **Recovery**: Retry button, automatic retry with exponential backoff

2. **API Key Errors**
   - **Detection**: 401 status or "API key not valid" message
   - **UI**: "API Key inválida. Configura tu API Key."
   - **Recovery**: Link to settings page

3. **Quota Exceeded**
   - **Detection**: 429 status or "quota" in error message
   - **UI**: "Cuota excedida. Intenta más tarde."
   - **Recovery**: Pause all workflows, show estimated wait time

4. **Cancellation**
   - **Detection**: AbortController signal
   - **UI**: "Cancelado por el usuario"
   - **Recovery**: Retry button to restart generation

5. **Stream Interruption**
   - **Detection**: Stream ends prematurely without completion
   - **UI**: "Stream interrumpido. Intenta nuevamente."
   - **Recovery**: Automatic retry once, then manual retry button

## Testing Strategy

### Unit Tests

1. **StreamingText Component**
   - Test typewriter effect with different char delays
   - Test reset when text changes
   - Test completion callback
   - Test cleanup on unmount

2. **Streaming Service**
   - Test chunk processing
   - Test adaptive delay calculation
   - Test error mapping
   - Test cancellation

3. **Store Actions**
   - Test streaming state updates
   - Test text accumulation
   - Test completion handling

### Integration Tests

1. **End-to-End Streaming**
   - Test complete summary generation with streaming
   - Test complete flashcard generation with streaming
   - Test cancellation mid-stream
   - Test error recovery

2. **Multiple Workflows**
   - Test simultaneous streaming in multiple workflows
   - Test independent cancellation
   - Test resource cleanup

### E2E Tests

1. **Happy Path**
   - User uploads file
   - Sees streaming summary
   - Sees streaming flashcards
   - All complete successfully

2. **Cancellation**
   - User starts generation
   - Cancels mid-stream
   - Retries successfully

3. **Error Recovery**
   - Network error occurs
   - User sees error message
   - User retries
   - Completes successfully

## Performance Considerations

### Optimization Strategies

1. **requestAnimationFrame**
   - Use RAF instead of setTimeout for smooth 60fps animation
   - Accumulate time between frames
   - Render multiple characters per frame when needed

2. **Memoization**
   - Memoize StreamingText component with React.memo
   - Use useCallback for event handlers
   - Use useMemo for expensive calculations

3. **Ref Usage**
   - Use refs for frequently changing values (textIndex, frameTime)
   - Avoid state updates for animation frame values
   - Minimize re-renders

4. **Cleanup**
   - Cancel animation frames on unmount
   - Abort streams on component unmount
   - Clear timers and listeners

5. **Throttling**
   - Throttle store updates to max 60fps
   - Batch multiple chunk updates if they arrive too fast
   - Debounce localStorage writes

## Accessibility

### ARIA Support

1. **Live Regions**
   - Use `aria-live="polite"` for streaming text
   - Use `aria-atomic="false"` to announce only new content
   - Announce completion status

2. **Labels**
   - `aria-label` for streaming indicator
   - `aria-label` for cancel button
   - `aria-label` for progress status

3. **Keyboard Navigation**
   - Cancel button accessible via keyboard
   - Focus management during streaming
   - Escape key to cancel

4. **Screen Reader Announcements**
   - Announce when streaming starts
   - Announce when streaming completes
   - Announce errors clearly

## Migration Strategy

### Phase 1: Core Streaming Implementation
1. Create StreamingText component
2. Create streamingSummaryService
3. Add streaming support to geminiClient
4. Update store with streaming fields

### Phase 2: Workflow Integration
1. Update WorkflowProcessor with streaming methods
2. Integrate StreamingText in StageCard
3. Add cancel buttons
4. Test with single workflow

### Phase 3: Multi-Workflow Support
1. Test simultaneous streaming
2. Add resource management
3. Optimize performance
4. Add comprehensive error handling

### Phase 4: Polish and Testing
1. Add accessibility features
2. Optimize animations
3. Add E2E tests
4. Performance profiling

## Dependencies

### Existing Dependencies
- `@google/genai` - Already installed
- `react` - Already installed
- `zustand` - Already installed
- `framer-motion` - Already installed (for additional animations)

### No New Dependencies Required
All functionality can be implemented with existing dependencies.

## Deployment Considerations

1. **Feature Flag**
   - Add `ENABLE_STREAMING` environment variable
   - Allow gradual rollout
   - Easy rollback if issues occur

2. **Monitoring**
   - Log streaming start/complete events
   - Track average streaming duration
   - Monitor cancellation rate
   - Track error rates by type

3. **Performance Metrics**
   - Measure time to first chunk
   - Measure total streaming duration
   - Monitor frame rate during streaming
   - Track memory usage

4. **Rollout Strategy**
   - Beta test with 10% of users
   - Monitor metrics for 1 week
   - Gradual increase to 50%, then 100%
   - Keep fallback to non-streaming mode
