"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Loader2, ClipboardCopy, Check, Zap, Edit } from "lucide-react"
import { useUploadStore } from "@/store/use-upload-store"
import apiClient from "@/lib/api-client"
import { MarkdownPreview } from "@/components/markdown/markdown-preview"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function SummaryPage() {
  const t = useTranslations('summary');
  const { 
    summary, 
    setFlashcards, 
    setCurrentStep, 
    isLoading, 
    setIsLoading 
  } = useUploadStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editedMarkdown, setEditedMarkdown] = useState(summary)
  const [isCopied, setIsCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<string>("editor")
  const router = useRouter()
  
  // Si no hay resumen, redirigir a la página de upload
  if (!summary) {
    const pathParts = window.location.pathname.split('/');
    const locale = pathParts[1]; // Obtener el locale de la URL ('es' o 'en')
    router.push(`/${locale}/upload`);
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
      // Guardar cambios
      setIsEditing(false)
    } else {
      // Entrar en modo edición
      setEditedMarkdown(summary)
      setIsEditing(true)
      setActiveTab("editor")
    }
  }
  
  const handleGenerateFlashcards = async () => {
    const markdownToUse = isEditing ? editedMarkdown : summary
    
    try {
      setIsLoading(true)
      const response = await apiClient.postFlashcards(markdownToUse)
      
      // Manejar respuesta
      let tsv = response.flashcardsTSV
      if (typeof tsv === 'object' && tsv.text) {
        tsv = tsv.text
      }
      
      setFlashcards(tsv)
      setCurrentStep('flashcards')
      
      toast.success(t('toast.success'))
      
      // Construir ruta para mantener el locale actual
      const pathParts = window.location.pathname.split('/');
      const locale = pathParts[1]; // Obtener el locale de la URL ('es' o 'en')
      router.push(`/${locale}/flashcards`);
    } catch (err: any) {
      toast.error(t('toast.error', { message: err.message }))
    } finally {
      setIsLoading(false)
    }
  }
  
  return (
    <div className="container max-w-4xl py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
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
        <CardContent>
          {isEditing ? (
            <Textarea
              value={editedMarkdown}
              onChange={(e) => setEditedMarkdown(e.target.value)}
              className="min-h-[400px] font-mono text-sm"
            />
          ) : (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-2">
                <TabsTrigger value="editor">{t('tabs.editor')}</TabsTrigger>
                <TabsTrigger value="preview">{t('tabs.preview')}</TabsTrigger>
              </TabsList>
              <TabsContent value="editor">
                <ScrollArea className="h-[400px] rounded-md border p-4 bg-muted">
                  <pre className="font-mono text-sm whitespace-pre-wrap">
                    {summary}
                  </pre>
                </ScrollArea>
              </TabsContent>
              <TabsContent value="preview">
                <ScrollArea className="h-[400px] rounded-md border p-4 overflow-auto">
                  <MarkdownPreview content={summary} />
                </ScrollArea>
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            onClick={handleGenerateFlashcards}
            disabled={isLoading}
            className="min-w-[220px]"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('button.generating')}
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                {t('button.generate')}
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}