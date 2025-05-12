"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Loader2, ClipboardCopy, Check, Zap, Edit } from "lucide-react"
import { useUploadStore } from "@/store/use-upload-store"
import apiClient, { ApiError, ApiErrorType } from "@/lib/api-client"
import { useTranslations } from "next-intl"
import { useProcessingTimer } from "@/lib/hooks/useProcessingTimer"

export default function SummaryPage() {
  const t = useTranslations('summary');
  const { 
    summary, 
    setFlashcards, 
    setCurrentStep
  } = useUploadStore()

  // Using the shared timer hook for consistent timer experience
  const { isLoading, displayTime, startProcessing, stopProcessing } = useProcessingTimer()
  
  const [isEditing, setIsEditing] = useState(false)
  const [editedMarkdown, setEditedMarkdown] = useState(summary || "")
  const [isCopied, setIsCopied] = useState(false)
  const router = useRouter()
  
  useEffect(() => {
    // Only run on client side
    if (!summary && typeof window !== 'undefined') {
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
  }, [summary, router, stopProcessing]);
  
  // Early return during server-side rendering or if there's no summary
  if (typeof window === 'undefined' || !summary) {
    return null;
  }
  
  const handleCopyToClipboard = () => {
    const textToCopy = isEditing ? editedMarkdown : summary
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        setIsCopied(true)
        toast.success(t('toast.copied'))
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch(() => {
        toast.error(t('toast.copyError'))
      })
  }
  
  const handleToggleEdit = () => {
    if (isEditing) {
      // Save changes
      setIsEditing(false)
    } else {
      // Enter edit mode
      setEditedMarkdown(summary)
      setIsEditing(true)
    }
  }
  
  const handleGenerateFlashcards = async () => {
    const markdownToUse = isEditing ? editedMarkdown : summary
    
    try {
      // Start the processing timer
      startProcessing()
      
      const response = await apiClient.postFlashcards(markdownToUse)
      
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
                  onClick={handleToggleEdit}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  {isEditing ? t('actions.save') : t('actions.edit')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyToClipboard}
                >
                  {isCopied ? (
                    <Check className="mr-2 h-4 w-4" />
                  ) : (
                    <ClipboardCopy className="mr-2 h-4 w-4" />
                  )}
                  {t('actions.copy')}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-full">
                {isEditing ? (
                  <Textarea
                    value={editedMarkdown}
                    onChange={(e) => setEditedMarkdown(e.target.value)}
                    className="min-h-[400px] font-mono text-sm w-full"
                  />
                ) : (
                  <ScrollArea className="h-[400px] rounded-md border p-4 bg-muted">
                    <div className="flex justify-center">
                      <pre className="font-mono text-sm whitespace-pre-wrap max-w-[90%]">
                        {summary}
                      </pre>
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Fixed footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-background border-t border-border shadow-md py-4 z-10">
        <div className="container max-w-4xl mx-auto flex justify-center">
          <Button
            size="lg"
            disabled={isLoading}
            onClick={handleGenerateFlashcards}
            className="transition-all hover:bg-primary/80"
          >
            {isLoading ? (
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