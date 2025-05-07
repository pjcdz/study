"use client"

import { useUploadStore } from "@/store/use-upload-store"
import { X, FileText, File, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

export function FileList() {
  const { files, removeFile } = useUploadStore()
  const t = useTranslations('upload.fileList')
  
  if (files.length === 0) {
    return null
  }
  
  // Formatea el tamaño del archivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }
  
  // Determina el icono según el tipo de archivo
  const getFileIcon = (fileType: string) => {
    if (fileType.includes('image/')) return <Image className="h-4 w-4" />
    if (fileType === 'application/pdf') return <FileText className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }
  
  return (
    <div className="mt-4">
      <h3 className="text-sm font-medium mb-2">
        {t('title', { count: files.length })}
      </h3>
      <div className="space-y-2">
        {files.map((file, index) => (
          <div 
            key={`${file.name}-${index}`} 
            className="flex items-center justify-between p-2 bg-muted rounded-md"
          >
            <div className="flex items-center">
              <div className="mr-2 text-muted-foreground">
                {getFileIcon(file.type)}
              </div>
              <div>
                <p className="text-sm font-medium truncate max-w-[180px]">
                  {file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => removeFile(index)}
              className="h-8 w-8 p-0"
              aria-label={t('remove', { name: file.name })}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}