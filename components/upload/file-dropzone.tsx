"use client"

import { useState, useRef } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Upload, FileUp } from "lucide-react"
import { useUploadStore } from "@/store/use-upload-store"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

type FileDropzoneProps = {
  addFiles?: (files: File[]) => void;
  className?: string;
}

export function FileDropzone({ addFiles }: FileDropzoneProps) {
  const t = useTranslations('upload.dropzone');
  const tValidation = useTranslations('upload.validation');
  const { addFiles: storeAddFiles } = useUploadStore()
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Límite de tamaño máximo: 20MB
  const MAX_FILE_SIZE = 20 * 1024 * 1024;
  
  // Usa la función de validación personalizada si se proporciona, o la función por defecto del store
  const handleAddFiles = addFiles || storeAddFiles;
  
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }
  
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files)
      
      // Validar tamaño máximo de archivos
      const validFiles = droppedFiles.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(tValidation('fileTooLarge', { maxSize: '20' }))
          return false
        }
        return true
      })
      
      if (validFiles.length > 0) {
        handleAddFiles(validFiles)
      }
    }
  }
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files)
      
      // Validar tamaño máximo de archivos
      const validFiles = selectedFiles.filter(file => {
        if (file.size > MAX_FILE_SIZE) {
          toast.error(tValidation('fileTooLarge', { maxSize: '20' }))
          return false
        }
        return true
      })
      
      if (validFiles.length > 0) {
        handleAddFiles(validFiles)
      }
      
      e.target.value = '' // Reset para permitir seleccionar el mismo archivo
    }
  }
  
  const handleOpenFileDialog = () => {
    fileInputRef.current?.click()
  }
  
  return (
    <Card 
      className={`p-8 border-2 border-dashed transition-colors ${
        isDragging 
          ? "border-primary bg-primary/5" 
          : "border-muted-foreground/20"
      }`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex flex-col items-center justify-center">
        <input 
          ref={fileInputRef}
          type="file" 
          multiple 
          className="hidden" 
          onChange={handleFileChange} 
          aria-label="Upload files"
          accept=".pdf,image/jpeg,image/png,image/webp,image.heic,image.heif"
        />
        
        <Upload className="h-10 w-10 text-muted-foreground mb-4" />
        
        <h3 className="text-lg font-medium">
          {t('title')}
        </h3>
        
        <p className="text-sm text-muted-foreground mb-4">
          {t('or')}
        </p>
        
        <Button 
          onClick={handleOpenFileDialog}
          variant="secondary"
          className="transition-all hover:border-primary hover:border-2 hover:shadow-[0_0_10px_rgba(var(--color-primary)/0.3)]"
        >
          <FileUp className="mr-2 h-4 w-4" />
          {t('button')}
        </Button>
        
        <p className="mt-4 text-xs text-muted-foreground text-center">
          {t('sizeLimit')}
        </p>
      </div>
    </Card>
  )
}