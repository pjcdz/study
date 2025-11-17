# Design Document: Streaming Implementation for Simple Flow

## Overview

Este diseño implementa streaming en tiempo real para el flujo simple (no-workflow) de generación de resúmenes y flashcards. Actualmente, el streaming solo existe en el sistema de workflows, pero las páginas simples (upload → summary → flashcards) usan llamadas API tradicionales sin streaming. Este diseño reutiliza los componentes y servicios existentes de streaming para proporcionar una experiencia consistente en ambos flujos.

### Key Design Principles

1. **Reutilización de Código**: Usar componentes y servicios de streaming existentes (StreamingText, streamingSummaryService)
2. **Compatibilidad hacia Atrás**: Mantener métodos API existentes mientras se agregan versiones con streaming
3. **Consistencia de UX**: Misma experiencia de streaming en workflows y flujo simple
4. **Modo Demo**: Mantener compatibilidad con modo demo existente
5. **Performance**: Optimizar para evitar re-renders innecesarios

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Simple Flow Pages                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Upload Page                                          │  │
│  │    - File upload                                      │  │
│  │    - Navigate to Summary with streaming               │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Summary Page                                         │  │
│  │    - StreamingText Component                          │  │
│  │    - Generate Flashcards (streaming)                  │  │
│  │    - Condense Summary (streaming)                     │  │
│  │    - Cancel Button                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Flashcards Page                                      │  │
│  │    - Display generated flashcards                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   Upload Store (Enhanced)                    │
│  - Streaming state fields                                    │
│  - Streaming text buffers                                    │
│  - charDelay tracking                                        │
│  - Actions for streaming updates                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              API Client (Enhanced)                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Traditional Methods (existing)                       │  │
│  │    - processSummary()                                 │  │
│  │    - processFlashcards()                              │  │
│  │    - condenseSummary()                                │  │
│  └───────────────────────────────────────────────────────┘  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  NEW: Streaming Methods                               │  │
│  │    - processSummaryStream()                           │  │
│  │    - processFlashcardsStream()                        │  │
│  │    - condenseSummaryStream()                          │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│         Streaming Summary Service (Reused)                   │
│  - generateSummaryStream()                                   │
│  - generateFlashcardsStream()                                │
│  - Adaptive char delay calculation                           │
│  - Usage metadata extraction                                 │
│  - Error handling                                            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              Google GenAI SDK                                │
│  - Chat Session with streaming                              │
│  - sendMessageStream()                                       │
│  - Chunk processing                                          │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Enhanced Upload Store

#### New State Fields

```typescript
interface UploadStore {
  // ... existing fields ...
  
  // NEW: Streaming state for simple flow
  isStreamingSummary: boolean;
  isStreamingFlashcards: boolean;
  isStreamingCondense: boolean;
  
  // NEW: Temporary streaming text
  streamingSummaryText: string;
  streamingFlashcardsText: string;
  
  // NEW: Current char delay for typewriter effect
  currentCharDelay: number;
  
  // NEW: Streaming control
  abortStreamingController: AbortController | null;
  
  // NEW: Usage metadata
  lastUsageMetadata: {
    promptTokens: number;
    candidatesTokens: number;
    totalTokens: number;
  } | null;
}
```

#### New Actions

```typescript
interface UploadStoreActions {
  // ... existing actions ...
  
  // NEW: Streaming control actions
  setStreamingSummary: (isStreaming: boolean) => void;
  setStreamingFlashcards: (isStreaming: boolean) => void;
  setStreamingCondense: (isStreaming: boolean) => void;
  
  // NEW: Update streaming text
  updateStreamingSummaryText: (text: string, charDelay: number) => void;
  updateStreamingFlashcardsText: (text: string, charDelay: number) => void;
  
  // NEW: Complete streaming
  completeStreamingSummary: (finalText: string, metadata: UsageMetadata) => void;
  completeStreamingFlashcards: (finalText: string, metadata: UsageMetadata) => void;
  completeStreamingCondense: (finalText: string, metadata: UsageMetadata) => void;
  
  // NEW: Cancel streaming
  cancelStreaming: () => void;
  
  // NEW: Clear streaming state
  clearStreamingState: () => void;
}
```

