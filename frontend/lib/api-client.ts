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
  
  constructor() {
    const isClient = typeof window !== 'undefined';
    
    if (isClient) {
      // In browser context, the API must be accessed through the same host
      // but on port 4000, which is mapped in docker-compose
      const hostname = window.location.hostname;
      
      // When accessing via browser, we need to use the port that's exposed to the host
      // not the internal Docker network
      this.baseUrl = `http://${hostname}:4000`;
      
      console.log('API Client initialized with baseUrl:', this.baseUrl);
    } else {
      // Server-side context - inside Docker network
      this.baseUrl = 'http://backend:4000';
    }
  }
  
  async postSummary(content: string) {
    try {
      console.log(`Sending POST request to ${this.baseUrl}/summary`);
      
      const response = await fetch(`${this.baseUrl}/summary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // Change 'content' to 'filesText' to match backend expectation
        body: JSON.stringify({ filesText: content }),
        mode: 'cors' // Use CORS mode but don't include credentials
      });
      
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
      console.log(`Sending POST request to ${this.baseUrl}/flashcards`);
      
      const response = await fetch(`${this.baseUrl}/flashcards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ notionMarkdown: markdown }),
        mode: 'cors' // Use CORS mode but don't include credentials
      });
      
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