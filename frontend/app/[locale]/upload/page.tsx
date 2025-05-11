"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useUploadStore } from '@/store/use-upload-store'
import { useTranslations } from 'next-intl'
import apiClient from "@/lib/api-client"
import { FileDropzone } from "@/components/upload/file-dropzone"
import { FileList } from "@/components/upload/file-list"
import { motion } from "framer-motion"


export default function UploadPage() {
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
  const {
    files,
    inputText,
    summary,
    isLoading,
    addFiles,
    removeFile,
    setInputText,
    setSummary,
    setIsLoading
  } = useUploadStore()

  // Función mejorada de validación de archivos
  

  const processFiles = async () => {
    try {
      setIsLoading(true)
      
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
      setIsLoading(false)
    } catch (error: unknown) {
      console.error('Error processing files:', error)
      toast.error(t('toast.error', { message: 'Error processing files' }) as string)
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
      toast.error(t('validation.noContent'))
      return
    }
    
    try {
      setIsLoading(true)
      
      // Procesar archivos subidos
      if (files.length > 0) {
        await processFiles(); // Only call for side effects
      }
      // Aquí puedes continuar con la lógica para generar el resumen
      const combinedText = files.length > 0 ? summary : inputText
      
      // Enviar al backend
      const response = await apiClient.postSummary(combinedText)
      
      if (!response || !response.notionMarkdown) {
        throw new Error('Respuesta del servidor inválida')
      }
      
      toast.success(t('toast.success'))
      
      setSummary(response.notionMarkdown)
      setIsLoading(false)
      router.push('./summary')
      
    } catch (err: unknown) {
      console.error('Error al generar resumen:', err)
      let message = 'Unknown error';
      if (typeof err === 'object' && err && 'message' in err && typeof (err as { message?: string }).message === 'string') {
        message = (err as { message: string }).message;
      }
      toast.error(t('toast.error', { message }) )
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
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

          <Card className="shadow-lg border-2 border-muted rounded-lg overflow-hidden">
            <CardContent className="p-6">
              
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

                <motion.div 
                  variants={itemVariants}
                  className="flex justify-end gap-4"
                >
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
                    className="transition-all hover:scale-105"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        {t('upload.processing')}
                      </>
                    ) : (
                      t('upload.process')
                    )}
                  </Button>
                </motion.div>
              </motion.div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}