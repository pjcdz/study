"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { ClipboardCopy, Check, ExternalLink, RefreshCw } from "lucide-react"
import { useUploadStore } from "@/store/use-upload-store"
import { useTranslations } from "next-intl"
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

export default function FlashcardsPage() {
  const t = useTranslations('flashcards');
  const tNav = useTranslations('navigation');
  const tCommon = useTranslations('common');
  const { flashcards, reset } = useUploadStore()
  const [isCopied, setIsCopied] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  
  useEffect(() => {
    // Only run on the client side
    if (!flashcards) {
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1]; // Get the locale from the URL ('es' or 'en')
      router.push(`/${locale}/summary`);
    }
  }, [flashcards, router]);
  
  // Early return during server-side rendering or if there are no flashcards
  if (typeof window === 'undefined' || !flashcards) {
    return null;
  }
  
  // Process TSV to clean markdown tags and code blocks if they exist
  const cleanTSV = (() => {
    let cleaned = flashcards;
    
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
          </CardContent>
          
          {/* Botón "Start Over" con texto más descriptivo y usando traducciones */}
          <CardFooter className="flex flex-col justify-center pt-6 border-t gap-2">
            <p className="text-sm text-muted-foreground text-center mb-1">
              {/* Usar traducciones en lugar de texto hardcodeado */}
              {t('actions.needMoreMaterials', { defaultValue: "¿Necesitas generar otro material de estudio?" })}
            </p>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
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
                    reset()
                    // Obtener el prefijo de idioma de la ruta actual
                    const localePrefix = pathname.split('/')[1];
                    router.push(`/${localePrefix}/upload`)
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