### 2. Enhanced API Client

#### New Streaming Methods

```typescript
// lib/api-client.ts

interface StreamingCallbacks {
  onChunk: (text: string, charDelay: number) => void;
  onComplete: (fullText: string, metadata: UsageMetadata) => void;
  onError: (error: ApiError) => void;
}

interface UsageMetadata {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

class ApiClient {
  // ... existing methods ...
  
  /**
   * Process summary with streaming support
   */
  async processSummaryStream(
    content: string | FormData,
    callbacks: StreamingCallbacks,
    apiKey?: string
  ): Promise<void> {
    // Handle demo mode
    if (this.useDemoContent) {
      return this.simulateSummaryStream(callbacks);
    }
    
    try {
      const userApiKey = apiKey || this.getUserApiKey();
      if (!userApiKey) {
        throw new ApiError(
          'API Key no configurada',
          ApiErrorType.INVALID_API_KEY
        );
      }
      
      // Import streaming service
      const { streamingSummaryService } = await import('@/lib/services/streamingSummaryService');
      
      // Build prompt from content
      const prompt = await this.buildPromptFromContent(content);
      
      // Use streaming service
      await streamingSummaryService.generateSummaryStream(
        prompt,
        userApiKey,
        callbacks
      );
    } catch (error) {
      this.handleStreamingError(error, callbacks);
    }
  }
  
  /**
   * Process flashcards with streaming support
   */
  async processFlashcardsStream(
    summaryText: string,
    callbacks: StreamingCallbacks,
    apiKey?: string
  ): Promise<void> {
    // Handle demo mode
    if (this.useDemoContent) {
      return this.simulateFlashcardsStream(callbacks);
    }
    
    try {
      const userApiKey = apiKey || this.getUserApiKey();
      if (!userApiKey) {
        throw new ApiError(
          'API Key no configurada',
          ApiErrorType.INVALID_API_KEY
        );
      }
      
      // Import streaming service
      const { streamingSummaryService } = await import('@/lib/services/streamingSummaryService');
      
      // Use streaming service
      await streamingSummaryService.generateFlashcardsStream(
        summaryText,
        userApiKey,
        callbacks
      );
    } catch (error) {
      this.handleStreamingError(error, callbacks);
    }
  }
  
  /**
   * Condense summary with streaming support
   */
  async condenseSummaryStream(
    markdownContent: string,
    callbacks: StreamingCallbacks,
    apiKey?: string
  ): Promise<void> {
    // Handle demo mode
    if (this.useDemoContent) {
      return this.simulateCondenseStream(callbacks);
    }
    
    try {
      const userApiKey = apiKey || this.getUserApiKey();
      if (!userApiKey) {
        throw new ApiError(
          'API Key no configurada',
          ApiErrorType.INVALID_API_KEY
        );
      }
      
      // Import streaming service
      const { streamingSummaryService } = await import('@/lib/services/streamingSummaryService');
      
      // Build condense prompt
      const prompt = this.buildCondensePrompt(markdownContent);
      
      // Use streaming service
      await streamingSummaryService.generateSummaryStream(
        prompt,
        userApiKey,
        callbacks
      );
    } catch (error) {
      this.handleStreamingError(error, callbacks);
    }
  }
  
  /**
   * Helper: Build prompt from content (string or FormData)
   */
  private async buildPromptFromContent(content: string | FormData): Promise<string> {
    if (typeof content === 'string') {
      return content;
    }
    
    // For FormData, extract text or process file
    // This is a simplified version - actual implementation would need
    // to handle file extraction similar to backend
    const textPrompt = content.get('textPrompt');
    if (textPrompt && typeof textPrompt === 'string') {
      return textPrompt;
    }
    
    throw new Error('Cannot extract prompt from FormData for streaming');
  }
  
  /**
   * Helper: Build condense prompt
   */
  private buildCondensePrompt(markdownContent: string): Promise<string> {
    return `Por favor, condensa el siguiente resumen manteniendo los puntos clave:\n\n${markdownContent}`;
  }
  
  /**
   * Helper: Handle streaming errors
   */
  private handleStreamingError(error: any, callbacks: StreamingCallbacks): void {
    console.error('Streaming error:', error);
    
    if (error instanceof ApiError) {
      callbacks.onError(error);
    } else if (error instanceof TypeError && error.message.includes('fetch')) {
      callbacks.onError(
        new ApiError('Error de red', ApiErrorType.NETWORK_ERROR)
      );
    } else {
      callbacks.onError(
        new ApiError(error.message || 'Error desconocido', ApiErrorType.UNKNOWN_ERROR)
      );
    }
  }
  
  /**
   * Demo mode: Simulate summary streaming
   */
  private async simulateSummaryStream(callbacks: StreamingCallbacks): Promise<void> {
    console.log('🧪 Demo mode: Simulating summary stream');
    
    const mockText = mockSummaryResponse.notionMarkdown;
    const chunkSize = 50;
    const delayBetweenChunks = 100;
    
    let accumulatedText = '';
    
    for (let i = 0; i < mockText.length; i += chunkSize) {
      const chunk = mockText.substring(i, i + chunkSize);
      accumulatedText += chunk;
      
      // Calculate adaptive char delay
      const charDelay = (delayBetweenChunks / chunkSize);
      
      callbacks.onChunk(accumulatedText, charDelay);
      
      await this.delay(delayBetweenChunks);
    }
    
    callbacks.onComplete(mockText, {
      promptTokens: 1500,
      candidatesTokens: 800,
      totalTokens: 2300
    });
  }
  
  /**
   * Demo mode: Simulate flashcards streaming
   */
  private async simulateFlashcardsStream(callbacks: StreamingCallbacks): Promise<void> {
    console.log('🧪 Demo mode: Simulating flashcards stream');
    
    const mockText = mockFlashcardsResponse.flashcards;
    const chunkSize = 40;
    const delayBetweenChunks = 80;
    
    let accumulatedText = '';
    
    for (let i = 0; i < mockText.length; i += chunkSize) {
      const chunk = mockText.substring(i, i + chunkSize);
      accumulatedText += chunk;
      
      const charDelay = (delayBetweenChunks / chunkSize);
      
      callbacks.onChunk(accumulatedText, charDelay);
      
      await this.delay(delayBetweenChunks);
    }
    
    callbacks.onComplete(mockText, {
      promptTokens: 1200,
      candidatesTokens: 600,
      totalTokens: 1800
    });
  }
  
  /**
   * Demo mode: Simulate condense streaming
   */
  private async simulateCondenseStream(callbacks: StreamingCallbacks): Promise<void> {
    console.log('🧪 Demo mode: Simulating condense stream');
    
    const mockText = mockCondensedSummaryResponse.condensedSummary;
    const chunkSize = 45;
    const delayBetweenChunks = 90;
    
    let accumulatedText = '';
    
    for (let i = 0; i < mockText.length; i += chunkSize) {
      const chunk = mockText.substring(i, i + chunkSize);
      accumulatedText += chunk;
      
      const charDelay = (delayBetweenChunks / chunkSize);
      
      callbacks.onChunk(accumulatedText, charDelay);
      
      await this.delay(delayBetweenChunks);
    }
    
    callbacks.onComplete(mockText, {
      promptTokens: 1000,
      candidatesTokens: 500,
      totalTokens: 1500
    });
  }
}
```

