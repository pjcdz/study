import { GoogleGenAI, Chat, Part } from '@google/genai';
import { prompts } from '@/lib/config/prompts';

const PRIMARY_MODEL = 'gemini-2.5-flash';
const FALLBACK_MODEL = 'gemini-2.5-flash-lite';

interface UsageMetadata {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

interface StreamingCallbacks {
  onChunk: (text: string, charDelay: number) => void;
  onComplete: (fullText: string, metadata: UsageMetadata) => void;
  onError: (error: Error) => void;
}

/**
 * Service for streaming content generation with Gemini API
 */
class StreamingSummaryService {
  private abortController: AbortController | null = null;
  
  /**
   * Initialize GoogleGenAI client
   */
  private initializeClient(apiKey: string): GoogleGenAI {
    return new GoogleGenAI({ apiKey });
  }
  
  /**
   * Generate summary with streaming from file
   */
  async generateSummaryStreamFromFile(
    file: File,
    apiKey: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      const ai = this.initializeClient(apiKey);
      
      // Convert file to base64
      const buffer = await file.arrayBuffer();
      const base64 = Buffer.from(buffer).toString('base64');
      
      // Create parts for multimodal request
      const parts: Part[] = [
        { text: prompts.notionPrompt },
        {
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        }
      ];
      
      await this.processStream(ai, parts, callbacks);
      
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
   * Generate summary with streaming from multiple files
   */
  async generateSummaryStreamFromMultipleFiles(
    files: File[],
    apiKey: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      const ai = this.initializeClient(apiKey);
      
      // Create parts for multimodal request with multiple files
      const parts: Part[] = [
        { text: prompts.notionPrompt + '\n\nAnaliza y resume el contenido de todos los archivos siguientes de manera integral:' }
      ];
      
      // Add all files as inline data
      for (const file of files) {
        const buffer = await file.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        
        parts.push({
          inlineData: {
            data: base64,
            mimeType: file.type
          }
        });
      }
      
      await this.processStream(ai, parts, callbacks);
      
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
   * Generate summary with streaming from text
   */
  async generateSummaryStreamFromText(
    text: string,
    apiKey: string,
    callbacks: StreamingCallbacks
  ): Promise<void> {
    this.abortController = new AbortController();
    
    try {
      const ai = this.initializeClient(apiKey);
      
      const parts: Part[] = [
        { text: prompts.notionPrompt },
        { text: `Contenido a resumir:\n\n${text}` }
      ];
      
      await this.processStream(ai, parts, callbacks);
      
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
    this.abortController = new AbortController();
    
    try {
      const ai = this.initializeClient(apiKey);
      
      const parts: Part[] = [
        { text: prompts.flashcardPrompt },
        { text: `Contenido del resumen:\n\n${summaryText}` }
      ];
      
      await this.processStream(ai, parts, callbacks);
      
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
   * Process stream with adaptive char delay calculation and model fallback
   */
  private async processStream(
    ai: GoogleGenAI,
    parts: Part[],
    callbacks: StreamingCallbacks
  ): Promise<void> {
    let lastError: any = null;
    
    // Try primary model first, then fallback
    for (const modelName of [PRIMARY_MODEL, FALLBACK_MODEL]) {
      try {
        const stream = await ai.models.generateContentStream({
          model: modelName,
          contents: { parts },
          config: {
            temperature: 1,
            topP: 0.8,
            topK: 40
          }
        });
        
        if (modelName === FALLBACK_MODEL) {
          console.log(`⚠️ Using fallback model: ${FALLBACK_MODEL}`);
        }
        
        let totalText = '';
        let lastChunkTime = performance.now();
        let smoothedCharDelay = 20; // Start with default 20ms
        const smoothingFactor = 0.4; // More reactive smoothing
        let usageMetadata: any = null;
        
        for await (const chunk of stream) {
          // Check if aborted
          if (this.abortController?.signal.aborted) {
            throw new Error('Aborted');
          }
          
          // Extract usage metadata from first chunk that has it
          if (chunk.usageMetadata && !usageMetadata) {
            usageMetadata = chunk.usageMetadata;
          }
          
          const now = performance.now();
          const newText = chunk.text;
          
          if (!newText) continue;
          
          // Calculate adaptive char delay based on stream speed
          const deltaTime = now - lastChunkTime;
          const deltaChars = newText.length;
          
          if (deltaTime > 1 && deltaChars > 0) {
            const charsPerSecond = (deltaChars / deltaTime) * 1000;
            const newCharDelay = 1000 / charsPerSecond;
            
            // Apply exponential moving average for smoothing
            smoothedCharDelay = (smoothingFactor * newCharDelay) + 
                               ((1 - smoothingFactor) * smoothedCharDelay);
          }
          
          totalText += newText;
          lastChunkTime = now;
          
          // Call chunk callback with updated text and adaptive delay
          callbacks.onChunk(totalText, Math.max(0.1, smoothedCharDelay));
        }
        
        // Call complete callback with final text and metadata
        callbacks.onComplete(totalText, {
          promptTokens: usageMetadata?.promptTokenCount || 0,
          candidatesTokens: usageMetadata?.candidatesTokenCount || 0,
          totalTokens: usageMetadata?.totalTokenCount || 0
        });
        
        // Success - exit the loop
        return;
        
      } catch (error: any) {
        lastError = error;
        
        // Check if we should try fallback
        const shouldTryFallback = 
          (error.message?.includes('overloaded') ||
           error.message?.includes('503') ||
           error.message?.includes('UNAVAILABLE') ||
           error.status === 503) &&
          modelName === PRIMARY_MODEL;
        
        if (!shouldTryFallback) {
          // Don't try fallback for other errors or if we're already on fallback
          throw error;
        }
        
        console.log(`Model ${modelName} failed, trying fallback...`);
      }
    }
    
    // If we get here, all models failed
    throw lastError;
  }
  
  /**
   * Cancel current streaming operation
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('Streaming cancelled by user');
    }
  }
  
  /**
   * Map errors to user-friendly messages
   */
  private mapError(error: any): Error {
    console.error('Streaming error:', error);
    
    // API Key errors
    if (error.message?.includes('API key not valid') || 
        error.message?.includes('API key is missing') ||
        error.message?.includes('API_KEY_INVALID')) {
      return new Error('API Key inválida. Verifica tu configuración en Ajustes.');
    }
    
    // Quota exceeded
    if (error.message?.includes('quota') || 
        error.status === 429 ||
        error.message?.includes('RESOURCE_EXHAUSTED')) {
      return new Error('Cuota excedida. Intenta más tarde o verifica tu límite de uso.');
    }
    
    // Service unavailable
    if (error.message?.includes('503') || 
        error.message?.includes('Service Unavailable') ||
        error.message?.includes('overloaded') ||
        error.message?.includes('UNAVAILABLE')) {
      return new Error('El servicio de Gemini está temporalmente sobrecargado. Intenta de nuevo en unos momentos.');
    }
    
    // Network errors
    if (error.name === 'FetchError' || 
        error.code === 'ENOTFOUND' ||
        error.message?.includes('network')) {
      return new Error('Error de red. Verifica tu conexión a internet.');
    }
    
    // Default error
    return new Error(error.message || 'Error desconocido al generar contenido');
  }
}

// Export singleton instance
export const streamingSummaryService = new StreamingSummaryService();
export type { StreamingCallbacks, UsageMetadata };
