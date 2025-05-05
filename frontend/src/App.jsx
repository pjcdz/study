import React, { useState, useEffect, useRef } from "react";
import UploadPane from "./features/upload/components/UploadPane";
import MarkdownPane from "./features/summary/components/MarkdownPane";
import FlashcardPane from "./features/flashcards/components/FlashcardPane";
import AccessibilityOptions from "./shared/components/accessibility/AccessibilityOptions";
import { AccessibilityProvider, useAccessibility } from "./shared/components/accessibility/AccessibilityContext";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer, toast } from 'react-toastify';
// Import icons for navigation
import { FiUpload, FiFileText, FiLayers, FiRefreshCw } from 'react-icons/fi';
import "./App.css";
import './mobile-fixes.css';

function AppContent() {
  const { t, theme, language } = useAccessibility(); // Hook para acceder a traducciones y tema
  
  // Load persisted state or defaults with proper type handling
  const [currentStep, setCurrentStep] = useState(() => {
    const savedStep = localStorage.getItem('currentStep');
    return savedStep ? Number(savedStep) : 1;
  });
  
  const [notionMarkdown, setNotionMarkdown] = useState(() => {
    const savedMarkdown = localStorage.getItem('notionMarkdown');
    return savedMarkdown || null;
  });
  
  const [flashcardsTSV, setFlashcardsTSV] = useState(() => {
    const savedTSV = localStorage.getItem('flashcardsTSV');
    return savedTSV || null;
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [processingTime, setProcessingTime] = useState(0);
  const processingTimerRef = useRef(null);

  // Persist state in localStorage with improved error handling
  useEffect(() => {
    try {
      if (notionMarkdown) {
        localStorage.setItem('notionMarkdown', notionMarkdown);
      } else {
        localStorage.removeItem('notionMarkdown');
      }
    } catch (error) {
      console.error('Error saving markdown to localStorage:', error);
    }
  }, [notionMarkdown]);
  
  useEffect(() => {
    try {
      if (flashcardsTSV) {
        localStorage.setItem('flashcardsTSV', flashcardsTSV);
      } else {
        localStorage.removeItem('flashcardsTSV');
      }
    } catch (error) {
      console.error('Error saving flashcards to localStorage:', error);
    }
  }, [flashcardsTSV]);
  
  useEffect(() => {
    try {
      localStorage.setItem('currentStep', String(currentStep));
    } catch (error) {
      console.error('Error saving current step to localStorage:', error);
    }
  }, [currentStep]);

  // Effect to update processing time when loading
  useEffect(() => {
    if (isLoading) {
      // Reset timer when loading starts
      setProcessingTime(0);
      const startTime = Date.now();
      
      // Update time every 10ms to show milliseconds
      processingTimerRef.current = setInterval(() => {
        setProcessingTime(Date.now() - startTime);
      }, 10);
    } else {
      // Clear timer when loading ends
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    }
    
    // Cleanup timer on unmount
    return () => {
      if (processingTimerRef.current) {
        clearInterval(processingTimerRef.current);
        processingTimerRef.current = null;
      }
    };
  }, [isLoading]);

  // Test API connectivity on component mount
  useEffect(() => {
    async function testApiConnection() {
      try {
        console.log("Testing API health endpoint...");
        const response = await fetch('/api/health');
        const responseText = await response.text();
        
        console.log("API health response:", {
          status: response.status,
          statusText: response.statusText,
          responseText
        });
        
        try {
          const data = JSON.parse(responseText);
          setApiStatus({ connected: true, status: data.status, message: data.message });
        } catch (parseError) {
          console.error("Error parsing health check response:", parseError);
          setApiStatus({ connected: false, error: "Invalid JSON response from health check" });
        }
      } catch (error) {
        console.error("API health check failed:", error);
        setApiStatus({ connected: false, error: error.message });
      }
    }
    
    testApiConnection();
  }, []);

  // Handle the generated summary from UploadPane
  const handleSummaryGenerated = (markdown) => {
    try {
      // Validación de entrada
      if (!markdown) {
        console.error("App: Recibido markdown vacío o inválido");
        toast.error("Error: El resumen generado está vacío");
        return;
      }
      
      console.log(`App: Recibido markdown de longitud: ${markdown.length}`);
      
      // Sanitización básica - asegurémonos de que sea una cadena de texto
      const sanitizedMarkdown = String(markdown);
      
      // Actualizar el estado de manera segura con un retraso mínimo
      // para asegurar que React complete el ciclo de renderizado
      setTimeout(() => {
        try {
          console.log("App: Actualizando estado con el markdown");
          setNotionMarkdown(sanitizedMarkdown);
          
          // Pequeño retraso adicional para asegurar que el estado se actualice
          // antes de cambiar la vista
          setTimeout(() => {
            setCurrentStep(2);
            toast.success("Resumen generado correctamente");
            console.log("App: Navegación a paso 2 completada");
          }, 50);
        } catch (stateError) {
          console.error("App: Error al actualizar estado:", stateError);
          toast.error("Error interno al procesar el resumen");
        }
      }, 50);
    } catch (error) {
      console.error("App: Error general en handleSummaryGenerated:", error);
      toast.error(`Error al procesar el resumen: ${error.message}`);
    }
  };

  // Handle the generated flashcards from MarkdownPane
  const handleFlashcardsGenerated = (tsv) => {
    try {
      if (!tsv) {
        console.error("App: Recibido TSV vacío o inválido");
        toast.error("Error: Las flashcards generadas están vacías");
        return;
      }
      
      console.log(`App: Recibido TSV de longitud: ${tsv.length}`);
      
      // Sanitización básica
      const sanitizedTSV = String(tsv);
      
      // Actualizar estado de manera segura
      setTimeout(() => {
        try {
          console.log("App: Actualizando estado con el TSV");
          setFlashcardsTSV(sanitizedTSV);
          
          setTimeout(() => {
            setCurrentStep(3);
            toast.success("Flashcards generadas correctamente");
            console.log("App: Navegación a paso 3 completada");
          }, 50);
        } catch (stateError) {
          console.error("App: Error al actualizar estado:", stateError);
          toast.error("Error interno al procesar las flashcards");
        }
      }, 50);
    } catch (error) {
      console.error("App: Error general en handleFlashcardsGenerated:", error);
      toast.error(`Error al procesar flashcards: ${error.message}`);
    }
  };

  // Reset the application to the initial state
  const handleReset = () => {
    try {
      setNotionMarkdown(null);
      setFlashcardsTSV(null);
      setCurrentStep(1);
      localStorage.removeItem('notionMarkdown');
      localStorage.removeItem('flashcardsTSV');
      localStorage.removeItem('currentStep');
      console.log("Aplicación reiniciada");
    } catch (error) {
      console.error("Error al reiniciar la aplicación:", error);
      toast.error("Error al reiniciar la aplicación");
    }
  };
  
  // Verificar si hay datos disponibles para un paso
  const hasDataForStep = (step) => {
    if (step === 1) return true;
    if (step === 2) return notionMarkdown !== null;
    if (step === 3) return flashcardsTSV !== null;
    return false;
  };

  // Cambiar al paso seleccionado sin restricciones
  const handleStepChange = (step) => {
    console.log(`Cambiando al paso ${step}`);
    setCurrentStep(step);
  };

  // Format time for display
  const formatProcessingTime = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // Verificación de que los componentes reciben datos correctos
  useEffect(() => {
    console.log("Estado actual:", {
      currentStep,
      notionMarkdownLength: notionMarkdown ? notionMarkdown.length : 0,
      flashcardsTSVLength: flashcardsTSV ? flashcardsTSV.length : 0,
    });
  }, [currentStep, notionMarkdown, flashcardsTSV]);

  // Componente para mostrar cuando no hay datos disponibles
  const NoDataMessage = ({ stepNumber }) => (
    <div className="text-center p-8">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              {stepNumber === 2 ? 
                t('noSummaryYet') : 
                t('noFlashcardsYet')}
            </p>
          </div>
        </div>
      </div>
      
      <p className="text-neutral-600 mb-6">
        {stepNumber === 2 ? 
          t('goToUpload') : 
          t('goToSummary')}
      </p>
      
      <button 
        className="btn btn-primary"
        onClick={() => setCurrentStep(stepNumber === 2 ? 1 : 2)}
      >
        {stepNumber === 2 ? 
          t('goToUpload') : 
          t('goToSummary')}
      </button>
    </div>
  );

  return (
    <div className="app-container">
      {/* Loading Overlay */}
      {isLoading && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 100,
            color: 'white'
          }}
        >
          <div className="loading-spinner" style={{ width: '3rem', height: '3rem' }}></div>
          <p style={{ marginTop: '1rem' }}>{t('processing')} {formatProcessingTime(processingTime)}</p>
        </div>
      )}
      
      {/* API Status Banner - only show if there's an issue */}
      {apiStatus && !apiStatus.connected && (
        <div role="alert" style={{ 
          backgroundColor: '#fee2e2', 
          color: '#991b1b', 
          padding: 'var(--space-md)',
          textAlign: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 90
        }}>
          <p>{t('apiError')} {apiStatus.error}</p>
        </div>
      )}
      
      {/* Header */}
      <header className="p-4 text-center bg-white border-b border-neutral-200">
        <h1 className="text-2xl font-bold text-primary-color">{t('appName')}</h1>
        <p className="text-sm text-neutral-600">{t('appDescription')}</p>
      </header>

      {/* Main Content */}
      <main className="content-area">
        <div className="card w-full max-w-4xl mx-auto">
          {/* Progress indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2 progress-indicator-container">
              <span className="text-xs font-medium">{t('step')} {currentStep} {t('of')} 3</span>
              <button 
                className={`text-xs flex items-center ${(notionMarkdown || flashcardsTSV) ? 'text-white font-medium' : 'text-neutral-600'}`}
                onClick={handleReset}
                aria-label={t('startOver')}
                style={{
                  backgroundColor: (notionMarkdown || flashcardsTSV) ? 'var(--primary-light)' : 'transparent',
                  color: (notionMarkdown || flashcardsTSV) ? 'white' : 'var(--text-light)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  transition: 'all 0.2s ease',
                  minWidth: '90px', 
                  textAlign: 'center',
                  justifyContent: 'center'
                }}
              >
                <FiRefreshCw size={14} style={{ marginRight: '6px' }} /> {t('startOver')}
              </button>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${(currentStep / 3) * 100}%` }}></div>
            </div>
          </div>
          
          {/* Render current step pane */}
          {currentStep === 1 && 
            <UploadPane 
              onSummaryGenerated={handleSummaryGenerated} 
              setIsLoading={setIsLoading} 
            />
          }
          {currentStep === 2 && (
            hasDataForStep(2) ? 
              <MarkdownPane 
                notionMarkdown={notionMarkdown} 
                onFlashcardsGenerated={handleFlashcardsGenerated} 
                setIsLoading={setIsLoading} 
              /> : 
              <NoDataMessage stepNumber={2} />
          )}
          {currentStep === 3 && (
            hasDataForStep(3) ? 
              <FlashcardPane 
                flashcardsTSV={flashcardsTSV} 
              /> :
              <NoDataMessage stepNumber={3} />
          )}
        </div>
      </main>
      
      {/* Bottom navigation - now allows navigation to all tabs */}
      <nav id="bottom-nav" role="navigation" aria-label="Main Navigation">
        <button 
          className={currentStep === 1 ? 'active' : ''}
          onClick={() => handleStepChange(1)}
          aria-label={t('upload')}
          aria-current={currentStep === 1 ? 'page' : undefined}
        >
          <FiUpload size={20} aria-hidden="true" />
          <span>{t('upload')}</span>
        </button>
        <button 
          className={currentStep === 2 ? 'active' : ''}
          onClick={() => handleStepChange(2)}
          aria-label={t('summary')}
          aria-current={currentStep === 2 ? 'page' : undefined}
        >
          <FiFileText size={20} aria-hidden="true" />
          <span>{t('summary')}</span>
        </button>
        <button 
          className={currentStep === 3 ? 'active' : ''}
          onClick={() => handleStepChange(3)}
          aria-label={t('flashcards')}
          aria-current={currentStep === 3 ? 'page' : undefined}
        >
          <FiLayers size={20} aria-hidden="true" />
          <span>{t('flashcards')}</span>
        </button>
      </nav>

      {/* Componente de opciones de accesibilidad */}
      <AccessibilityOptions />

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
}

// Componente principal envuelto en el proveedor de accesibilidad
function App() {
  return (
    <AccessibilityProvider>
      <AppContent />
    </AccessibilityProvider>
  );
}

export default App;