### 3. Enhanced Summary Page

#### Integration with Streaming

```typescript
// app/[locale]/summary/page.tsx

function NavigationAwareSummaryContent() {
  const { 
    summaries,
    currentSummaryIndex,
    isStreamingSummary,
    isStreamingFlashcards,
    isStreamingCondense,
    streamingSummaryText,
    currentCharDelay,
    updateStreamingSummaryText,
    completeStreamingSummary,
    setStreamingFlashcards,
    updateStreamingFlashcardsText,
    completeStreamingFlashcards,
    setStreamingCondense,
    completeStreamingCondense,
    cancelStreaming,
    addSummary,
    setFlashcards,
    setCurrentStep
  } = useUploadStore();
  
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isCondensing, setIsCondensing] = useState(false);
  
  // ... existing code ...
  
  /**
   * Generate flashcards with streaming
   */
  const handleGenerateFlashcards = async () => {
    try {
      setIsGeneratingFlashcards(true);
      setStreamingFlashcards(true);
      startProcessing();
      
      const originalSummary = summaries[0];
      
      await apiClient.processFlashcardsStream(
        originalSummary,
        {
          onChunk: (text, charDelay) => {
            updateStreamingFlashcardsText(text, charDelay);
          },
          onComplete: (fullText, metadata) => {
            // Clean TSV format
            let tsv = fullText;
            if (tsv.startsWith('```tsv')) {
              tsv = tsv.replace(/```tsv\n|\n```/g, '');
            }
            
            completeStreamingFlashcards(tsv, metadata);
            setFlashcards(tsv);
            setCurrentStep('flashcards');
            
            toast.success(t('toast.success'));
            
            // Navigate to flashcards page
            setTimeout(() => {
              const pathParts = window.location.pathname.split('/');
              const locale = pathParts[1];
              router.push(`/${locale}/flashcards`);
            }, 200);
          },
          onError: (error) => {
            handleStreamingError(error);
          }
        }
      );
    } catch (err) {
      console.error('Error generating flashcards:', err);
    } finally {
      stopProcessing();
      setIsGeneratingFlashcards(false);
    }
  };
  
  /**
   * Condense summary with streaming
   */
  const handleCondenseSummary = async () => {
    try {
      if (summaries.length >= 3) {
        toast.info(t('toast.maxVersionsReached'));
        return;
      }
      
      setIsCondensing(true);
      setStreamingCondense(true);
      startProcessing();
      
      const currentSummary = getCurrentSummary();
      
      await apiClient.condenseSummaryStream(
        currentSummary,
        {
          onChunk: (text, charDelay) => {
            updateStreamingSummaryText(text, charDelay);
          },
          onComplete: (fullText, metadata) => {
            completeStreamingCondense(fullText, metadata);
            addSummary(fullText);
            
            toast.success(t('toast.condensed'));
          },
          onError: (error) => {
            handleStreamingError(error);
          }
        }
      );
    } catch (err) {
      console.error('Error condensing summary:', err);
    } finally {
      stopProcessing();
      setIsCondensing(false);
    }
  };
  
  /**
   * Handle streaming errors
   */
  const handleStreamingError = (error: ApiError) => {
    switch(error.type) {
      case ApiErrorType.QUOTA_EXCEEDED:
        toast.error(t('toast.quotaExceeded'));
        break;
      case ApiErrorType.NETWORK_ERROR:
        toast.error(t('toast.networkError'));
        break;
      case ApiErrorType.INVALID_API_KEY:
        toast.error(t('toast.apiKeyError'));
        break;
      default:
        toast.error(t('toast.error', { message: error.message }));
    }
  };
  
  /**
   * Cancel streaming
   */
  const handleCancelStreaming = () => {
    cancelStreaming();
    toast.info(t('toast.cancelled'));
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-grow pb-20">
        <div className="container max-w-4xl py-6 mx-auto">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>{t('title')}</CardTitle>
              <CardDescription>{t('description')}</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div>
                {/* Show streaming text or completed summary */}
                {(isStreamingSummary || isStreamingCondense) ? (
                  <div className="min-h-[300px] rounded-md border p-4 bg-muted">
                    <StreamingText
                      textToType={streamingSummaryText}
                      charDelay={currentCharDelay}
                      isStreaming={true}
                    />
                  </div>
                ) : (
                  <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted">
                    <pre className="font-mono text-sm whitespace-pre-wrap">
                      {getCurrentSummary()}
                    </pre>
                  </ScrollArea>
                )}
                
                {/* Cancel button during streaming */}
                {(isStreamingSummary || isStreamingCondense || isStreamingFlashcards) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelStreaming}
                    className="mt-2"
                  >
                    <X className="mr-2 h-4 w-4" />
                    {t('actions.cancel')}
                  </Button>
                )}
              </div>
              
              {/* ... rest of the UI ... */}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Fixed footer with buttons */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t">
        <div className="container max-w-4xl mx-auto flex justify-center space-x-4 py-4">
          <Button
            size="lg"
            disabled={isCondensing || isGeneratingFlashcards || isStreamingSummary}
            onClick={handleCondenseSummary}
            variant="outline"
          >
            {isCondensing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('actions.condensing')} ({displayTime})
              </>
            ) : (
              <>
                <Minimize className="mr-2 h-4 w-4" />
                {t('actions.condense')}
              </>
            )}
          </Button>
          
          <Button
            size="lg"
            disabled={isCondensing || isGeneratingFlashcards || isStreamingSummary}
            onClick={handleGenerateFlashcards}
          >
            {isGeneratingFlashcards ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('actions.generating')} ({displayTime})
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {t('actions.generateFlashcards')}
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
```

### 4. Enhanced Upload Page

#### Streaming on Initial Summary Generation

```typescript
// app/[locale]/upload/page.tsx

const handleSubmit = async () => {
  try {
    setIsProcessing(true);
    startProcessing();
    
    // Navigate to summary page immediately
    const locale = pathname.split('/')[1];
    router.push(`/${locale}/summary`);
    
    // Start streaming summary generation
    setStreamingSummary(true);
    
    await apiClient.processSummaryStream(
      formData,
      {
        onChunk: (text, charDelay) => {
          updateStreamingSummaryText(text, charDelay);
        },
        onComplete: (fullText, metadata) => {
          completeStreamingSummary(fullText, metadata);
          toast.success(t('toast.success'));
        },
        onError: (error) => {
          handleStreamingError(error);
          // Navigate back to upload on error
          router.push(`/${locale}/upload`);
        }
      }
    );
  } catch (err) {
    console.error('Error processing upload:', err);
  } finally {
    setIsProcessing(false);
    stopProcessing();
  }
};
```

## Data Flow

### Summary Generation Flow (Upload → Summary)

```
User uploads file
    ↓
Upload page: handleSubmit()
    ↓
Navigate to Summary page immediately
    ↓
apiClient.processSummaryStream()
    ↓
streamingSummaryService.generateSummaryStream()
    ↓
For each chunk:
    ├─ Calculate adaptive char delay
    ├─ Call onChunk callback
    └─ Store: updateStreamingSummaryText()
    ↓
