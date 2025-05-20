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
  private baseUrl: string;
  
  constructor() {
    const isClient = typeof window !== 'undefined';
    
    if (isClient) {
      // Use the environment variable if set, otherwise construct URL based on current host
      if (process.env.NEXT_PUBLIC_API_URL) {
        this.baseUrl = process.env.NEXT_PUBLIC_API_URL; // Should be https://study.cardozo.com.ar/api
      } else {
        // Use the current domain with /api path
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        this.baseUrl = `${protocol}//${hostname}/api`;
      }
      
      console.log('API Client initialized with baseUrl:', this.baseUrl);
      
      // Test connection automatically on startup
      this.testConnection().catch(err => 
        console.warn('Initial connection test failed, will retry on actual requests:', err)
      );
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
  
  // Test the connection to make sure our backend is reachable
  public async testConnection(): Promise<boolean> {
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
      };
      
      console.log(`Sending POST request to ${this.baseUrl}/summary`);
      const response = await fetch(`${this.baseUrl}/summary`, options);
      
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
      };
      
      const response = await fetch(`${this.baseUrl}/flashcards`, options);
      
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