"use client"

import { Suspense } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUploadStore } from '@/store/use-upload-store'
import { useTranslations } from 'next-intl'
import apiClient, { ApiError, ApiErrorType } from "@/lib/api-client"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"
import { motion } from "framer-motion"
import { useProcessingTimer } from "@/lib/hooks/useProcessingTimer"

// Extract content component
function UploadContent() {
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
  const { isLoading, displayTime, startProcessing } = useProcessingTimer()
  
  const {
    files,
    inputText,
    addFiles,
    removeFile,
    setInputText,
    setSummary,
  } = useUploadStore()

  // Function to process files
  const processFiles = async () => {
    try {
      // Nota: No llamamos a startProcessing() aquí porque se llama en handleGenerateSummary
      
      let extractedText = ''
      const { files, originalFiles } = useUploadStore.getState()
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const originalFile = originalFiles[i]
        
        // For images, use base64
        if (file.type.includes('image/')) {
          const base64 = await fileToBase64(originalFile)
          extractedText += `[Image Content: ${file.name}]\n${base64}\n\n`
        }
        // For PDFs (basic information)
        else if (file.type === 'application/pdf') {
          extractedText += `[PDF Document: ${file.name}]\n`
          extractedText += `This is a PDF document that contains information about "${file.name.replace('.pdf', '')}". `
          extractedText += `Please analyze the content of the file that is related to this topic. `
          extractedText += `The document has a size of ${Math.round(file.size / 1024)} KB.\n\n`
          
          if (inputText) {
            extractedText += `Additional context provided by the user:\n${inputText}\n\n`
          }
        }
        // For text files
        else if (file.type.includes('text/') || file.type === 'application/json') {
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => {
              const result = reader.result
              if (typeof result === 'string') {
                resolve(result)
              } else {
                reject(new Error('Invalid file content'))
              }
            }
            reader.onerror = reject
            reader.readAsText(originalFile)
          })
          extractedText += `[Text Content: ${file.name}]\n${text}\n\n`
        }
      }

      // Process the extracted text
      const response = await fetch('/api/process-files', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: extractedText, inputText }),
      })

      if (!response.ok) {
        throw new Error('Failed to process files')
      }

      const data = await response.json()
      setSummary(data.summary)
      
      // No llamamos a stopProcessing() aquí para mantener el timer corriendo
      // El timer solo debe detenerse en la página de summary
    } catch (error: unknown) {
      console.error('Error processing files:', error)
      toast.error(t('upload.toast.error', { message: 'Error processing files' }))
      
      // No llamamos a stopProcessing() aquí para mantener el timer corriendo incluso en caso de error
      // Esto permite al usuario ver cuánto tiempo ha pasado y decidir si intentar de nuevo
    }
  }

  // Helper to convert file to base64
  const fileToBase64 = async (file: Blob): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const result = reader.result
        if (typeof result === 'string') {
          resolve(result)
        } else {
          reject(new Error('Failed to convert file to base64'))
        }
      }
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }
  
  const handleGenerateSummary = async () => {
    if (!inputText && files.length === 0) {
      toast.error(t('upload.validation.noContent'))
      return
    }
    
    try {
      // Start processing timer (sets isLoading=true)
      startProcessing()
      
      // Process uploaded files and ensure they generate content
      if (files.length > 0) {
        await processFiles(); // Call for side effects
        // Wait a moment to ensure state has updated
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Get the current state after files are processed
      const currentState = useUploadStore.getState();
      
      // Use direct input text if no files, otherwise use the processed summary
      const combinedText = files.length > 0 
        ? currentState.summary || inputText  // Use summary if available, fall back to input text
        : inputText;
      
      if (!combinedText || combinedText.trim() === '') {
        throw new Error('No content to process');
      }
      
      console.log('Sending content to backend, length:', combinedText.length);
      
      // Send to backend - making sure we have actual content - and WAIT for complete response
      // This is a long-running operation that may take 1-2 minutes with Gemini
      const response = await apiClient.postSummary(combinedText)
      
      // Only proceed with redirect when we have a valid notionMarkdown response AND stats
      // This ensures we got a complete response from Gemini including token usage info
      if (!response || !response.notionMarkdown || !response.stats) {
        throw new Error('Invalid or incomplete server response')
      }
      
      // Log token usage information
      console.log('Gemini API response received:');
      console.log('- Generation time:', response.stats.generationTimeMs, 'ms');
      if (response.stats.inputTokens) {
        console.log('- Input tokens:', response.stats.inputTokens);
        console.log('- Output tokens:', response.stats.outputTokens);
        console.log('- Total tokens:', response.stats.inputTokens + response.stats.outputTokens);
      }
      
      // Save the complete markdown response
      setSummary(response.notionMarkdown)
      
      // Now that we have the complete summary with all token information, show success
      toast.success(t('upload.toast.success'))
      
      // Navigate to the summary page - we keep timer running during navigation
      router.push('./summary')
      
      // NOTE: We do NOT stop the timer here
      // The timer will continue running until the user reaches the summary page
      // The summary page component will be responsible for stopping the timer when it loads
      
    } catch (err: unknown) {
      console.error('Error generating summary:', err);
      
      // Verificar si es un error de API y manejar según su tipo
      if (err instanceof ApiError) {
        switch(err.type) {
          case ApiErrorType.QUOTA_EXCEEDED:
            toast.error(t('upload.toast.quotaExceeded'));
            break;
          case ApiErrorType.NETWORK_ERROR:
            toast.error(t('upload.toast.networkError'));
            break;
          case ApiErrorType.INVALID_API_KEY:
            toast.error(t('upload.toast.apiKeyError'));
            break;
          default:
            toast.error(t('upload.toast.error', { message: err.message }));
        }
      } else {
        // Para errores genéricos
        let message = 'Unknown error';
        if (typeof err === 'object' && err && 'message' in err && typeof (err as { message?: string }).message === 'string') {
          message = (err as { message: string }).message;
        }
        toast.error(t('upload.toast.error', { message }));
      }
      
      // We don't stop the timer on error, it will continue running
      // This ensures the timer continues even if there's an error
      // The user can cancel or try again without the timer resetting
    }
  }
  
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
              className="space-y-4"
            >
              <motion.div 
                variants={itemVariants}
                className="text-center"
              >
                <h1 className="text-2xl font-bold mb-2">{t('upload.title')}</h1>
                <p className="text-muted-foreground">{t('upload.description')}</p>
              </motion.div>

              <Card className="shadow-sm border-2 border-muted rounded-lg overflow-hidden">
                <CardContent>
                  <motion.div 
                    variants={itemVariants}
                    className="space-y-6"
                  >
                    <div className="grid gap-4">
                      <motion.div 
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="relative"
                      >
                        <FileDropzone 
                          addFiles={addFiles}
                          className="border-2 border-dashed border-primary/50 rounded-lg p-8 text-center"
                        />
                      </motion.div>

                      {files.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="space-y-2"
                        >
                          <FileList 
                            files={files}
                            onRemove={removeFile}
                            className="space-y-2"
                          />
                        </motion.div>
                      )}
                    </div>

                    <motion.div 
                      variants={itemVariants}
                      className="relative"
                    >
                      <Textarea
                        placeholder={t('upload.textPlaceholder')}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="resize-none min-h-[100px]"
                      />
                    </motion.div>
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-md py-4 z-10">
        <div className="container max-w-4xl mx-auto flex justify-end gap-4">
          <Button 
            onClick={() => router.push('/')}
            variant="outline"
            className="transition-all hover:scale-105"
          >
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleGenerateSummary}
            disabled={isLoading || (!files.length && !inputText)}
            className="transition-all hover:bg-primary/80"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('upload.button.generating')} ({displayTime})
              </>
            ) : (
              t('upload.process')
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}

// Main component with Suspense boundary
export default function UploadPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading...</div>}>
      <UploadContent />
    </Suspense>
  );
}