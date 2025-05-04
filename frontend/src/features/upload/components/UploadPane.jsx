import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
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
      const msg = 'Please enter text or upload files first';
      setError(msg);
      toast.error(msg);
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
        toast.success('Summary generated successfully');
      } catch (apiError) {
        console.error("API Error details:", apiError);
        const msg = apiError.message;
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      console.error('Error in handleGenerateSummary:', err);
      const msg = `Error processing content: ${err.message}`;
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
      setIsGenerating(false);
    }
  };
  
  return (
    <div>
      <h2>Upload Documents</h2>
      <div>
        <input id="fileInput" type="file" ref={fileInputRef} hidden multiple onChange={handleFileChange} />
        <button className="btn btn-secondary" onClick={handleOpenFileDialog}>Upload Files</button>
      </div>
      {files.length > 0 && (
        <ul>
          {files.map((file, i) => <li key={i}>{file.name}</li>)}
        </ul>
      )}
      <div className="field">
        <textarea
          id="textInput"
          placeholder={files.length>0?"Additional context": "Paste document text"}
          value={inputText}
          onChange={handleTextChange}
        />
        <label htmlFor="textInput">Content</label>
      </div>
      {error && <p>{error}</p>}
      <button
        className="btn btn-primary"
        onClick={handleGenerateSummary}
        disabled={isProcessing || isGenerating}
      >
        {isProcessing || isGenerating ? 'Processing...' : 'Generate Summary'}
      </button>
    </div>
  );
};

export default UploadPane;