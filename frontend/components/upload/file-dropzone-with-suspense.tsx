"use client"

import { Suspense } from 'react'
import { FileDropzone } from './file-dropzone'
import { Loader2 } from 'lucide-react'

const DropzoneLoadingFallback = () => (
  <div className="border-2 border-dashed rounded-lg p-10 text-center">
    <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
    <p className="mt-2 text-sm text-muted-foreground">Cargando área para subir archivos...</p>
  </div>
);

export function FileDropzoneWithSuspense({ addFiles }: { addFiles: (files: any[]) => void }) {
  return (
    <Suspense fallback={<DropzoneLoadingFallback />}>
      <FileDropzone addFiles={addFiles} />
    </Suspense>
  )
}