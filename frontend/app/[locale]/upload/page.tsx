"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, X, Zap, KeyRound } from "lucide-react"
import { toast } from "sonner"
import { useUploadStore } from '@/store/use-upload-store'
import { useTranslations } from 'next-intl'
import apiClient, { ApiError, ApiErrorType } from "@/lib/api-client"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"
import { motion } from "framer-motion"
import { useProcessingTimer } from "@/lib/hooks/useProcessingTimer"
import { useApiKey } from "@/lib/hooks/useApiKey"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import { Progress } from "@/components/ui/progress"

export default function UploadPage() {
  const { isAvailable, isLoading: isApiKeyLoading, isMounted } = useApiKey()
  const router = useRouter()
  const t = useTranslations()
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false)
  const [largeFileProcessing, setLargeFileProcessing] = useState(false);
  const [largeFileMessage, setLargeFileMessage] = useState('');
  const [processingStatus, setProcessingStatus] = useState<{[key: string]: string}>({});
  const [processingProgress, setProcessingProgress] = useState(0);
  const [statusCheckIntervalId, setStatusCheckIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Using the shared timer hook
  const { isLoading, displayTime, startProcessing, stopProcessing } = useProcessingTimer()
  
  // Reset persisted timer if it was left from a previous session (browser close)
  useEffect(() => {
    const { isLoading, processingStartTime } = useUploadStore.getState();
    
    // Check if timer was left running from a previous session
    // If processing for more than 30 minutes, it's likely from a previous session
    if (isLoading && processingStartTime && Date.now() - processingStartTime > 30 * 60 * 1000) {
      console.log('Detected stale timer from previous session, resetting');
      stopProcessing(); // Reset the timer
    }
  }, []); // Run once on component mount

  // Check API key on component mount and redirect if not available
  useEffect(() => {
    // Esperar a que termine de cargar el estado de la API key
    if (isApiKeyLoading || !isMounted) {
      return;
    }
    
    if (!isAvailable) {
      // Mostrar el diálogo modal en lugar de redireccionar inmediatamente
      setShowApiKeyDialog(true)
    }
  }, [isAvailable, isApiKeyLoading, isMounted]);

  // Check file processing status when large file processing is active
  useEffect(() => {
    if (largeFileProcessing) {
      // Start periodic status checks
      const intervalId = setInterval(async () => {
        try {
          // Get file status from API
          const statusResponse = await apiClient.getFileProcessingStatus();
          
          if (statusResponse && statusResponse.fileStatus) {
            setProcessingStatus(statusResponse.fileStatus);
            
            // Calculate progress based on processed files
            const fileEntries = Object.entries(statusResponse.fileStatus);
            if (fileEntries.length > 0) {
              const processedCount = fileEntries.filter(([_, status]) => 
                status === 'PROCESSED'
              ).length;
              
              const newProgress = Math.round((processedCount / fileEntries.length) * 100);
              setProcessingProgress(newProgress);
              
              // Update message based on the current status
              const inProgressFiles = fileEntries
                .filter(([_, status]) => status === 'PROCESSING')
                .map(([filename]) => filename);
                
              if (inProgressFiles.length > 0) {
                setLargeFileMessage(`Procesando: ${inProgressFiles.join(', ')} (${newProgress}%)`);
              } else if (processedCount === fileEntries.length) {
                setLargeFileMessage(`Procesamiento de archivo completado. Generando resumen...`);
              }
            }
          }
        } catch (error) {
          console.error('Error checking file status:', error);
        }
      }, 2000); // Check every 2 seconds
      
      setStatusCheckIntervalId(intervalId);
      
      // Clean up interval on unmount
      return () => {
        if (intervalId) {
          clearInterval(intervalId);
        }
      };
    } else {
      // Clear interval when not processing large files
      if (statusCheckIntervalId) {
        clearInterval(statusCheckIntervalId);
        setStatusCheckIntervalId(null);
      }
    }
  }, [largeFileProcessing]);

  // Clean up status check on component unmount
  useEffect(() => {
    return () => {
      if (statusCheckIntervalId) {
        clearInterval(statusCheckIntervalId);
      }
    };
  }, [statusCheckIntervalId]);

  // Framer Motion variants for animation
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
  }
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  }
  
  const {
    files,
    inputText,
    addFiles,
    removeFile,
    setInputText,
    addSummary,
    setCurrentStep,
    reset,
    startStreamingSummary,
    appendToStreamingSummary,
    finishStreamingSummary,
    resetStreamingSummary
  } = useUploadStore()

  const handleSubmit = async () => {
    try {
      // Create FormData for better multimodal support
      const formData = new FormData();
      let contentAdded = false;
      let hasLargeFile = false;
      
      // Validate input - at least one file or text content
      if (files.length === 0 && !inputText.trim()) {
        toast.error(t('upload.validation.noContent'));
        return;
      }
      
      // Check for API key availability before proceeding
      if (!isAvailable) {
        toast.error(t('upload.toast.apiKeyMissing') || 'No puedes subir un archivo sin configurar tu API primero');
        
        // Get the current locale from pathname
        const pathParts = window.location.pathname.split('/');
        const locale = pathParts[1]; // Get the locale from URL ('es' or 'en')
        
        // Redirect to API key page
        router.push(`/${locale}/api`);
        return;
      }
      
      // Start processing and show timer
      startProcessing();
      setCurrentStep('upload');
      
      // Initialize streaming
      resetStreamingSummary();
      
      // ENVIAR TODOS LOS ARCHIVOS DIRECTAMENTE AL BACKEND
      if (files && files.length > 0) {
        console.log("Procesando archivos:", files.map(f => f.name).join(', '));
        
        // Verificar si hay archivos grandes (>20MB)
        const MAX_INLINE_SIZE = 20 * 1024 * 1024; // 20MB
        
        // Enviar tanto PDFs como imágenes directamente al backend
        files.forEach((file, index) => {
          const originalFile = useUploadStore.getState().originalFiles.find(f => f.name === file.name);
          if (originalFile) {
            // Verificar si es un archivo grande
            if (originalFile.size > MAX_INLINE_SIZE) {
              hasLargeFile = true;
              setLargeFileMessage(`Detectado archivo grande: ${originalFile.name} (${Math.round(originalFile.size / (1024 * 1024))}MB). El procesamiento puede tomar más tiempo.`);
              toast.info(`Archivo grande detectado: ${originalFile.name}. El procesamiento puede tomar más tiempo.`, {
                duration: 5000
              });
            }
            formData.append(`file${index}`, originalFile);
            contentAdded = true;
            console.log(`Añadido archivo: ${file.name} (${file.type}), tamaño: ${Math.round(originalFile.size / 1024)}KB`);
          }
        });
        
        // Mostrar mensaje de procesamiento adicional para archivos grandes
        if (hasLargeFile) {
          setLargeFileProcessing(true);
        }
      }
      
      // Add text input if present
      if (inputText && inputText.trim()) {
        formData.append("textPrompt", inputText);
        contentAdded = true;
        console.log("Añadido texto de entrada");
      }
      
      // Verify something was added to process
      if (!contentAdded) {
        toast.error(t('upload.validation.noContent'));
        stopProcessing();
        return;
      }
      
      // Log FormData entries for debugging
      console.log("FormData contents:");
      for (const pair of formData.entries()) {
        console.log(`- ${pair[0]}: ${pair[1] instanceof File ? pair[1].name : 'text content'}`);
      }
      
      try {
        // Start streaming summary
        startStreamingSummary();

        // Navigate to summary page immediately to show streaming
        const pathParts = window.location.pathname.split('/');
        const locale = pathParts[1];
        router.push(`/${locale}/summary`);
        
        // Process with streaming - using the better streaming method for FormData
        await apiClient.processSummaryStreaming(formData, (chunk: string) => {
          console.log('Received chunk:', chunk); // Debug log
          appendToStreamingSummary(chunk);
        });
        
        // Finish streaming
        finishStreamingSummary();
        
        // Stop processing timer
        stopProcessing();
        setLargeFileProcessing(false);
        
        // Set current step to summary
        setCurrentStep('summary');
        
        // Show success message
        toast.success(t('upload.toast.success'));
        
      } catch (error) {
        stopProcessing();
        setLargeFileProcessing(false);
        finishStreamingSummary();
        resetStreamingSummary(); // Clear any partial streaming content
        
        // Navigate back to upload on error
        const pathParts = window.location.pathname.split('/');
        const locale = pathParts[1];
        if (window.location.pathname.includes('/summary')) {
          router.push(`/${locale}/upload`);
        }
        
        let errorMessage: string;
        if (error instanceof ApiError) {
          errorMessage = error.message;
          
          // Handle different error types
          switch (error.type) {
            case ApiErrorType.QUOTA_EXCEEDED:
              toast.error(t('upload.toast.quotaExceeded'));
              break;
            case ApiErrorType.INVALID_API_KEY:
              toast.error(t('upload.toast.invalidApiKey') || 'Invalid API key. Please configure your API key.');
              
              // Get the current locale from pathname
              const pathParts = window.location.pathname.split('/');
              const locale = pathParts[1]; // Get the locale from URL ('es' or 'en')
              
              // Redirect to API key page
              setTimeout(() => router.push(`/${locale}/api`), 1500);
              break;
            case ApiErrorType.FILE_TOO_LARGE:
              toast.error(t('upload.toast.fileTooLarge') || 'El archivo es demasiado grande para procesar, incluso con la API de archivos.');
              break;
            case ApiErrorType.FILE_PROCESSING_FAILED:
              toast.error(t('upload.toast.fileProcessingFailed') || 'El procesamiento del archivo ha fallado en el servidor. Intenta con otro archivo o formato.');
              break;
            case ApiErrorType.NETWORK_ERROR:
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
    } catch (error) {
      stopProcessing();
      setLargeFileProcessing(false);
      finishStreamingSummary();
      
      const errorMessage = (error as Error).message;
      toast.error(t('upload.toast.error', { message: errorMessage }));
      console.error('Unexpected error in upload process:', errorMessage);
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
      {/* Diálogo modal para API Key no configurada */}
      <AlertDialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-amber-500" />
                {t('upload.apiKeyDialog.title', { defaultValue: 'API Key Requerida' })}
              </div>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('upload.toast.apiKeyMissing', { defaultValue: 'No puedes subir un archivo sin configurar tu API primero' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => {
              // Obtener el prefijo de idioma de la ruta actual
              const pathParts = window.location.pathname.split('/');
              const locale = pathParts[1]; // Get locale from URL ('es' or 'en')
              
              // Redireccionar a la página de API
              router.push(`/${locale}/api`);
            }}>
              {t('upload.apiKeyDialog.configure', { defaultValue: 'Configurar API Key' })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                      <FileDropzone addFiles={addFiles} />
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
                {largeFileProcessing ? (
                  <span>
                    {t('upload.processingLargeFile')} {displayTime}
                  </span>
                ) : (
                  <span>
                    {t('upload.processing')} {displayTime}
                  </span>
                )}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {t('upload.process')}
              </>
            )}
          </Button>
        </div>
        {/* Mostrar mensaje informativo sobre archivos grandes */}
        {largeFileProcessing && largeFileMessage && (
          <div className="absolute bottom-20 left-0 right-0 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 p-2 text-center text-sm">
            <div className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" /> 
              {largeFileMessage}
            </div>
            <p className="text-xs mt-1">Los archivos grandes requieren procesamiento adicional en el servidor</p>
            {/* Add progress bar for file processing */}
            <div className="mt-2 px-4">
              <Progress value={processingProgress} className="h-2" />
              <p className="text-xs mt-1 text-right">{processingProgress}%</p>
            </div>
          </div>
        )}
      </footer>
    </div>
  )
}