Summary page renders StreamingText component
    ├─ requestAnimationFrame loop
    ├─ Display text progressively
    └─ Show streaming cursor
    ↓
Stream completes:
    ├─ Call onComplete callback
    ├─ Store: completeStreamingSummary()
    └─ Show action buttons
```

### Flashcards Generation Flow

```
User clicks "Generate Flashcards"
    ↓
Summary page: handleGenerateFlashcards()
    ↓
apiClient.processFlashcardsStream()
    ↓
streamingSummaryService.generateFlashcardsStream()
    ↓
For each chunk:
    ├─ Calculate adaptive char delay
    ├─ Call onChunk callback
    └─ Store: updateStreamingFlashcardsText()
    ↓
Show streaming in modal or inline
    ├─ StreamingText component
    └─ Show streaming cursor
    ↓
Stream completes:
    ├─ Call onComplete callback
    ├─ Store: completeStreamingFlashcards()
    ├─ Clean TSV format
    ├─ Save to store
    └─ Navigate to Flashcards page
```

### Condense Summary Flow

```
User clicks "Condense more"
    ↓
Summary page: handleCondenseSummary()
    ↓
apiClient.condenseSummaryStream()
    ↓
streamingSummaryService.generateSummaryStream()
    ↓
For each chunk:
    ├─ Calculate adaptive char delay
    ├─ Call onChunk callback
    └─ Store: updateStreamingSummaryText()
    ↓
Replace ScrollArea with StreamingText
    ├─ Show streaming text
    └─ Show streaming cursor
    ↓
Stream completes:
    ├─ Call onComplete callback
    ├─ Store: completeStreamingCondense()
    ├─ Add to summaries array
    └─ Switch back to ScrollArea
