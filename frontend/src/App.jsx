import React, { useState, useEffect, useRef } from "react";
import UploadPane from "./features/upload/components/UploadPane";
import MarkdownPane from "./features/summary/components/MarkdownPane";
import FlashcardPane from "./features/flashcards/components/FlashcardPane";
import 'react-toastify/dist/ReactToastify.css';
import { ToastContainer } from 'react-toastify';

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
    <div style={{display:'flex', flexDirection:'column', height:'100%'}}>
      <div style={{flex:1, display:'flex', justifyContent:'center', alignItems:'center', padding:'var(--space-lg)'}}>
        <div className="card" style={{width:'100%', maxWidth:'600px'}}>
          {/* Start over button always visible */}
          <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:'var(--space-md)' }}>
            <button className="btn btn-secondary" onClick={handleReset}>Start Over</button>
          </div>
          {/* Render current step pane */}
          {currentStep === 1 && <UploadPane onSummaryGenerated={handleSummaryGenerated} setIsLoading={setIsLoading} />}
          {currentStep === 2 && <MarkdownPane notionMarkdown={notionMarkdown} onFlashcardsGenerated={handleFlashcardsGenerated} setIsLoading={setIsLoading} />}
          {currentStep === 3 && <FlashcardPane flashcardsTSV={flashcardsTSV} />}
        </div>
      </div>
      {/* Bottom navigation */}
      <nav id="bottom-nav">
        <button className={currentStep===1?'active':''} onClick={()=>setCurrentStep(1)}>Upload</button>
        <button className={currentStep===2?'active':''} onClick={()=>setCurrentStep(2)}>Markdown</button>
        <button className={currentStep===3?'active':''} onClick={()=>setCurrentStep(3)}>Flashcards</button>
      </nav>
      <ToastContainer />
    </div>
  );
}

export default App;