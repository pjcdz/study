// Tipos de errores que se corresponden con los del backend
export enum ApiErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_API_KEY = 'INVALID_API_KEY',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
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
  private baseUrl: string
  private fallbackUrls: string[] = []
  private maxRetries: number = 3; // Max number of retries per URL
  private initialRetryDelay: number = 500; // Initial delay in ms (will be increased with each retry)
  private connectionEstablished: boolean = false; // Track if we've established a working connection
  
  constructor() {
    const isClient = typeof window !== 'undefined';
    
    // First, check if there's an environment variable available
    if (process.env.NEXT_PUBLIC_API_URL) {
      this.baseUrl = process.env.NEXT_PUBLIC_API_URL;
      console.log('API Client initialized with env baseUrl:', this.baseUrl);
      return;
    }
    
    if (isClient) {
      // In browser context, use the same protocol (HTTP or HTTPS) as the current page
      const protocol = window.location.protocol; // Will be 'https:' or 'http:'
      const hostname = window.location.hostname;
      
      // When accessing via browser, ensure we use the same protocol to avoid Mixed Content errors
      this.baseUrl = `${protocol}//${hostname}:4000`;
      
      // Setup fallback URLs to try if the main one fails
      // First try without the port (in case there's a reverse proxy)
      this.fallbackUrls = [
        `${protocol}//${hostname}/api`,
        `${protocol}//${hostname}`,
        // Add alternative protocols if needed
        protocol === 'https:' ? `http://${hostname}:4000` : `https://${hostname}:4000`,
        // Add additional fallbacks if needed
      ];
      
      console.log('API Client initialized with baseUrl:', this.baseUrl);
      console.log('Fallback URLs:', this.fallbackUrls);
    } else {
      // Server-side context - inside Docker network
      this.baseUrl = 'http://backend:4000';
    }
    
    // Check for localStorage preference from previous successful connections
    if (isClient && window.localStorage) {
      const savedBaseUrl = localStorage.getItem('api_baseurl');
      if (savedBaseUrl) {
        console.log('Using saved API URL from previous successful connection:', savedBaseUrl);
        this.baseUrl = savedBaseUrl;
      }
    }

    // Automatically try to establish connection on client-side
    if (isClient) {
      // Run async - don't block construction
      this.testConnection().catch(err => 
        console.warn('Initial connection test failed, will retry on actual requests:', err)
      );
    }
  }
  
  // Helper function to add delay
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private async fetchWithRetry(url: string, options: RequestInit, retries: number = 0): Promise<Response> {
    try {
      return await fetch(url, options);
    } catch (error) {
      if (retries < this.maxRetries) {
        const delayTime = this.initialRetryDelay * Math.pow(2, retries);
        console.log(`Retry ${retries + 1}/${this.maxRetries} for ${url} after ${delayTime}ms`);
        await this.delay(delayTime);
        return this.fetchWithRetry(url, options, retries + 1);
      }
      throw error;
    }
  }
  
  private async fetchWithFallbacks(endpoint: string, options: RequestInit) {
    let lastError: Error | null = null;
    
    // Try with the primary URL first
    try {
      const url = `${this.baseUrl}${endpoint}`;
      console.log(`Attempting request to: ${url}`);
      const response = await this.fetchWithRetry(url, options);
      if (response.ok && typeof window !== 'undefined' && window.localStorage) {
        // Save successful URL for future use
        localStorage.setItem('api_baseurl', this.baseUrl);
      }
      return response;
    } catch (error) {
      console.warn(`Failed to connect to primary URL: ${this.baseUrl}`, error);
      lastError = error as Error;
    }
    
    // If primary fails and we have fallbacks, try them sequentially
    if (this.fallbackUrls.length > 0) {
      for (const fallbackBase of this.fallbackUrls) {
        try {
          const url = `${fallbackBase}${endpoint}`;
          console.log(`Attempting fallback request to: ${url}`);
          const response = await this.fetchWithRetry(url, options);
          
          if (response.ok) {
            console.log(`Successfully connected to fallback: ${fallbackBase}`);
            // Update the baseUrl to use this working fallback for future requests
            this.baseUrl = fallbackBase;
            // Save successful URL for future use
            if (typeof window !== 'undefined' && window.localStorage) {
              localStorage.setItem('api_baseurl', fallbackBase);
            }
            return response;
          }
        } catch (error) {
          console.warn(`Failed to connect to fallback URL: ${fallbackBase}`, error);
          lastError = error as Error;
        }
      }
    }
    
    // If we get here, all attempts failed
    throw lastError || new Error('All connection attempts failed');
  }

  // Test the connection and find the best working endpoint early
  public async testConnection(): Promise<boolean> {
    if (this.connectionEstablished) return true;
    
    try {
      await this.fetchWithFallbacks('/health', { 
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        mode: 'cors' as RequestMode
      });
      
      this.connectionEstablished = true;
      console.log('Connection test successful using:', this.baseUrl);
      return true;
    } catch (error) {
      console.error('All connection attempts failed during test');
      return false;
    }
  }
  
  async postSummary(content: string) {
    try {
      console.log(`Sending content to backend, length: ${content.length}`);
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ filesText: content }),
        mode: 'cors' as RequestMode
      };
      
      console.log(`Sending POST request to ${this.baseUrl}/summary`);
      const response = await this.fetchWithFallbacks('/summary', options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP Error ${response.status}`,
          errorType: ApiErrorType.UNKNOWN_ERROR
        }));
        
        // Obtener el tipo de error del backend o asumir UNKNOWN_ERROR
        const errorType = errorData.errorType || ApiErrorType.UNKNOWN_ERROR;
        
        // Crear un error tipificado
        throw new ApiError(errorData.error || errorData.message || `Error ${response.status}`, errorType as ApiErrorType);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in postSummary:', error);
      
      // Si ya es un ApiError, simplemente reenvíalo
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Si es un error de red, transformarlo a un ApiError con tipo NETWORK_ERROR
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(`Network error connecting to API: ${error.message}`, ApiErrorType.NETWORK_ERROR);
      }
      
      // Cualquier otro error se considera desconocido
      throw new ApiError((error as Error).message || 'Unknown error in API client');
    }
  }
  
  async postFlashcards(markdown: string) {
    try {
      console.log(`Sending POST request for flashcards, markdown length: ${markdown.length}`);
      
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ notionMarkdown: markdown }),
        mode: 'cors' as RequestMode
      };
      
      const response = await this.fetchWithFallbacks('/flashcards', options);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ 
          message: `HTTP Error ${response.status}`,
          errorType: ApiErrorType.UNKNOWN_ERROR
        }));
        
        // Obtener el tipo de error del backend o asumir UNKNOWN_ERROR
        const errorType = errorData.errorType || ApiErrorType.UNKNOWN_ERROR;
        
        // Crear un error tipificado
        throw new ApiError(errorData.error || errorData.message || `Error ${response.status}`, errorType as ApiErrorType);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error in postFlashcards:', error);
      
      // Si ya es un ApiError, simplemente reenvíalo
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Si es un error de red, transformarlo a un ApiError con tipo NETWORK_ERROR
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new ApiError(`Network error connecting to API: ${error.message}`, ApiErrorType.NETWORK_ERROR);
      }
      
      // Cualquier otro error se considera desconocido
      throw new ApiError((error as Error).message || 'Unknown error in API client');
    }
  }
}

const apiClient = new ApiClient();
export default apiClient;