```

## Error Handling

### Error Types and Recovery

1. **Network Errors**
   - **Detection**: FetchError or network timeout
   - **UI**: Toast with "Error de red. Verifica tu conexión."
   - **Recovery**: Retry button, stay on current page

2. **API Key Errors**
   - **Detection**: ApiErrorType.INVALID_API_KEY
   - **UI**: Toast with "API Key inválida. Configura tu API Key."
   - **Recovery**: Link to settings page

3. **Quota Exceeded**
   - **Detection**: ApiErrorType.QUOTA_EXCEEDED
   - **UI**: Toast with "Cuota excedida. Intenta más tarde."
   - **Recovery**: Disable generation buttons temporarily

4. **Cancellation**
   - **Detection**: User clicks cancel button
   - **UI**: Toast with "Cancelado por el usuario"
   - **Recovery**: Clear streaming state, enable buttons

5. **Stream Interruption**
   - **Detection**: Stream ends without completion
   - **UI**: Toast with "Stream interrumpido. Intenta nuevamente."
   - **Recovery**: Retry button

## Performance Considerations

### Optimization Strategies

1. **Reuse Existing Components**
   - Use StreamingText component from workflows
   - Use streamingSummaryService for all streaming
   - Avoid duplicating streaming logic

2. **Throttle Store Updates**
   - Limit store updates to 60fps max
   - Batch multiple chunk updates if needed
   - Use refs for high-frequency values

3. **Memoization**
   - Memoize StreamingText with React.memo
   - Use useCallback for event handlers
   - Use useMemo for expensive calculations

4. **Cleanup**
   - Cancel animation frames on unmount
   - Abort streams on navigation
   - Clear timers and listeners

5. **Lazy Loading**
   - Dynamically import streamingSummaryService
   - Load only when streaming is needed
   - Reduce initial bundle size

## Testing Strategy

### Unit Tests

1. **API Client Streaming Methods**
   - Test processSummaryStream with callbacks
   - Test processFlashcardsStream with callbacks
   - Test condenseSummaryStream with callbacks
   - Test demo mode simulation
   - Test error handling

2. **Store Actions**
   - Test streaming state updates
   - Test text accumulation
   - Test completion handling
   - Test cancellation

### Integration Tests

1. **Summary Page Streaming**
   - Test initial summary generation
   - Test flashcards generation
   - Test summary condensation
   - Test cancellation
   - Test error recovery

2. **Upload to Summary Flow**
   - Test file upload with streaming
   - Test navigation during streaming
   - Test completion and display

### E2E Tests

1. **Happy Path**
   - Upload file → see streaming summary
   - Generate flashcards → see streaming
   - Condense summary → see streaming
   - All complete successfully

2. **Error Scenarios**
   - Network error during streaming
   - API key error
   - Quota exceeded
   - User cancellation

3. **Demo Mode**
   - All streaming works with mock data
   - Same UI and behavior as real mode

## Migration Strategy

### Phase 1: Core Infrastructure
1. Add streaming fields to Upload Store
2. Add streaming methods to API Client
3. Add demo mode simulation methods

### Phase 2: Summary Page Integration
1. Integrate StreamingText component
2. Add streaming for flashcards generation
3. Add streaming for summary condensation
4. Add cancel button

### Phase 3: Upload Page Integration
1. Add streaming for initial summary
2. Handle navigation during streaming
3. Handle errors and recovery

### Phase 4: Polish and Testing
1. Add accessibility features
2. Optimize performance
3. Add comprehensive tests
4. Test demo mode thoroughly

## Dependencies

### Existing Dependencies (Reused)
- `components/streaming/streaming-text.tsx` - Already exists
- `lib/services/streamingSummaryService.ts` - Already exists
- `@google/genai` - Already installed
- `zustand` - Already installed

### No New Dependencies Required
All functionality uses existing dependencies and components.

## Deployment Considerations

1. **Backward Compatibility**
   - Keep existing non-streaming methods
   - Gradual migration to streaming
   - Easy rollback if issues occur

2. **Feature Flag**
   - Add `ENABLE_SIMPLE_FLOW_STREAMING` env variable
   - Allow gradual rollout
   - Test with subset of users first

3. **Monitoring**
   - Log streaming start/complete events
   - Track streaming duration
   - Monitor error rates
   - Track cancellation rate

4. **Performance Metrics**
   - Measure time to first chunk
   - Monitor frame rate during streaming
   - Track memory usage
   - Compare with non-streaming performance
