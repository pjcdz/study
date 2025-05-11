/* eslint-disable jsx-a11y/alt-text */
"use client"

import { useUploadStore } from "@/store/use-upload-store"
import { X, FileText, Image } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import type { CustomFile } from '@/store/use-upload-store'


interface FileListProps {
  files?: CustomFile[]
  onRemove?: (index: number) => void
  className?: string
}

export function FileList({ files, onRemove, className }: FileListProps) {
  const { files: storeFiles, removeFile: storeRemoveFile } = useUploadStore()
  const t = useTranslations('upload.fileList')
  
  const fileList = files || storeFiles
  const remove = onRemove || storeRemoveFile
  
  if (!fileList?.length) {
    return null
  }
  
  // Formatea el tamaño del archivo
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Determina el icono según el tipo de archivo
  const getFileIcon = (file: CustomFile) => {
    if (file.type.includes('image/')) {
      return <Image className="h-4 w-4" />
    }
    if (file.type === 'application/pdf') {
      return <FileText className="h-4 w-4" />
    }
    return null;
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {fileList.map((file, index) => (
        <div key={file.name} className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-3">
            {getFileIcon(file)}
            <div>
              <p className="font-medium">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => remove(index)}
            aria-label={t('remove', { name: file.name })}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}