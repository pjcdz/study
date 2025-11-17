"use client"

import { useState, useEffect, useRef, Suspense } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ClipboardCopy, Check, ExternalLink, RefreshCw, Info } from "lucide-react"
import { useUploadStore } from "@/store/use-upload-store"
import { StreamingText } from "@/components/streaming/streaming-text"
import { useTranslations } from "next-intl"
import { demoFlashcardsTSV } from "@/lib/mock-data"
import { useIsMobile } from "@/lib/hooks/useIsMobile"
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"

// Create a content component to wrap in Suspense
function FlashcardsContent() {
  const t = useTranslations('flashcards');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { 
    flashcards, 
    setFlashcards, 
    reset,
    // Streaming state
    isStreamingFlashcards,
    streamingFlashcardsText,
    currentCharDelay
  } = useUploadStore()
  const [isCopied, setIsCopied] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const isMobile = useIsMobile();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Check if we're in demo mode
  const [isDemoMode, setIsDemoMode] = useState(false)
  
  useEffect(() => {
    // Check if demo mode is enabled
    const demoMode = process.env.USE_DEMO_CONTENT === 'true' || 
                    window.localStorage.getItem('USE_DEMO_CONTENT') === 'true';
    setIsDemoMode(demoMode)
    
    // Log estado del store al entrar a la página de flashcards
    console.log('FlashcardsPage - Estado inicial:', {
      flashcardsExist: !!flashcards,
      flashcardsLength: flashcards?.length || 0,
      currentStep: useUploadStore.getState().currentStep,
      isDemoMode: demoMode
    });
    
    // In demo mode, ensure we have flashcards data
    if (demoMode && !flashcards) {
      console.log('🧪 Demo mode: Setting default flashcards');
      setFlashcards(demoFlashcardsTSV);
    }
    
    // For normal mode, redirect if no flashcards and not streaming
    if (!demoMode && !flashcards && !isStreamingFlashcards) {
      console.log('No existen flashcards en el store, redirigiendo a summary');
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1]; // Get the locale from the URL ('es' or 'en')
      router.push(`/${locale}/summary`);
    }
  }, [flashcards, router, setFlashcards, isStreamingFlashcards]);
  
  // Auto-scroll to bottom during streaming
  useEffect(() => {
    if (isStreamingFlashcards && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [streamingFlashcardsText, isStreamingFlashcards]);
  
  // Early return during server-side rendering or if there are no flashcards (and not in demo mode and not streaming)
  if (typeof window === 'undefined' || (!flashcards && !isDemoMode && !isStreamingFlashcards)) {
    return null;
  }
  
  // Use flashcards from store or streaming text or demo flashcards
  const displayFlashcards = isStreamingFlashcards 
    ? streamingFlashcardsText 
    : (flashcards || (isDemoMode ? demoFlashcardsTSV : ''));
  
  // Process TSV to clean markdown tags and code blocks if they exist
  const cleanTSV = (() => {
    let cleaned = displayFlashcards;
    
    // Remover marcas de código al principio y al final (como estaba anteriormente)
    if (cleaned.startsWith('```markdown')) {
      cleaned = cleaned.substring('```markdown'.length);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    
    // Nueva lógica: remover bloques de código en cualquier parte del texto
    const lines = cleaned.split('\n');
    const filteredLines = [];
    let insideCodeBlock = false;
    
    for (const line of lines) {
      // Detectar inicio o fin de un bloque de código
      if (line.trim().startsWith('```') || line.trim() === '```') {
        insideCodeBlock = !insideCodeBlock;
        // No incluir líneas con ```
        continue;
      }
      
      // Solo incluir líneas que no estén dentro de un bloque de código
      if (!insideCodeBlock) {
        filteredLines.push(line);
      }
    }
    
    // Asegurar que no hay líneas vacías adicionales
    return filteredLines.join('\n').trim();
  })();
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(cleanTSV)
      .then(() => {
        setIsCopied(true)
        toast.success(t('toast.copied'))
        setTimeout(() => setIsCopied(false), 2000)
      })
      .catch(() => {
        toast.error(t('toast.copyError'))
      })
  }
  
  return (
    <div className="flex justify-center w-full">
      <div className="w-full max-w-[896px] px-4 py-6">
        <Card>
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
                  href="https://quizlet.com/create-set"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  {t('actions.openQuizlet')}
                </a>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="tsvContent" className="text-sm font-medium block mb-1">
                {t('content.label')}
              </label>
              <div ref={scrollAreaRef}>
                <ScrollArea className="h-[170px] rounded-md border p-4 bg-muted">
                  <div className="flex justify-center">
                    {isStreamingFlashcards ? (
                      <div className="font-mono text-sm max-w-[90%]">
                        <StreamingText
                          textToType={cleanTSV}
                          charDelay={currentCharDelay}
                          isStreaming={true}
                        />
                      </div>
                    ) : (
                      <pre className="font-mono text-sm whitespace-pre-wrap max-w-[90%]">
                        {cleanTSV}
                      </pre>
                    )}
                  </div>
                </ScrollArea>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {isStreamingFlashcards 
                  ? t('content.generating', { defaultValue: 'Generando flashcards...' })
                  : t('content.ready')
                }
              </p>
            </div>
            
            <Alert>
              <AlertTitle className="flex items-center gap-2">
                {t('instructions.title')}
                {isMobile && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className="cursor-help">
                          <Info className="h-3 w-3 mr-1" />
                          Desktop only
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{t('instructions.quizletImportDesktopOnly')}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </AlertTitle>
              <AlertDescription>
                {isMobile && (
                  <div className="rounded-md bg-yellow-50 p-3 mb-2 border border-yellow-200">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <Info className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          {t('instructions.quizletImportDesktopOnly')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                <ol className="list-decimal list-inside space-y-1 text-sm mt-2">
                  <li>{t('instructions.steps.1')}</li>
                  <li>{t('instructions.steps.2')}</li>
                  <li>{t('instructions.steps.3')}</li>
                  <li>{t('instructions.steps.4')}</li>
                  <li>{t('instructions.steps.5')}</li>
                </ol>
                <p className="text-sm mt-2">
                  <strong>{t('instructions.note')}</strong>
                </p>
              </AlertDescription>
            </Alert>
          </CardContent>
          
          {/* Botón "Start Over" con texto más descriptivo y usando traducciones */}
          <CardFooter className="flex flex-col justify-center pt-6 border-t gap-2">
            <p className="text-sm text-muted-foreground text-center mb-1">
              {/* Usar traducciones en lugar de texto hardcodeado */}
              {t('actions.needMoreMaterials', { defaultValue: "¿Necesitas generar otro material de estudio?" })}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 transition-all hover:border-ring hover:border-2 hover:shadow-[0_0_10px_rgba(var(--color-ring)/0.4)]"
                >
                  <RefreshCw className="h-4 w-4" />
                  {/* Usar traducciones en lugar de texto hardcodeado */}
                  {t('actions.startNewProject', { defaultValue: "Comenzar nuevo proyecto" })}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{tNav('restartConfirm')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {tNav('restartDescription')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={() => {
                    // Use our enhanced reset function that now handles all localStorage cleanup
                    reset()
                    
                    // No need to manually remove items as that's now handled in the reset function
                    
                    // Obtain the language prefix from the current path
                    const localePrefix = pathname.split('/')[1];
                    router.push(`/${localePrefix}/upload`)
                    
                    // Show confirmation toast
                    toast.success(t('toast.resetSuccess', { defaultValue: 'All data cleared. Ready to start a new session.' }))
                  }}>
                    {tNav('confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}

// Main component with Suspense boundary
export default function FlashcardsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center p-8">Loading flashcards...</div>}>
      <FlashcardsContent />
    </Suspense>
  );
}