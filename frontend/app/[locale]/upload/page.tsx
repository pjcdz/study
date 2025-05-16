"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, X, Zap } from "lucide-react"
import { toast } from "sonner"
import { useUploadStore } from '@/store/use-upload-store'
import { useTranslations } from 'next-intl'
import apiClient, { ApiError } from "@/lib/api-client"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"
import { motion } from "framer-motion"
import { useProcessingTimer } from "@/lib/hooks/useProcessingTimer"

// Import PDF.js types
import type * as PDFJS from 'pdfjs-dist';

// PDF.js needs to be imported dynamically as it's browser-only
const pdfjs = async (): Promise<typeof PDFJS> => {
  const PDFJSLib = await import('pdfjs-dist');
  return PDFJSLib;
};

export default function UploadPage() {
  // State to track PDF processing status
  const [pdfProcessingStatus, setPdfProcessingStatus] = useState<string>("");

  // Initialize PDF.js
  useEffect(() => {
    const initPdfJs = async () => {
      if (typeof window !== 'undefined') {
        try {
          const PDFJSLib = await pdfjs();
          // Set worker path using CDN to avoid bundling issues
          const workerSrc = `//unpkg.com/pdfjs-dist@${PDFJSLib.version}/build/pdf.worker.min.js`;
          PDFJSLib.GlobalWorkerOptions.workerSrc = workerSrc;
        } catch (error) {
          console.error('Error initializing PDF.js:', error);
        }
      }
    };
    
    initPdfJs();
  }, []);

  // Framer Motion variants for animation
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }

  const t = useTranslations()
  const router = useRouter()
  
  // Using the shared timer hook
  const { isLoading, displayTime, startProcessing, stopProcessing } = useProcessingTimer()
  
  const {
    files,
    inputText,
    addFiles,
    removeFile,
    setInputText,
    addSummary,
    setCurrentStep,
    reset
  } = useUploadStore()

  // Function to extract text from PDF
  const extractPdfText = async (file: File): Promise<string> => {
    try {
      setPdfProcessingStatus(`Extracting text from ${file.name}...`);
      
      // Convert file to ArrayBuffer
      const arrayBuffer = await file.arrayBuffer();
      
      // Load PDF document
      const PDFJSLib = await pdfjs();
      const loadingTask = PDFJSLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      
      let extractedText = `[PDF Document: ${file.name}]\n`;
      extractedText += `# Content extracted from: ${file.name}\n\n`;
      
      // Get total pages
      const totalPages = pdf.numPages;
      setPdfProcessingStatus(`Extracting text from ${file.name} (0/${totalPages} pages)`);
      
      // Extract text from each page
      for (let i = 1; i <= totalPages; i++) {
        setPdfProcessingStatus(`Extracting text from ${file.name} (${i}/${totalPages} pages)`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items;
        
        // Extract text from text items
        let lastY: number | null = null;
        let pageText = '';
        for (const item of textItems) {
          const itemAny = item as any;
          if (itemAny.str) {
            // Add a newline when the y-position changes significantly (simple paragraph detection)
            if (lastY !== null && Math.abs(itemAny.transform[5] - lastY) > 5) {
              pageText += '\n';
            }
            pageText += itemAny.str;
            lastY = itemAny.transform[5];
            
            // Add a space after each text chunk unless it ends with hyphen (might be a hyphenated word)
            if (!itemAny.str.endsWith('-')) {
              pageText += ' ';
            }
          }
        }
        
        extractedText += `\n## Page ${i}\n\n${pageText}\n`;
      }
      
      return extractedText;
    } catch (error) {
      console.error('Error extracting text from PDF:', error);
      throw new Error(`PDF processing error: ${(error as Error).message}`);
    }
  };

  const processPdfFiles = async () => {
    const pdfFiles = files.filter(file => file.type === 'application/pdf');
    let allText = '';
    
    // Process all PDF files
    for (const file of pdfFiles) {
      try {
        toast.info(t('upload.toast.processingPdf', { name: file.name }));
        const extractedText = await extractPdfText(file);
        allText += extractedText + '\n\n';
        toast.success(t('upload.toast.pdfProcessed', { name: file.name }));
      } catch (error) {
        toast.error(t('upload.toast.pdfError', { name: file.name }));
        console.error(`Error processing PDF ${file.name}:`, error);
      }
    }
    
    return allText;
  };
  
  const handleSubmit = async () => {
    try {
      // Validate input - at least one file or text content
      if (files.length === 0 && !inputText.trim()) {
        toast.error(t('upload.validation.noContent'));
        return;
      }
      
      // Start processing and show timer
      startProcessing();
      setCurrentStep('upload');
      
      // Extract text from PDFs if present
      let pdfText = '';
      if (files.some(file => file.type === 'application/pdf')) {
        pdfText = await processPdfFiles();
      }
      
      // Combine all text
      let contentToSend = inputText;
      if (pdfText) {
        contentToSend = contentToSend 
          ? `${contentToSend}\n\n${pdfText}` 
          : pdfText;
      }
      
      // Send the request
      const response = await apiClient.generateSummary({ content: contentToSend });
      
      // Stop processing timer
      stopProcessing();
      
      // Add the summary to our state
      addSummary(response.notionMarkdown);
      setCurrentStep('summary');
      
      // Show success message
      toast.success(t('upload.toast.success'));
      
      // Navigate to the next step
      router.push('./summary');
    } catch (error) {
      stopProcessing();
      
      let errorMessage: string;
      if (error instanceof ApiError) {
        errorMessage = error.message;
        
        // Handle different error types
        switch (error.type) {
          case 'QUOTA_EXCEEDED':
            toast.error(t('upload.toast.quotaExceeded'));
            break;
          case 'NETWORK_ERROR':
            toast.error(t('upload.toast.networkError'));
            break;
          default:
            toast.error(t('upload.toast.error', { message: errorMessage }));
            break;
        }
      } else {
        errorMessage = (error as Error).message;
        toast.error(t('upload.toast.error', { message: errorMessage }));
      }
      
      console.error('Error in upload process:', errorMessage);
    }
  }
  
  const handleCancel = () => {
    // Detener el procesamiento si está en curso
    if (isLoading) {
      stopProcessing();
    }
    
    // Restablecer el estado
    reset();
    
    // Obtener el prefijo de idioma de la ruta actual
    const pathParts = window.location.pathname.split('/');
    const locale = pathParts[1]; // Get the locale from URL ('es' or 'en')
    
    // Redireccionar a la página inicial
    router.push(`/${locale}/`);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content with padding-bottom to ensure content doesn't get hidden under fixed footer */}
      <div className="flex-grow pb-20">
        <div className="container mx-auto py-8">
          <div className="max-w-4xl mx-auto">
            <motion.div 
              initial="hidden"
              animate="show"
              variants={containerVariants}
              className="space-y-6"
            >
              <motion.div 
                variants={itemVariants}
                className="text-center"
              >
                <h1 className="text-2xl font-bold mb-2">{t('upload.title')}</h1>
                <p className="text-muted-foreground">{t('upload.description')}</p>
              </motion.div>

              <Card className="shadow-sm border-2 border-muted rounded-lg overflow-hidden">
                <CardContent className="p-6">
                  <motion.div 
                    variants={itemVariants}
                    className="space-y-6"
                  >
                    {/* File Upload */}
                    <div className="space-y-4">
                      <FileDropzone onFileAccepted={addFiles} />
                      {files.length > 0 && (
                        <FileList files={files} onRemove={removeFile} />
                      )}
                    </div>
                    
                    {/* Text Input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="textContent"
                        className="text-sm font-medium"
                      >
                        {files.length > 0 
                          ? t('upload.textInput.labelWithFiles')
                          : t('upload.textInput.labelWithoutFiles')}
                      </label>
                      <Textarea
                        id="textContent"
                        placeholder={files.length > 0 
                          ? t('upload.textInput.placeholderWithFiles')
                          : t('upload.textInput.placeholderWithoutFiles')
                        }
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="min-h-[100px] resize-y"
                      />
                      {files.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {t('upload.textInput.helpWithFiles')}
                        </p>
                      )}
                    </div>

                    {/* PDF Processing Status */}
                    {pdfProcessingStatus && (
                      <div className="text-sm text-muted-foreground font-mono">
                        <p>{pdfProcessingStatus}</p>
                      </div>
                    )}
                    
                    {/* Submit button - moved to footer */}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-md py-4 z-10">
        <div className="container max-w-4xl mx-auto flex justify-center space-x-4">
          <Button 
            onClick={handleCancel}
            variant="outline"
            size="lg"
            className="transition-all hover:bg-primary/10 hover:border-secondary hover:border-2 hover:shadow-[0_0_15px_rgba(var(--color-secondary)/0.4)]"
          >
            <X className="mr-2 h-4 w-4" />
            {t('common.cancel')}
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || (files.length === 0 && !inputText.trim())}
            size="lg"
            className="transition-all hover:border-primary hover:border-2 hover:shadow-[0_0_15px_rgba(var(--color-primary)/0.5)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> 
                {t('upload.processing')} {displayTime}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {t('upload.process')}
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}