'use client';

import { toast } from 'sonner';
import React from 'react';

// Definimos los tipos de error que podemos manejar
export enum ApiErrorType {
  INVALID_API_KEY = 'invalid_api_key',
  QUOTA_EXCEEDED = 'quota_exceeded',
  NETWORK_ERROR = 'network_error',
  UNKNOWN_ERROR = 'unknown_error',
}

type ErrorDetails = {
  componentName?: string;
  operation?: string;
  extraContext?: Record<string, any>;
};

type ApiErrorHandlerProps = {
  error: string;
  errorType?: ApiErrorType;
};

/**
 * Maneja errores de API
 */
export const captureAPIError = (
  error: Error | unknown,
  message: string = 'Ha ocurrido un error al procesar tu solicitud',
  details?: ErrorDetails
) => {
  console.error('Error API:', error);
  
  // Mensaje amigable para el usuario
  toast.error(message);
  
  // Log error with additional context
  console.error('API Error Details:', {
    error,
    message,
    ...details
  });
};

/**
 * HOF para envolver funciones asíncronas con manejo de errores automático
 */
export const withErrorHandling = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options: {
    message?: string;
    componentName?: string;
    operation?: string;
    showToast?: boolean;
  } = {}
) => {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      const { message = 'Ha ocurrido un error', showToast = true } = options;
      
      if (showToast) {
        toast.error(message);
      }
      
      console.error('Function Error:', {
        error,
        functionName: fn.name,
        args: JSON.stringify(args),
        ...options
      });
      
      return undefined;
    }
  };
};

// Definir interfaz para las props del ErrorBoundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode; 
  componentName?: string;
}

// Definir interfaz para el state
interface ErrorBoundaryState {
  hasError: boolean;
}

/**
 * Componente de límite de error para usar en componentes específicos
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('React Component Error:', {
      error,
      componentStack: errorInfo.componentStack,
      componentName: this.props.componentName
    });
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <div>Algo salió mal. Intenta recargar la página.</div>;
    }
    return this.props.children;
  }
}

export function ApiErrorHandler({ error, errorType }: ApiErrorHandlerProps) {
  // Determine error type from message if not explicitly provided
  const getErrorType = (): ApiErrorType => {
    if (errorType) return errorType;
    
    if (error.includes('API Key inválida') || error.includes('401') || error.includes('sin autorización')) {
      return ApiErrorType.INVALID_API_KEY;
    }
    if (error.includes('cuota') || error.includes('429') || error.includes('límite')) {
      return ApiErrorType.QUOTA_EXCEEDED;
    }
    if (error.includes('red') || error.includes('conexión') || error.includes('network')) {
      return ApiErrorType.NETWORK_ERROR;
    }
    return ApiErrorType.UNKNOWN_ERROR;
  };
  
  const type = getErrorType();
  
  switch (type) {
    case ApiErrorType.INVALID_API_KEY:
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-600 font-medium">Error de API Key</h3>
          <p className="mb-2">La API Key proporcionada no es válida o no tiene permisos para acceder a la API de Gemini.</p>
          <p className="text-sm">
            Solución: Verifica tu API Key en{' '}
            <a href="https://aistudio.google.com/" className="text-primary underline" target="_blank" rel="noopener">
              Google AI Studio
            </a>{' '}
            y asegúrate de que esté correctamente configurada.
          </p>
        </div>
      );
      
    case ApiErrorType.QUOTA_EXCEEDED:
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <h3 className="text-yellow-600 font-medium">Límite de cuota excedido</h3>
          <p className="mb-2">Has excedido el límite de uso para tu API Key.</p>
          <p className="text-sm">
            Solución: Espera un tiempo antes de intentar nuevamente o revisa tus límites de cuota en{' '}
            <a href="https://console.cloud.google.com/" className="text-primary underline" target="_blank" rel="noopener">
              Google Cloud Console
            </a>.
          </p>
        </div>
      );
      
    case ApiErrorType.NETWORK_ERROR:
      return (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded">
          <h3 className="text-blue-600 font-medium">Error de conexión</h3>
          <p className="mb-2">No se pudo establecer conexión con el servidor.</p>
          <p className="text-sm">
            Solución: Verifica tu conexión a internet e inténtalo de nuevo en unos momentos.
          </p>
        </div>
      );
      
    default:
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-600 font-medium">Error</h3>
          <p>{error}</p>
        </div>
      );
  }
}