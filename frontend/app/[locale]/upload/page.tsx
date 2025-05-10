"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUploadStore } from "@/store/use-upload-store"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"
import apiClient from "@/lib/api-client"
import { useTranslations } from "next-intl"

// Configuración para validación de archivos
const MAX_FILE_SIZE = 10; // 10MB
const ALLOWED_FILE_TYPES = [
  'text/plain', 
  'text/markdown', 
  'text/csv', 
  'application/json', 
  'application/pdf', 
  'image/jpeg', 
  'image/png', 
  'image/webp'
];

export default function UploadPage() {
  const t = useTranslations('upload');
  const { 
    files, 
    inputText, 
    setInputText, 
    setSummary, 
    setCurrentStep, 
    isLoading, 
    setIsLoading,
    addFiles: originalAddFiles
  } = useUploadStore()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  
  // Función mejorada de validación de archivos
  const addFiles = (newFiles: File[]) => {
    for (const file of newFiles) {
      // Validar tamaño de archivo (en MB)
      if (file.size > MAX_FILE_SIZE * 1024 * 1024) {
        toast.error(t('validation.fileTooLarge', { maxSize: MAX_FILE_SIZE }));
        continue;
      }
      
      // Validar tipo de archivo
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        toast.error(t('validation.invalidFileType', { type: file.type }));
        continue;
      }
      
      // Si pasa las validaciones, añadir el archivo
      originalAddFiles([file]);
    }
  };
  
  const processFiles = async () => {
    try {
      let extractedText = ''
      
      for (const file of files) {
        if (file.type.includes('image/')) {
          // Para imágenes, usar base64
          const base64 = await fileToBase64(file)
          extractedText += `[Image Content: ${file.name}]\n${base64}\n\n`
        } else if (file.type === 'application/pdf') {
          // Para PDFs (información básica)
          extractedText += `[PDF Document: ${file.name}]\n`
          extractedText += `This is a PDF document that contains information about "${file.name.replace('.pdf', '')}". `
          extractedText += `Please analyze the content of the file that is related to this topic. `
          extractedText += `The document has a size of ${Math.round(file.size / 1024)} KB.\n\n`
          
          if (inputText) {
            extractedText += `Additional context provided by the user:\n${inputText}\n\n`
          }
        } else if (file.type.includes('text/') || file.type === 'application/json') {
          // Para archivos de texto
          const text = await file.text()
          extractedText += `[Text Content: ${file.name}]\n${text}\n\n`
        }
      }
      
      return extractedText
    } catch (err) {
      console.error('Error processing files:', err)
      throw new Error('Error al procesar los archivos')
    }
  }
  
  // Helper para convertir archivo a base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = (error) => reject(error)
    })
  }
  
  const handleGenerateSummary = async () => {
    if (!inputText && files.length === 0) {
      setError(t('validation.noContent'))
      return
    }
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Procesar archivos subidos
      let fileContent = ''
      if (files.length > 0) {
        fileContent = await processFiles()
      }
      
      // Combinar contenido de archivos con texto manual
      const combinedText = files.length > 0 ? fileContent : inputText
      
      // Enviar al backend
      const response = await apiClient.postSummary(combinedText)
      
      if (!response || !response.notionMarkdown) {
        throw new Error('Respuesta del servidor inválida')
      }
      
      toast.success(t('toast.success'))
      
      setSummary(response.notionMarkdown)
      setCurrentStep('summary')
      router.push('./summary')
      
    } catch (err: any) {
      console.error('Error al generar resumen:', err)
      setError(`${t('toast.error', { message: err.message })}`)
      toast.error(t('toast.error', { message: err.message }))
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24"> {/* Añadido pb-24 para dar espacio al botón fijo */}
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>
            {t('description')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileDropzone addFiles={addFiles} />
          <FileList />
          
          <div className="space-y-2">
            <label htmlFor="inputText" className="text-sm font-medium">
              {files.length > 0 
                ? t('textInput.labelWithFiles') 
                : t('textInput.labelWithoutFiles')
              }
            </label>
            <Textarea
              id="inputText"
              placeholder={files.length > 0 
                ? t('textInput.placeholderWithFiles') 
                : t('textInput.placeholderWithoutFiles')
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="min-h-[150px]"
            />
            <p className="text-xs text-muted-foreground">
              {files.length > 0 
                ? t('textInput.helpWithFiles') 
                : t('textInput.helpWithoutFiles')
              }
            </p>
          </div>
          
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
      
      {/* Botón fijo en la parte inferior */}
      <div className="fixed bottom-0 left-0 right-0 py-4 bg-background border-t z-10">
        <div className="container max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
          <Button 
            onClick={handleGenerateSummary}
            disabled={isLoading || (!inputText && files.length === 0)}
            className="min-w-[180px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('button.generating')}
              </>
            ) : (
              t('button.generate')
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}