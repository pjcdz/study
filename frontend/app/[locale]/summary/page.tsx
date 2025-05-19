"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { Loader2, ClipboardCopy, Check, Zap, ExternalLink, ChevronLeft, ChevronRight, Minimize } from "lucide-react"
import { useUploadStore } from "@/store/use-upload-store"
import apiClient, { ApiError, ApiErrorType } from "@/lib/api-client"
import { useTranslations } from "next-intl"
import { useProcessingTimer } from "@/lib/hooks/useProcessingTimer"

export default function SummaryPage() {
  const t = useTranslations('summary');
  const { 
    summaries, 
    currentSummaryIndex,
    setCurrentSummaryIndex,
    addSummary,
    getCurrentSummary,
    setFlashcards, 
    setCurrentStep
  } = useUploadStore()

  // Using the shared timer hook for consistent timer experience
  const { isLoading, displayTime, startProcessing, stopProcessing } = useProcessingTimer()
  
  // Separate loading states for different operations
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false)
  const [isCondensing, setIsCondensing] = useState(false)
  
  const [isCopied, setIsCopied] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Only run on client side
    if ((!summaries || summaries.length === 0) && typeof window !== 'undefined') {
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1]; // Get locale from URL ('es' or 'en')
      router.push(`/${locale}/upload`);
      return;
    }

    // Cuando llegamos a esta página desde upload, el timer debería estar corriendo
    // Lo detenemos después de un breve retraso para una transición visual suave
    const timer = setTimeout(() => {
      stopProcessing();
    }, 500);

    return () => clearTimeout(timer);
  }, [summaries, router, stopProcessing]);
  
  // Early return during server-side rendering or if there's no summary
  if (typeof window === 'undefined' || !summaries || summaries.length === 0) {
    return null;
  }

  const currentSummary = getCurrentSummary();
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(currentSummary)
      .then(() => {
        setIsCopied(true)
        toast.success(t('toast.copied'))
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch(() => {
        toast.error(t('toast.copyError'))
      })
  }

  const handlePrevSummary = () => {
    if (currentSummaryIndex > 0) {
      setCurrentSummaryIndex(currentSummaryIndex - 1);
    }
  };

  const handleNextSummary = () => {
    if (currentSummaryIndex < summaries.length - 1) {
      setCurrentSummaryIndex(currentSummaryIndex + 1);
    }
  };
  
  const handleGenerateFlashcards = async () => {
    try {
      // Use separate loading state for flashcard generation
      setIsGeneratingFlashcards(true)
      startProcessing()
      
      const response = await apiClient.postFlashcards(currentSummary)
      
      // Handle response
      let tsv = response.flashcardsTSV
      if (typeof tsv === 'object' && tsv.text) {
        tsv = tsv.text
      }
      
      setFlashcards(tsv)
      setCurrentStep('flashcards')
      
      toast.success(t('toast.success'))
      
      // Build path to maintain current locale
      if (typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/');
        const locale = pathParts[1]; // Get locale from URL ('es' or 'en')
        
        // Navigate to flashcards page - keep timer running during navigation
        router.push(`/${locale}/flashcards`);
        
        // Timer will be cleared on the next page after a brief transition
      }
    } catch (err: unknown) {
      // Verificar si es un error de API y manejar según su tipo
      if (err instanceof ApiError) {
        switch(err.type) {
          case ApiErrorType.QUOTA_EXCEEDED:
            toast.error(t('toast.quotaExceeded'));
            break;
          case ApiErrorType.NETWORK_ERROR:
            toast.error(t('toast.networkError'));
            break;
          case ApiErrorType.INVALID_API_KEY:
            toast.error(t('toast.apiKeyError'));
            break;
          default:
            toast.error(t('toast.error', { message: err.message }));
        }
      } else {
        // Para errores genéricos
        let message = 'Unknown error';
        if (typeof err === 'object' && err && 'message' in err) {
          message = (err as { message: string }).message;
        }
        toast.error(t('toast.error', { message }));
      }
      
      // Stop the timer on error
      stopProcessing()
      setIsGeneratingFlashcards(false)
    }
  }

  // New handler for "Condense more" functionality
  const handleCondenseSummary = async () => {
    try {
      // Limit to 3 versions total
      if (summaries.length >= 3) {
        toast.info(t('toast.maxVersionsReached', { defaultValue: 'Maximum number of summary versions reached (3)' }))
        return
      }
      
      // Use separate loading state for condensing
      setIsCondensing(true)
      startProcessing()
      
      // Make API call to condense the current summary
      const response = await apiClient.condenseSummary(currentSummary)
      
      // Get the condensed summary from the response
      const { condensedSummary } = response;
      
      // Add the new condensed summary and move to it
      addSummary(condensedSummary);
      setCurrentSummaryIndex(summaries.length); // This points to the newly added summary
      
      toast.success(t('toast.condensed', { defaultValue: 'Summary condensed successfully' }))
      
      // Stop the timer and loading states
      stopProcessing()
      setIsCondensing(false)
    } catch (err: unknown) {
      // Error handling similar to generateFlashcards
      if (err instanceof ApiError) {
        switch(err.type) {
          case ApiErrorType.QUOTA_EXCEEDED:
            toast.error(t('toast.quotaExceeded'));
            break;
          case ApiErrorType.NETWORK_ERROR:
            toast.error(t('toast.networkError'));
            break;
          case ApiErrorType.INVALID_API_KEY:
            toast.error(t('toast.apiKeyError'));
            break;
          default:
            toast.error(t('toast.error', { message: err.message }));
        }
      } else {
        // Para errores genéricos
        let message = 'Unknown error';
        if (typeof err === 'object' && err && 'message' in err) {
          message = (err as { message: string }).message;
        }
        toast.error(t('toast.error', { message }));
      }
      
      // Stop the timer on error
      stopProcessing()
      setIsCondensing(false)
    }
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Main content with padding-bottom to ensure content doesn't get hidden under fixed footer */}
      <div className="flex-grow pb-20">
        <div className="container max-w-4xl py-6 mx-auto">
          <Card className="shadow-md">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>{t('title')}</CardTitle>
                <CardDescription>
                  {t('description')}
                </CardDescription>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                  className="transition-all hover:border-primary hover:border-2 hover:shadow-[0_0_10px_rgba(var(--color-primary)/0.3)]"
                >
                  {isCopied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                  )}
                  {t('actions.copy')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="transition-all hover:border-accent hover:border-2 hover:shadow-[0_0_10px_rgba(var(--color-accent)/0.3)]"
                >
                  <a 
                    href="https://www.notion.so/new"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    {t('actions.openNotion', { defaultValue: 'Open in Notion' })}
                  </a>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                {/* Summary navigation control */}
                {summaries.length > 1 && (
                  <div className="flex items-center justify-center mb-4">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handlePrevSummary}
                      disabled={currentSummaryIndex === 0}
                      className="transition-all hover:border-ring hover:border-2 hover:shadow-[0_0_8px_rgba(var(--color-ring)/0.4)]"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="mx-4 text-sm">
                      {currentSummaryIndex + 1} / {summaries.length}
                    </span>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleNextSummary}
                      disabled={currentSummaryIndex === summaries.length - 1}
                      className="transition-all hover:border-ring hover:border-2 hover:shadow-[0_0_8px_rgba(var(--color-ring)/0.4)]"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                
                <ScrollArea className="h-[300px] rounded-md border p-4 bg-muted">
                  <div className="flex justify-center">
                    <pre className="font-mono text-sm whitespace-pre-wrap max-w-[90%]">
                      {currentSummary}
                    </pre>
                  </div>
                </ScrollArea>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('content.ready', { defaultValue: 'Your summary is ready to be copied' })}
                </p>
              </div>
              
              <Alert>
                <AlertTitle>{t('instructions.title', { defaultValue: 'How to use with Notion' })}</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                    <li>{t('instructions.steps.1', { defaultValue: 'Click "Open in Notion" button to open a new Notion page' })}</li>
                    <li>{t('instructions.steps.2', { defaultValue: 'Click "Copy" to copy all the summary content' })}</li>
                    <li>{t('instructions.steps.3', { defaultValue: 'Paste the content into your Notion page' })}</li>
                    <li>{t('instructions.steps.4', { defaultValue: 'The Markdown formatting will be automatically applied' })}</li>
                    <li>{t('instructions.steps.5', { defaultValue: 'Save your Notion page and organize it in your workspace' })}</li>
                  </ol>
                  <p className="text-sm mt-2">
                    <strong>{t('instructions.note', { defaultValue: 'Notion supports Markdown natively, so your summary will keep its formatting when pasted.' })}</strong>
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed footer with both buttons */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-md py-4 z-10">
        <div className="container max-w-4xl mx-auto flex justify-center space-x-4">
          <Button
            size="lg"
            disabled={isCondensing || isGeneratingFlashcards}
            onClick={handleCondenseSummary}
            className="transition-all hover:bg-primary/10 hover:border-secondary hover:border-2 hover:shadow-[0_0_15px_rgba(var(--color-secondary)/0.4)]"
            variant="outline"
          >
            {isCondensing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('actions.condensing', { defaultValue: 'Processing' })} ({displayTime})
              </>
            ) : (
              <>
                <Minimize className="mr-2 h-4 w-4" />
                {t('actions.condense', { defaultValue: 'Resumir más' })}
              </>
            )}
          </Button>
          
          <Button
            size="lg"
            disabled={isCondensing || isGeneratingFlashcards}
            onClick={handleGenerateFlashcards}
            className="transition-all hover:border-primary hover:border-2 hover:shadow-[0_0_15px_rgba(var(--color-primary)/0.5)]"
          >
            {isGeneratingFlashcards ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('actions.generating')} ({displayTime})
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {t('actions.generateFlashcards')}
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  )
}