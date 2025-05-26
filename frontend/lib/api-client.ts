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
  
  // Process a summary with streaming support
  async processSummaryStream(content: string | FormData, onChunk: (chunk: string) => void, apiKey?: string): Promise<void> {
    // Return mock data in demo mode with streaming simulation
    if (this.useDemoContent) {
      console.log('🧪 Demo mode: Returning mock summary data with streaming');
      const mockText = mockSummaryResponse.notionMarkdown;
      const chunkSize = 50; // Characters per chunk
      let index = 0;
      
      const sendChunk = () => {
        if (index < mockText.length) {
          const chunk = mockText.slice(index, index + chunkSize);
          onChunk(chunk);
          index += chunkSize;
          
          // Send next chunk after a short delay
          setTimeout(sendChunk, 100);
        }
      };
      
      sendChunk();
      return;
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
      
      console.log('Starting streaming summary request to backend');
      const response = await fetch(`${this.baseUrl}/summary`, options);
      
      if (!response.ok) {
        const errorText = await response.text();
        if (errorText.startsWith('ERROR:')) {
          throw new ApiError(errorText.replace('ERROR: ', ''), ApiErrorType.UNKNOWN_ERROR);
        }
        throw new ApiError(`HTTP Error ${response.status}`, ApiErrorType.UNKNOWN_ERROR);
      }
      
      // Check if we have a stream
      if (!response.body) {
        throw new ApiError('No response body received', ApiErrorType.NETWORK_ERROR);
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          
          if (done) {
            break;
          }
          
          const chunk = decoder.decode(value, { stream: true });
          
          // Check for error in chunk
          if (chunk.startsWith('ERROR:')) {
            throw new ApiError(chunk.replace('ERROR: ', ''), ApiErrorType.UNKNOWN_ERROR);
          }
          
          onChunk(chunk);
        }
      } finally {
        reader.releaseLock();
      }
      
    } catch (error) {
      console.error('Error in processSummaryStream:', error);
      
      if (error instanceof ApiError) {
        throw error;
      }
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(`Error de red al conectar con la API: ${error.message}`, ApiErrorType.NETWORK_ERROR);
      }
      
      throw new ApiError((error as Error).message || 'Error desconocido en el cliente API');
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

  /**
   * Process summary with streaming support - enhanced version for FormData
   * @param {FormData} formData - Form data containing files and text
   * @param {function} onChunk - Callback function to handle each streaming chunk
   * @returns {Promise<string>} - The complete summary
   */
  async processSummaryStreaming(formData: FormData, onChunk: (chunk: string) => void): Promise<string> {
    // Return mock data in demo mode with streaming simulation
    if (this.useDemoContent) {
      console.log('🧪 Demo mode: Returning mock summary data with streaming');
      const mockText = mockSummaryResponse.notionMarkdown;
      const chunkSize = 50; // Characters per chunk
      let index = 0;
      let fullContent = '';
      
      const sendChunk = () => {
        if (index < mockText.length) {
          const chunk = mockText.slice(index, index + chunkSize);
          fullContent += chunk;
          onChunk(chunk);
          index += chunkSize;
          
          // Send next chunk after a short delay
          setTimeout(sendChunk, 100);
        }
      };
      
      sendChunk();
      // Wait for all chunks to be sent
      await new Promise(resolve => {
        const checkInterval = setInterval(() => {
          if (index >= mockText.length) {
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 200);
      });
      
      return fullContent;
    }

    console.log('Starting streaming summary request using enhanced method');
    
    const userApiKey = this.getUserApiKey();
    if (!userApiKey) {
      throw new ApiError('API Key no configurada', ApiErrorType.INVALID_API_KEY);
    }

    try {
      // Log all files in FormData for debugging
      if (formData) {
        console.log('FormData contents:');
        for (const pair of formData.entries()) {
          console.log(`- ${pair[0]}: ${pair[1] instanceof File ? 
            `${pair[1].name} (${Math.round(pair[1].size / 1024)}KB)` : 'text content'}`);
        }
      }
      
      // Set proper fetch options for streaming
      const response = await fetch(`${this.baseUrl}/summary`, {
        method: 'POST',
        headers: {
          'X-User-API-Key': userApiKey,
        },
        body: formData,
      });

      console.log(`Response status: ${response.status}`);
      
      if (!response.ok) {
        // Try to get detailed error information
        try {
          const errorData = await response.json();
          console.error('API error response:', errorData);
          const errorType = errorData.errorType || ApiErrorType.UNKNOWN_ERROR;
          throw new ApiError(errorData.error || errorData.message || `Error ${response.status}`, errorType as ApiErrorType);
        } catch (jsonError) {
          // If response is not JSON, try to get text
          const errorText = await response.text();
          console.error('API error text:', errorText);
          if (errorText.startsWith('ERROR:')) {
            throw new ApiError(errorText.replace('ERROR:', '').trim(), ApiErrorType.UNKNOWN_ERROR);
          }
          throw new ApiError(`HTTP Error ${response.status}`, ApiErrorType.UNKNOWN_ERROR);
        }
      }

      if (!response.body) {
        throw new ApiError('No response body received', ApiErrorType.NETWORK_ERROR);
      }

      // Enhanced streaming with better error handling and logging
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';
      let chunkCount = 0;

      console.log('Starting to read response stream');
      try {
        while (true) {
          console.log(`Reading chunk ${chunkCount + 1}...`);
          const { done, value } = await reader.read();
          
          if (done) {
            console.log(`Streaming complete, received ${chunkCount} chunks, total content length: ${fullContent.length}`);
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          chunkCount++;
          
          // Check for error messages in the stream
          if (chunk.startsWith('ERROR:')) {
            const errorMessage = chunk.replace('ERROR:', '').trim();
            throw new ApiError(errorMessage, ApiErrorType.UNKNOWN_ERROR);
          }

          console.log(`Received chunk #${chunkCount} (${chunk.length} chars): ${chunk.substring(0, 50)}${chunk.length > 50 ? '...' : ''}`);
          fullContent += chunk;
          
          // Ensure we call onChunk even for empty chunks (might be needed for keeping connection alive)
          onChunk(chunk);
        }
      } catch (readError) {
        console.error('Error reading from stream:', readError);
        const errorMessage = readError instanceof Error ? readError.message : 'Unknown stream reading error';
        throw new ApiError(`Error reading stream: ${errorMessage}`, ApiErrorType.NETWORK_ERROR);
      } finally {
        reader.releaseLock();
      }

      return fullContent;
    } catch (error) {
      console.error('Error in processSummaryStreaming:', error);
      
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