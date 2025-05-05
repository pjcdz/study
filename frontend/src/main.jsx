import React from 'react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Configuración de ErrorBoundary para capturar errores
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Loguear el error a la consola
    console.error('Error en la aplicación React:', error);
    console.error('Stack trace:', errorInfo.componentStack);
    this.setState({ errorInfo });

    // También podríamos enviar el error a un servicio de reporte
    // reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px auto', 
          maxWidth: '600px', 
          backgroundColor: '#fff1f0',
          border: '1px solid #ffccc7',
          borderRadius: '8px' 
        }}>
          <h1 style={{ color: '#cf1322' }}>Algo salió mal</h1>
          <p style={{ marginBottom: '16px' }}>La aplicación ha encontrado un error inesperado.</p>
          <details style={{ whiteSpace: 'pre-wrap', marginBottom: '16px' }}>
            <summary>Detalles del error (para desarrollo)</summary>
            <p style={{ color: '#ff4d4f', fontFamily: 'monospace' }}>
              {this.state.error?.toString()}
            </p>
            <p style={{ color: '#595959', fontFamily: 'monospace', fontSize: '12px' }}>
              {this.state.errorInfo?.componentStack}
            </p>
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              backgroundColor: '#ff4d4f',
              color: 'white',
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reiniciar aplicación
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Configuración del manejo global de errores de promesa no capturados
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled Promise Rejection:', event.reason);
});

// Sobreescribir los métodos de console para que sean más visibles
const originalConsoleError = console.error;
console.error = (...args) => {
  originalConsoleError('%c[ERROR]', 'color: red; font-weight: bold;', ...args);
};

const originalConsoleWarn = console.warn;
console.warn = (...args) => {
  originalConsoleWarn('%c[WARNING]', 'color: orange; font-weight: bold;', ...args);
};

// Registrar eventos importantes del ciclo de vida
console.log('%c[STARTUP] Iniciando aplicación React...', 'color: blue; font-weight: bold;');

const container = document.getElementById('root');
if (!container) {
  console.error('No se encontró el elemento root para montar la aplicación');
} else {
  console.log('[MOUNT] Montando aplicación en el elemento root');
  
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
  
  console.log('%c[READY] Aplicación montada correctamente', 'color: green; font-weight: bold;');
}
