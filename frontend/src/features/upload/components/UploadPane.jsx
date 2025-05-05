import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../../shared/services/apiClient';
import { THEME_COLORS } from '../../../shared/utils/themeUtils';
import { FiUpload, FiX, FiFileText, FiFile, FiImage } from 'react-icons/fi';
import { useAccessibility } from '../../../shared/components/accessibility/AccessibilityContext';

const UploadPane = ({ onSummaryGenerated, setIsLoading }) => {
  const { t } = useAccessibility(); // Obtener la función de traducción
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const fileInputRef = useRef(null);
  const [generationTime, setGenerationTime] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const generationTimerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  // Effect for updating timer when generating
  useEffect(() => {
    if (isGenerating) {
      const startTime = Date.now();
      
      // Update time every second
      generationTimerRef.current = setInterval(() => {
        const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
        setGenerationTime(elapsedTime);
      }, 1000);
    } else {
      // Clear interval when generation stops
      if (generationTimerRef.current) {
        clearInterval(generationTimerRef.current);
      }
    }
    
    // Clean up interval on unmount
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
    if (selectedFiles.length > 0) {
      setFiles(prev => [...prev, ...selectedFiles]);
      e.target.value = null; // Reset file input
    }
  };

  // Handle file removal
  const handleRemoveFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // Open file dialog
  const handleOpenFileDialog = () => {
    fileInputRef.current?.click();
  };

  // Handle drag events for file upload
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };

  // Get file icon based on MIME type
  const getFileIcon = (fileType) => {
    if (fileType.includes('image/')) return <FiImage size={18} />;
    if (fileType === 'application/pdf') return <FiFileText size={18} />;
    return <FiFile size={18} />;
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
          // For PDFs: Send file information without processing with PDF.js
          extractedText += `[PDF Document: ${file.name}]\n`;
          extractedText += `This is a PDF document that contains information about "${file.name.replace('.pdf', '')}". `;
          extractedText += `Please analyze the content of the file that is related to this topic. `;
          extractedText += `The document has a size of ${Math.round(file.size / 1024)} KB.\n\n`;
          
          // If user entered text, use it as context for the PDF
          if (inputText) {
            extractedText += `Additional context provided by the user:\n${inputText}\n\n`;
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

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
        console.log("UploadPane: Received summary response:", response);
        
        // Show statistics if available
        if (response.stats) {
          console.log("=== Generation Statistics ===");
          console.log(`Model: ${response.stats.model}`);
          console.log(`Input tokens: ${response.stats.inputTokens}`);
          console.log(`Output tokens: ${response.stats.outputTokens}`);
          console.log(`Total tokens: ${response.stats.totalTokens}`);
          console.log(`API time: ${response.stats.apiResponseTimeMs}ms`);
          console.log(`Total time: ${response.stats.totalProcessingTimeMs}ms`);
        }
        
        // Validate response before calling onSummaryGenerated
        if (!response || typeof response !== 'object') {
          throw new Error('Invalid response format from server');
        }
        
        if (!response.notionMarkdown) {
          throw new Error('Response is missing markdown content');
        }
        
        console.log(`UploadPane: Markdown length: ${response.notionMarkdown.length}`);
        console.log(`UploadPane: First 100 chars: ${response.notionMarkdown.substring(0, 100)}...`);
        
        // Track the state change in a safer way
        try {
          toast.success('Summary generated successfully');
          onSummaryGenerated(response.notionMarkdown);
          console.log('UploadPane: Called onSummaryGenerated successfully');
        } catch (callbackError) {
          console.error('Error in callback to parent component:', callbackError);
          toast.error('Error updating app state with generated summary');
          throw callbackError;
        }
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
    <div className="upload-pane">
      <h2 className="text-xl font-bold mb-4">{t('uploadTitle')}</h2>
      <p className="text-neutral-600 mb-4">
        {t('uploadInstructions')}
      </p>
      
      {/* File upload area */}
      <div 
        className={`file-upload-area mb-4 border-2 border-dashed rounded-lg p-4 text-center ${isDragging ? 'border-primary-color bg-primary-color bg-opacity-5' : 'border-neutral-300'}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input 
          id="fileInput" 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          multiple 
          onChange={handleFileChange}
          aria-label={t('uploadButtonText')}
        />
        
        <div className="flex flex-col items-center justify-center"> {/* Contenedor centrado */}
          <FiUpload className="mb-2 text-neutral-500" size={36} />
          <p className="mb-2 font-medium">{t('dropFilesHere')}</p>
          <p className="text-sm text-neutral-500 mb-4">{t('or') || "or"}</p>
          <button 
            type="button"
            onClick={handleOpenFileDialog}
            className="btn btn-secondary"
            aria-label={t('uploadButtonText')}
          >
            {t('uploadButtonText')}
          </button>
        </div>
        
        {isProcessing && (
          <div className="mt-4">
            <div className="progress-bar">
              <div 
                className="progress-bar-fill" 
                style={{ width: `${processingProgress}%` }}
                role="progressbar"
                aria-valuenow={processingProgress}
                aria-valuemin="0"
                aria-valuemax="100"
              ></div>
            </div>
            <p className="text-sm text-neutral-600 mt-1">{t('processingFile')}: {processingProgress}%</p>
          </div>
        )}
      </div>
      
      {/* File list */}
      {files.length > 0 && (
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2">{t('uploadedFiles') || "Uploaded Files"} ({files.length})</h3>
          <ul className="file-list">
            {files.map((file, i) => (
              <li 
                key={i} 
                className="file-item flex items-center justify-between p-2 bg-neutral-100 rounded-md mb-2"
              >
                <div className="flex items-center">
                  <span className="file-icon mr-2 text-neutral-500">
                    {getFileIcon(file.type)}
                  </span>
                  <div className="file-info">
                    <p className="file-name text-sm font-medium truncate" style={{ maxWidth: '180px' }}>
                      {file.name}
                    </p>
                    <p className="file-meta text-xs text-neutral-500">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(i)}
                  className="file-remove text-neutral-400 hover:text-danger-color transition-colors"
                  aria-label={`${t('remove') || "Remove"} ${file.name}`}
                >
                  <FiX size={18} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Text input */}
      <div className="form-group mb-4">
        <label htmlFor="textInput" className="form-label">
          {files.length > 0 ? t('additionalContext') || "Additional Context (Optional)" : t('pasteContent') || "Paste Content"}
        </label>
        <textarea
          id="textInput"
          className="form-control min-h-[120px]"
          placeholder={files.length > 0 ? t('additionalContextPlaceholder') || "Add any additional context or specific instructions..." : t('textPlaceholder')}
          value={inputText}
          onChange={handleTextChange}
          aria-describedby="textInputHelp"
        />
        <small id="textInputHelp" className="text-xs text-neutral-500 mt-1 block">
          {files.length > 0 ? 
            t('textInputHelpWithFiles') || "This text will be considered alongside your files." : 
            t('textInputHelp') || "Enter the content you want to summarize and convert to flashcards."}
        </small>
      </div>
      
      {/* Error message */}
      {error && (
        <div 
          className="error-message p-3 mb-4 bg-red-50 text-red-700 border border-red-200 rounded-md"
          role="alert"
        >
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {/* Generate button */}
      <div className="flex justify-center">
        <button
          className="btn btn-primary w-full sm:w-auto"
          onClick={handleGenerateSummary}
          disabled={isProcessing || isGenerating || (!inputText.trim() && files.length === 0)}
          style={{
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* El texto del botón siempre se muestra */}
          <span>{isProcessing ? t('processingFile') : t('generateSummary')}</span>
          
          {/* Spinner de carga que se muestra superpuesto sin cambiar el texto */}
          {isGenerating && !isProcessing && (
            <span className="absolute left-0 top-0 w-full h-full flex items-center justify-start pl-4" 
                  style={{backgroundColor: 'rgba(79, 70, 229, 0.8)'}}> {/* Color semitransparente que coincide con --primary-color */}
              <span className="loading-spinner mr-2" style={{width: '1rem', height: '1rem'}}></span>
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default UploadPane;