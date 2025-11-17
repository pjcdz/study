// Tipos de errores que se corresponden con los del backend
export enum ApiErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_API_KEY = 'INVALID_API_KEY',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE', // Añadido para manejar archivos grandes
  FILE_PROCESSING_FAILED = 'FILE_PROCESSING_FAILED', // Añadido para manejar fallos en el procesamiento de archivos
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Import mock data for demo mode
import { mockSummaryResponse, mockFlashcardsResponse, mockCondensedSummaryResponse } from './mock-data';

// Import streaming types
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

// Error personalizado con tipo
export class ApiError extends Error {
  type: ApiErrorType;

  constructor(message: string, type: ApiErrorType = ApiErrorType.UNKNOWN_ERROR) {
    super(message);
    this.type = type;
    this.name = 'ApiError';
    
    // Necesario para que instanceof funcione con clases personalizadas
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

class ApiClient {
  private baseUrl: string;
  private useDemoContent: boolean;
  
  constructor() {
    const isClient = typeof window !== 'undefined';
    
    // Check if demo content mode is enabled - give priority to env variable if explicitly set
    if (process.env.USE_DEMO_CONTENT === 'false') {
      // Explicitly disabled by environment variable - this takes precedence
      this.useDemoContent = false;
      
      // Clear any localStorage setting that might be causing confusion
      if (isClient && window.localStorage.getItem('USE_DEMO_CONTENT') === 'true') {
        console.log('🧪 Demo mode: Clearing localStorage value as env variable is set to false');
        window.localStorage.removeItem('USE_DEMO_CONTENT');
      }
    } else {
      // Otherwise check both env var and localStorage (for backwards compatibility)
      this.useDemoContent = process.env.USE_DEMO_CONTENT === 'true' || 
                           (isClient && window.localStorage.getItem('USE_DEMO_CONTENT') === 'true');
    }
    
    if (this.useDemoContent) {
      console.log('🧪 API Client initialized in DEMO mode - using mock data');
    }
    
    if (isClient) {
      // In browser environment, we need to use API routes instead of direct access
      // because browser can't resolve Docker service names
      const protocol = window.location.protocol;
      const hostname = window.location.hostname;
      
      // Use local API route which will proxy to the backend
      this.baseUrl = `${protocol}//${hostname}${window.location.port ? ':' + window.location.port : ''}/api`;
      console.log('API Client initialized with baseUrl:', this.baseUrl);
      
      // Test connection automatically on startup
      if (!this.useDemoContent) {
        setTimeout(() => {
          this.testConnection().catch(err => 
            console.warn('Initial connection test failed, will retry on actual requests:', err)
          );
        }, 2000);
      }
    } else {
      // Server-side rendering context
      // For SSR/SSG, use the environment variable or default to Docker service name
      this.baseUrl = process.env.BACKEND_URL || 'http://backend:4000';
      console.log('API Client (server-side) initialized with baseUrl:', this.baseUrl);
    }
  }
  
  // Helper function to add delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  // Get user API key from local storage
  private getUserApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('studyToolUserApiKey');
  }
  
  // Test the connection to make sure our backend is reachable
  public async testConnection(): Promise<boolean> {
    // Always return true in demo mode
    if (this.useDemoContent) {
      console.log('🧪 Demo mode: Skipping connection test, returning true');
      return true;
    }
    
    try {
      console.log(`Testing connection to ${this.baseUrl}/health`);
      const response = await fetch(`${this.baseUrl}/health`, { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });
      
      if (!response.ok) {
        throw new Error(`Health check failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Health check result:', data);
      
      console.log('Connection test successful');
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
  
  // Process a summary with multimodal support
  async processSummary(content: string | FormData, apiKey?: string) {
    // Return mock data in demo mode with a simulated delay
    if (this.useDemoContent) {
      console.log('🧪 Demo mode: Returning mock summary data');
      await this.delay(1500);
      return mockSummaryResponse;
    }
    
    try {
      // Get API key from parameter or from local storage
      const userApiKey = apiKey || this.getUserApiKey();
      if (!userApiKey) {
        throw new ApiError('API Key no configurada. Por favor, configura tu API Key en Ajustes.', ApiErrorType.INVALID_API_KEY);
      }
      
      let options: RequestInit = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-User-API-Key': userApiKey
        }
      };
      
      // Handle both string content and FormData
      if (typeof content === 'string') {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json'
        };
        options.body = JSON.stringify({ textPrompt: content });
      } else {
        // For FormData, don't set Content-Type header - browser will set it with correct boundary
        options.body = content;
      }
      
      console.log('Sending multimodal content to backend');
      const response = await fetch(`${this.baseUrl}/summary`, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP Error ${response.status}`,
          errorType: ApiErrorType.UNKNOWN_ERROR
        }));
        
        // Map backend error types to client error types
        const errorType = errorData.errorType || ApiErrorType.UNKNOWN_ERROR;
        throw new ApiError(errorData.error || errorData.message || `Error ${response.status}`, errorType as ApiErrorType);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in processSummary:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(`Error de red al conectar con la API: ${error.message}`, ApiErrorType.NETWORK_ERROR);
      }
      
      throw new ApiError((error as Error).message || 'Error desconocido en el cliente API');
    }
  }
  
  // Process flashcards with multimodal support
  async processFlashcards(content: string | FormData, apiKey?: string) {
    // Return mock data in demo mode with a simulated delay
    if (this.useDemoContent) {
      console.log('🧪 Demo mode: Returning mock flashcards data');
      await this.delay(1200);
      return mockFlashcardsResponse;
    }
    
    try {
      // Get API key from parameter or from local storage
      const userApiKey = apiKey || this.getUserApiKey();
      if (!userApiKey) {
        throw new ApiError('API Key no configurada. Por favor, configura tu API Key en Ajustes.', ApiErrorType.INVALID_API_KEY);
      }
      
      let options: RequestInit = {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'X-User-API-Key': userApiKey
        }
      };
      
      // Handle both string content and FormData
      if (typeof content === 'string') {
        options.headers = {
          ...options.headers,
          'Content-Type': 'application/json'
        };
        options.body = JSON.stringify({ textPrompt: content });
      } else {
        // For FormData, don't set Content-Type header
        options.body = content;
      }
      
      console.log('Sending multimodal content to backend for flashcards');
      const response = await fetch(`${this.baseUrl}/flashcards`, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP Error ${response.status}`,
          errorType: ApiErrorType.UNKNOWN_ERROR
        }));
        
        const errorType = errorData.errorType || ApiErrorType.UNKNOWN_ERROR;
        throw new ApiError(errorData.error || errorData.message || `Error ${response.status}`, errorType as ApiErrorType);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in processFlashcards:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(`Error de red al conectar con la API: ${error.message}`, ApiErrorType.NETWORK_ERROR);
      }
      
      throw new ApiError((error as Error).message || 'Error desconocido en el cliente API');
    }
  }
  
  // For backward compatibility
  async postSummary(content: string) {
    console.warn('DEPRECATED: postSummary() is deprecated. Please use processSummary() instead.');
    return this.processSummary(content);
  }
  
  // For backward compatibility
  async postFlashcards(markdown: string) {
    console.warn('DEPRECATED: postFlashcards() is deprecated. Please use processFlashcards() instead.');
    return this.processFlashcards(markdown);
  }

  async condenseSummary(markdownContent: string, condensationType: 'shorter' | 'clarity' | 'examples' = 'shorter', apiKey?: string) {
    // Return a condensed version of the mock data in demo mode
    if (this.useDemoContent) {
      console.log('🧪 Demo mode: Returning mock condensed summary');
      await this.delay(1000);
      return mockCondensedSummaryResponse;
    }
    
    try {
      // Get API key from parameter or from local storage
      const userApiKey = apiKey || this.getUserApiKey();
      if (!userApiKey) {
        throw new ApiError('API Key no configurada. Por favor, configura tu API Key en Ajustes.', ApiErrorType.INVALID_API_KEY);
      }
      
      console.log(`Sending condensing request, summary length: ${markdownContent.length}`);
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-User-API-Key': userApiKey
        },
        body: JSON.stringify({ markdownContent, condensationType }),
      };
      
      console.log(`Sending POST request to ${this.baseUrl}/summary/condense`);
      const response = await fetch(`${this.baseUrl}/summary/condense`, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP Error ${response.status}`,
          errorType: ApiErrorType.UNKNOWN_ERROR
        }));
        
        const errorType = errorData.errorType || ApiErrorType.UNKNOWN_ERROR;
        throw new ApiError(errorData.error || errorData.message || `Error ${response.status}`, errorType as ApiErrorType);
      }
      
      // Get the response data
      const responseData = await response.json();
      
      // Map notionMarkdown to condensedSummary for frontend consistency
      return {
        condensedSummary: responseData.notionMarkdown,
        stats: responseData.stats
      };
    } catch (error) {
      console.error('Error in condenseSummary:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(`Error de red al conectar con la API: ${error.message}`, ApiErrorType.NETWORK_ERROR);
      }
      
      throw new ApiError((error as Error).message || 'Error desconocido en el cliente API');
    }
  }

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
          'API Key no configurada. Por favor, configura tu API Key en Ajustes.',
          ApiErrorType.INVALID_API_KEY
        );
      }
      
      // Import streaming service dynamically
      const { streamingSummaryService } = await import('@/lib/services/streamingSummaryService');
      
      // Handle different content types
      if (typeof content === 'string') {
        // Text content
        await streamingSummaryService.generateSummaryStreamFromText(
          content,
          userApiKey,
          {
            onChunk: callbacks.onChunk,
            onComplete: callbacks.onComplete,
            onError: (error) => callbacks.onError(this.convertToApiError(error))
          }
        );
      } else {
        // FormData with file(s)
        // Check for files with pattern file0, file1, etc.
        let foundFile: File | null = null;
        
        // Try to find any file in the FormData
        for (const [key, value] of content.entries()) {
          if (value instanceof File) {
            foundFile = value;
            break;
          }
        }
        
        if (foundFile) {
          console.log('Found file for streaming:', foundFile.name);
          await streamingSummaryService.generateSummaryStreamFromFile(
            foundFile,
            userApiKey,
            {
              onChunk: callbacks.onChunk,
              onComplete: callbacks.onComplete,
              onError: (error) => callbacks.onError(this.convertToApiError(error))
            }
          );
        } else {
          // Try text prompt from FormData
          const textPrompt = content.get('textPrompt') as string;
          if (textPrompt && textPrompt.trim()) {
            console.log('Using text prompt for streaming');
            await streamingSummaryService.generateSummaryStreamFromText(
              textPrompt,
              userApiKey,
              {
                onChunk: callbacks.onChunk,
                onComplete: callbacks.onComplete,
                onError: (error) => callbacks.onError(this.convertToApiError(error))
              }
            );
          } else {
            throw new ApiError('No se encontró contenido para procesar', ApiErrorType.UNKNOWN_ERROR);
          }
        }
      }
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
          'API Key no configurada. Por favor, configura tu API Key en Ajustes.',
          ApiErrorType.INVALID_API_KEY
        );
      }
      
      // Import streaming service dynamically
      const { streamingSummaryService } = await import('@/lib/services/streamingSummaryService');
      
      // Use streaming service
      await streamingSummaryService.generateFlashcardsStream(
        summaryText,
        userApiKey,
        {
          onChunk: callbacks.onChunk,
          onComplete: callbacks.onComplete,
          onError: (error) => callbacks.onError(this.convertToApiError(error))
        }
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
          'API Key no configurada. Por favor, configura tu API Key en Ajustes.',
          ApiErrorType.INVALID_API_KEY
        );
      }
      
      // Import streaming service dynamically
      const { streamingSummaryService } = await import('@/lib/services/streamingSummaryService');
      
      // Build condense prompt
      const prompt = `Por favor, condensa el siguiente resumen manteniendo los puntos clave más importantes. Hazlo más breve pero sin perder información esencial:\n\n${markdownContent}`;
      
      // Use streaming service with text generation
      await streamingSummaryService.generateSummaryStreamFromText(
        prompt,
        userApiKey,
        {
          onChunk: callbacks.onChunk,
          onComplete: callbacks.onComplete,
          onError: (error) => callbacks.onError(this.convertToApiError(error))
        }
      );
    } catch (error) {
      this.handleStreamingError(error, callbacks);
    }
  }
  
  /**
   * Helper: Convert Error to ApiError
   */
  private convertToApiError(error: Error): ApiError {
    if (error instanceof ApiError) {
      return error;
    }
    
    // Map common error messages to ApiErrorType
    if (error.message.includes('API Key inválida') || error.message.includes('API key')) {
      return new ApiError(error.message, ApiErrorType.INVALID_API_KEY);
    }
    if (error.message.includes('Cuota excedida') || error.message.includes('quota')) {
      return new ApiError(error.message, ApiErrorType.QUOTA_EXCEEDED);
    }
    if (error.message.includes('Error de red') || error.message.includes('network')) {
      return new ApiError(error.message, ApiErrorType.NETWORK_ERROR);
    }
    
    return new ApiError(error.message, ApiErrorType.UNKNOWN_ERROR);
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
        new ApiError('Error de red. Verifica tu conexión.', ApiErrorType.NETWORK_ERROR)
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

  // Get the status of files being processed by the Files API
  async getFileProcessingStatus(apiKey?: string) {
    // In demo mode, simulate with sample data
    if (this.useDemoContent) {
      await this.delay(500);
      return {
        fileStatus: {
          'demo_file_1.pdf': 'PROCESSED',
          'demo_file_2.pdf': 'PROCESSING'
        }
      };
    }
    
    try {
      // Get API key from parameter or from local storage
      const userApiKey = apiKey || this.getUserApiKey();
      if (!userApiKey) {
        throw new ApiError('API Key no configurada. Por favor, configura tu API Key en Ajustes.', ApiErrorType.INVALID_API_KEY);
      }
      
      const options = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-User-API-Key': userApiKey
        }
      };
      
      const response = await fetch(`${this.baseUrl}/files/status`, options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP Error ${response.status}`,
          errorType: ApiErrorType.UNKNOWN_ERROR
        }));
        
        const errorType = errorData.errorType || ApiErrorType.UNKNOWN_ERROR;
        throw new ApiError(errorData.error || errorData.message || `Error ${response.status}`, errorType as ApiErrorType);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in getFileProcessingStatus:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(`Error de red al conectar con la API: ${error.message}`, ApiErrorType.NETWORK_ERROR);
      }
      
      throw new ApiError((error as Error).message || 'Error desconocido en el cliente API');
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;