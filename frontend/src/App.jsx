import React, { useState, useEffect, useRef } from "react";
import UploadPane from "./features/upload/components/UploadPane";
import MarkdownPane from "./features/summary/components/MarkdownPane";
import FlashcardPane from "./features/flashcards/components/FlashcardPane";
import "./App.css";
import './mobile-fixes.css';
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';

function App() {
  // Load persisted state or defaults
  const [currentStep, setCurrentStep] = useState(() => Number(localStorage.getItem('currentStep')) || 1);
  const [notionMarkdown, setNotionMarkdown] = useState(() => localStorage.getItem('notionMarkdown'));
  const [flashcardsTSV, setFlashcardsTSV] = useState(() => localStorage.getItem('flashcardsTSV'));
  const [isLoading, setIsLoading] = useState(false);
  const [apiStatus, setApiStatus] = useState(null);
  const [processingTime, setProcessingTime] = useState(0);
  const processingTimerRef = useRef(null);

  // Persist notionMarkdown
  useEffect(() => {
    if (notionMarkdown) localStorage.setItem('notionMarkdown', notionMarkdown);
  }, [notionMarkdown]);
  // Persist flashcardsTSV
  useEffect(() => {
    if (flashcardsTSV) localStorage.setItem('flashcardsTSV', flashcardsTSV);
  }, [flashcardsTSV]);
  // Persist currentStep
  useEffect(() => {
    localStorage.setItem('currentStep', currentStep);
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
    setNotionMarkdown(markdown);
    setCurrentStep(2);
  };

  // Handle the generated flashcards from MarkdownPane
  const handleFlashcardsGenerated = (tsv) => {
    setFlashcardsTSV(tsv);
    setCurrentStep(3);
  };

  // Reset the application to the initial state
  const handleReset = () => {
    setNotionMarkdown(null);
    setFlashcardsTSV(null);
    setCurrentStep(1);
    localStorage.removeItem('notionMarkdown');
    localStorage.removeItem('flashcardsTSV');
    localStorage.removeItem('currentStep');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-400">Study Tool</h1>
          
          {/* Progress indicators */}
          <div className="flex items-center space-x-4">
            <div
              className={`flex items-center cursor-pointer ${currentStep === 1 ? 'font-bold' : 'opacity-50'}`}
              onClick={() => setCurrentStep(1)}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center border border-current mr-2">
                1
              </span>
              <span className="hidden sm:inline">Upload</span>
            </div>
            <div className="h-px w-4 sm:w-8 bg-gray-700"></div>
            <div
              className={`flex items-center cursor-pointer ${currentStep === 2 ? 'font-bold' : 'opacity-50'}`}
              onClick={() => setCurrentStep(2)}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center border border-current mr-2">
                2
              </span>
              <span className="hidden sm:inline">Markdown</span>
            </div>
            <div className="h-px w-4 sm:w-8 bg-gray-700"></div>
            <div
              className={`flex items-center cursor-pointer ${currentStep === 3 ? 'font-bold' : 'opacity-50'}`}
              onClick={() => setCurrentStep(3)}
            >
              <span className="w-6 h-6 rounded-full flex items-center justify-center border border-current mr-2">
                3
              </span>
              <span className="hidden sm:inline">Flashcards</span>
            </div>
          </div>

          {/* Reset button - only shown after step 1 */}
          {currentStep > 1 && (
            <button 
              onClick={handleReset}
              className="px-4 py-1 bg-red-700 hover:bg-red-600 text-white rounded-md"
            >
              Start Over
            </button>
          )}

          {/* API Status indicator */}
          {apiStatus && (
            <div className="ml-4 text-xs flex items-center">
              <span className={`w-2 h-2 rounded-full mr-1 ${apiStatus.connected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className={apiStatus.connected ? 'text-green-400' : 'text-red-400'}>
                API {apiStatus.connected ? 'Online' : 'Offline'}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 container mx-auto p-4 max-w-6xl">
        {/* Loading overlay */}
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-blue-500 border-opacity-75 mx-auto mb-4"></div>
              <p className="text-lg">Processing with Gemini AI...</p>
              <p className="text-sm text-gray-400 mt-2">This may take a few moments</p>
              <p className="text-sm font-mono text-blue-400 mt-2">
                {`${Math.floor(processingTime / 60000).toString().padStart(2, '0')}:${Math.floor((processingTime % 60000) / 1000).toString().padStart(2, '0')}:${Math.floor((processingTime % 1000) / 10).toString().padStart(2, '0')}`}
              </p>
            </div>
          </div>
        )}

        <AnimatePresence exitBeforeEnter>
          {/* Step 1: Upload */}
          {currentStep === 1 && (
            <motion.div
              key="upload"
              className="h-[calc(100vh-8rem)]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <UploadPane 
                onSummaryGenerated={handleSummaryGenerated} 
                setIsLoading={setIsLoading} 
              />
            </motion.div>
          )}

          {/* Step 2: Markdown */}
          {currentStep === 2 && (
            <motion.div
              key="markdown"
              className="h-[calc(100vh-8rem)]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <MarkdownPane 
                notionMarkdown={notionMarkdown} 
                onFlashcardsGenerated={handleFlashcardsGenerated}
                setIsLoading={setIsLoading} 
              />
            </motion.div>
          )}

          {/* Step 3: Flashcards */}
          {currentStep === 3 && (
            <motion.div
              key="flashcards"
              className="h-[calc(100vh-8rem)]"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <FlashcardPane flashcardsTSV={flashcardsTSV} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-center p-4 text-gray-400 text-sm">
        <p>Powered by Google Gemini AI | &copy; {new Date().getFullYear()} Study Tool</p>
      </footer>
      {/* Toast notifications */}
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} newestOnTop closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover />
    </div>
  );
}

export default App;