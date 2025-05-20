"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ClipboardCopy, Check, ExternalLink, RefreshCw, Loader2 } from "lucide-react"
import { useUploadStore } from "@/store/use-upload-store"
import { useTranslations } from "next-intl"
import { demoFlashcardsTSV } from "@/lib/mock-data"
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

// Loading fallbacks for different sections
const HeaderLoadingFallback = () => (
  <div className="animate-pulse space-y-3 p-6">
    <div className="h-6 w-1/3 bg-muted rounded-md"></div>
    <div className="h-4 w-1/2 bg-muted rounded-md"></div>
  </div>
);

const ContentLoadingFallback = () => (
  <div className="space-y-4 p-6">
    <div className="h-4 w-1/4 bg-muted rounded-md"></div>
    <div className="h-[120px] rounded-md border bg-muted animate-pulse"></div>
    <div className="h-4 w-2/3 bg-muted rounded-md"></div>
  </div>
);

const AlertLoadingFallback = () => (
  <div className="rounded-md border p-4 bg-muted/30 animate-pulse space-y-3 mx-6 mb-6">
    <div className="h-5 w-1/4 bg-muted rounded-md"></div>
    <div className="space-y-2">
      <div className="h-3 w-full bg-muted rounded-md"></div>
      <div className="h-3 w-full bg-muted rounded-md"></div>
      <div className="h-3 w-2/3 bg-muted rounded-md"></div>
    </div>
  </div>
);

const FooterLoadingFallback = () => (
  <div className="border-t p-6 animate-pulse">
    <div className="h-4 w-1/2 bg-muted rounded-md mx-auto mb-3"></div>
    <div className="h-10 w-48 bg-muted rounded-md mx-auto"></div>
  </div>
);

// Create a content component to wrap in Suspense
function FlashcardsContent() {
  const t = useTranslations('flashcards');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { flashcards, setFlashcards, reset } = useUploadStore()
  const [isCopied, setIsCopied] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
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
    
    // For normal mode, redirect if no flashcards
    if (!demoMode && !flashcards) {
      console.log('No existen flashcards en el store, redirigiendo a summary');
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1]; // Get the locale from the URL ('es' or 'en')
      router.push(`/${locale}/summary`);
    }
  }, [flashcards, router, setFlashcards]);
  
  // Early return during server-side rendering or if there are no flashcards (and not in demo mode)
  if (typeof window === 'undefined' || (!flashcards && !isDemoMode)) {
    return null;
  }
  
  // Use flashcards from store or demo flashcards if in demo mode and no store value
  const displayFlashcards = flashcards || (isDemoMode ? demoFlashcardsTSV : '');
  
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
      <div className="container max-w-4xl py-6">
        <Card>
          <Suspense fallback={<HeaderLoadingFallback />}>
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
          </Suspense>

          <Suspense fallback={<ContentLoadingFallback />}>
            <CardContent className="space-y-4">
              <div>
                <label htmlFor="tsvContent" className="text-sm font-medium block mb-1">
                  {t('content.label')}
                </label>
                <Textarea
                  id="tsvContent"
                  value={cleanTSV}
                  readOnly
                  className="min-h-[80px] max-h-[170px] overflow-y-auto font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {t('content.ready')}
                </p>
              </div>
            </CardContent>
          </Suspense>
          
          <Suspense fallback={<AlertLoadingFallback />}>
            <div className="px-6 pb-6">
              <Alert>
                <AlertTitle>{t('instructions.title')}</AlertTitle>
                <AlertDescription>
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
            </div>
          </Suspense>
          
          {/* Botón "Start Over" con texto más descriptivo y usando traducciones */}
          <Suspense fallback={<FooterLoadingFallback />}>
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
          </Suspense>
        </Card>
      </div>
    </div>
  )
}

// Main component with enhanced Suspense boundary
export default function FlashcardsPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col items-center justify-center p-12 min-h-[50vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Cargando flashcards...</p>
      </div>
    }>
      <FlashcardsContent />
    </Suspense>
  );
}