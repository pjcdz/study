import React, { useState, useRef, useEffect } from 'react';
import apiClient from '../../../shared/services/apiClient';
import { THEME_COLORS } from '../../../shared/utils/themeUtils';

// Eliminamos la importación de PDF.js

const UploadPane = ({ onSummaryGenerated, setIsLoading }) => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [generationTime, setGenerationTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationTimerRef = useRef(null);

  // Efecto para actualizar el contador de tiempo cuando está generando
  useEffect(() => {
    if (isGenerating) {
      const startTime = Date.now();
      
      // Iniciar un intervalo para actualizar el tiempo cada segundo
      generationTimerRef.current = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        setGenerationTime(elapsedTime);
      }, 1000);
    } else {
      // Limpiar el intervalo cuando se detiene la generación
      if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
      }
    }
    
    // Limpiar intervalo al desmontar
    return () => {
      if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
      }
    };
  }, [isGenerating]);

  // Handle text input change
  const handleTextChange = (e) => {
    setInputText(e.target.value);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...selectedFiles]);
    e.target.value = null; // Reset file input
  };

  // Handle file removal
  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Open file dialog
  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Process files to extract their content
  const processFiles = async () => {
    setIsProcessing(true);
    setError(null);
    setProcessingProgress(0);
    
    try {
      let extractedText = '';
      const totalFiles = files.length;

      // Process each file to extract text
      for (let i = 0; i < totalFiles; i++) {
        const file = files[i];
        setProcessingProgress(Math.round(((i + 0.5) / totalFiles) * 100));
        
        if (file.type.includes('image/')) {
          // For images, use base64 encoding
          const base64 = await fileToBase64(file);
          extractedText += `[Image Content: ${file.name}]\n${base64}\n\n`;
        } else if (file.type === 'application/pdf') {
          // Para PDFs: enviamos la información del archivo sin procesarlo con PDF.js
          extractedText += `[PDF Document: ${file.name}]\n`;
          extractedText += `Este es un documento PDF que contiene información sobre "${file.name.replace('.pdf', '')}". `;
          extractedText += `Por favor, analiza el contenido del archivo que está relacionado con este tema. `;
          extractedText += `El documento tiene un tamaño de ${Math.round(file.size / 1024)} KB.\n\n`;
          
          // Si el usuario ha ingresado texto, usamos ese texto como contexto para el PDF
          if (inputText) {
            extractedText += `Contexto adicional proporcionado por el usuario:\n${inputText}\n\n`;
          }
        } else if (file.type.includes('text/') || file.type === 'application/json') {
          // For text files, read as text
          const text = await file.text();
          extractedText += `[Text Content: ${file.name}]\n${text}\n\n`;
        }
      }

      setProcessingProgress(100);
      return extractedText;
    } catch (err) {
      console.error('Error processing files:', err);
      setError(`Error processing files: ${err.message}`);
      return '';
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Format seconds as mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle summary generation
  const handleGenerateSummary = async () => {
    if (!inputText.trim() && files.length === 0) {
      setError('Please enter some text or upload files first');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      setGenerationTime(0);
      setIsGenerating(true);
      
      // Process any uploaded files
      let fileContent = '';
      if (files.length > 0) {
        fileContent = await processFiles();
      }
      
      // Combine file content with manually entered text
      const combinedText = files.length > 0 ? fileContent : inputText;
      
      // Log content size
      console.log(`Content size being sent: ${Math.round(combinedText.length / 1024)} KB`);
      
      try {
        // Send to backend for processing
        const response = await apiClient.postSummary(combinedText);
        console.log("Received response:", response);
        
        // Mostrar estadísticas si están disponibles
        if (response.stats) {
          console.log("=== Estadísticas de generación ===");
          console.log(`Modelo: ${response.stats.model}`);
          console.log(`Tokens de entrada: ${response.stats.inputTokens}`);
          console.log(`Tokens de salida: ${response.stats.outputTokens}`);
          console.log(`Tokens totales: ${response.stats.totalTokens}`);
          console.log(`Tiempo API: ${response.stats.apiResponseTimeMs}ms`);
          console.log(`Tiempo total: ${response.stats.totalProcessingTimeMs}ms`);
        }
        
        // Enviar el markdown generado
        onSummaryGenerated(response.notionMarkdown);
      } catch (apiError) {
        console.error("API Error details:", apiError);
        setError(`${apiError.message}`);
      }
    } catch (err) {
      console.error('Error in handleGenerateSummary:', err);
      setError(`Error processing content: ${err.message}`);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };
  
  return (
    <div className="flex flex-col w-full h-full p-4 bg-gray-900">
      <h2 className="text-xl font-semibold mb-4" style={{ color: THEME_COLORS.primary }}>
        Upload Documents
      </h2>
      
      {/* File upload area */}
      <div 
        className="mb-4 p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-200 flex flex-col items-center justify-center"
        style={{ 
          borderColor: THEME_COLORS.border,
          backgroundColor: THEME_COLORS.backgroundDarker,
          minHeight: '100px' 
        }}
        onClick={handleOpenFileDialog}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          multiple
          accept="image/*, application/pdf, text/*, application/json"
        />
        
        <div className="text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke={THEME_COLORS.primary} strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          <p className="text-base" style={{ color: THEME_COLORS.textDimmed }}>Drag & drop files here, or click to select files</p>
          <p className="text-sm mt-1" style={{ color: THEME_COLORS.text }}>Supported formats: PDFs, Images, Text files</p>
        </div>
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mb-4">
          <h3 className="text-md font-medium mb-2" style={{ color: THEME_COLORS.accent }}>
            {files.length} file(s) selected
          </h3>
          
          <div className="max-h-40 overflow-y-auto" style={{ backgroundColor: THEME_COLORS.backgroundDarker }}>
            {files.map((file, index) => (
              <div 
                key={`${file.name}-${index}`}
                className="p-2 flex items-center justify-between border-b"
                style={{ borderColor: THEME_COLORS.border }}
              >
                <div className="flex items-center">
                  {file.type.includes('image/') ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke={THEME_COLORS.accent} strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  ) : file.type === 'application/pdf' ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke={THEME_COLORS.error} strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke={THEME_COLORS.primary} strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )}
                  <span className="text-sm" style={{ color: THEME_COLORS.text }}>{file.name}</span>
                </div>
                
                <button
                  className="text-sm px-2 py-1 rounded"
                  style={{ color: THEME_COLORS.error }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile(index);
                  }}
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Processing progress bar */}
      {isProcessing && (
        <div className="mb-4">
          <div className="w-full bg-gray-700 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${processingProgress}%` }}></div>
          </div>
          <p className="text-sm text-gray-400 mt-1 text-center">
            Processing files: {processingProgress}%
          </p>
        </div>
      )}
      
      {/* Generación en progreso */}
      {isGenerating && !isProcessing && (
        <div className="mb-4 p-3 rounded-md flex items-center justify-between" style={{ backgroundColor: `${THEME_COLORS.primary}20` }}>
          <div className="flex items-center">
            <svg className="animate-spin mr-3 h-5 w-5" style={{ color: THEME_COLORS.primary }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span style={{ color: THEME_COLORS.text }}>Generando resumen...</span>
          </div>
          <div className="font-mono" style={{ color: THEME_COLORS.primary }}>
            {formatTime(generationTime)}
          </div>
        </div>
      )}
      
      <div className="flex-1 mb-4">
        <div className="text-sm font-medium mb-1" style={{ color: THEME_COLORS.text }}>
          {files.length > 0 ? "Additional context (optional):" : "Paste text content:"}
        </div>
        <textarea
          className="w-full h-full p-3 rounded-md border resize-none"
          style={{ 
            backgroundColor: THEME_COLORS.backgroundDarker, 
            color: THEME_COLORS.text,
            borderColor: THEME_COLORS.border
          }}
          placeholder={files.length > 0 
            ? "Add any context or specific instructions about the uploaded files..." 
            : "Paste your document content here..."}
          value={inputText}
          onChange={handleTextChange}
        />
      </div>
      
      {/* Error message */}
      {error && (
        <div className="mb-4 p-3 rounded-md" style={{ backgroundColor: `${THEME_COLORS.error}20`, color: THEME_COLORS.error }}>
          {error}
        </div>
      )}
      
      <div className="flex justify-end">
        <button
          onClick={handleGenerateSummary}
          disabled={isProcessing || isGenerating}
          className="px-6 py-2 text-white font-medium rounded-md transition-colors duration-200 flex items-center"
          style={{ 
            backgroundColor: isProcessing || isGenerating ? THEME_COLORS.border : THEME_COLORS.button.primary,
            opacity: isProcessing || isGenerating ? 0.7 : 1
          }}
        >
          {isProcessing ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : isGenerating ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </>
          ) : (
            'Generate Summary'
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadPane;