"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useUploadStore } from "@/store/use-upload-store"
import { useRouter, usePathname } from "next/navigation"
import { useTranslations } from 'next-intl'
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
import { Button } from "@/components/ui/button"
import { RefreshCw, Upload, FileText, BookOpen } from "lucide-react"

export function WorkflowTabs() {
  const { currentStep, summaries, flashcards, reset } = useUploadStore()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('navigation')
  const tCommon = useTranslations('common')
  
  const handleTabChange = (value: string) => {
    // Validaciones para evitar navegación a pasos no completados
    if (value === 'summary' && (!summaries || summaries.length === 0)) {
      return // Mantener en upload si no hay resumen
    }
    
    if (value === 'flashcards' && !flashcards) {
      return // Mantener en summary si no hay flashcards
    }
    
    // Obtener el prefijo de idioma de la ruta actual
    const localePrefix = pathname.split('/')[1]; // Obtiene 'es' o 'en', etc.
    router.push(`/${localePrefix}/${value}`)
  }
  
  return (
    <div className="w-full">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto flex items-center justify-between py-2">
        <div className="w-full flex justify-center">
          <Tabs 
            value={currentStep} 
            onValueChange={handleTabChange} 
            className="w-full max-w-lg"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload" className="transition-all data-[state=active]:border-b-2 data-[state=active]:border-primary hover:border-ring/60 hover:border-2">
                <Upload className="h-4 w-4 mr-2 hidden sm:inline" />
                {t('upload')}
              </TabsTrigger>
              <TabsTrigger value="summary" disabled={!summaries || summaries.length === 0} className="transition-all data-[state=active]:border-b-2 data-[state=active]:border-primary hover:border-ring/60 hover:border-2">
                <FileText className="h-4 w-4 mr-2 hidden sm:inline" />
                {t('summary')}
              </TabsTrigger>
              <TabsTrigger value="flashcards" disabled={!flashcards} className="transition-all data-[state=active]:border-b-2 data-[state=active]:border-primary hover:border-ring/60 hover:border-2">
                <BookOpen className="h-4 w-4 mr-2 hidden sm:inline" />
                {t('flashcards')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              title={t('restart')} 
              className="ml-4 transition-all hover:border-ring hover:border-2 hover:shadow-[0_0_8px_rgba(var(--color-ring)/0.4)]"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('restartConfirm')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('restartDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{tCommon('cancel')}</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                reset()
                // Obtener el prefijo de idioma de la ruta actual
                const localePrefix = pathname.split('/')[1]; // Obtiene 'es' o 'en', etc.
                router.push(`/${localePrefix}/upload`)
              }}>
                {t('confirm')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}