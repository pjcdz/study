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
  const { currentStep, summary, flashcards, reset } = useUploadStore()
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('navigation')
  
  const handleTabChange = (value: string) => {
    // Validaciones para evitar navegación a pasos no completados
    if (value === 'summary' && !summary) {
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
    <div className="w-full border-b">
      <div className="container max-w-7xl px-4 sm:px-6 lg:px-8 mx-auto flex items-center justify-between py-2">
        <div className="w-full flex justify-center">
          <Tabs 
            value={currentStep} 
            onValueChange={handleTabChange} 
            className="w-full max-w-lg"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="upload">
                <Upload className="h-4 w-4 mr-2" />
                {t('upload')}
              </TabsTrigger>
              <TabsTrigger value="summary" disabled={!summary}>
                <FileText className="h-4 w-4 mr-2" />
                {t('summary')}
              </TabsTrigger>
              <TabsTrigger value="flashcards" disabled={!flashcards}>
                <BookOpen className="h-4 w-4 mr-2" />
                {t('flashcards')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" size="icon" title={t('restart')} className="ml-4">
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
              <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
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