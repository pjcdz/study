"use client"

import { Suspense } from 'react'
import { FileList } from './file-list'
import { Loader2 } from 'lucide-react'

const ListLoadingFallback = () => (
  <div className="rounded-lg p-4 bg-muted/30">
    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
    <p className="mt-1 text-xs text-center text-muted-foreground">Cargando lista de archivos...</p>
  </div>
);

export function FileListWithSuspense({ 
  files, 
  onRemove 
}: { 
  files: any[], 
  onRemove: (index: number) => void 
}) {
  return (
    <Suspense fallback={<ListLoadingFallback />}>
      <FileList files={files} onRemove={onRemove} />
    </Suspense>
  )
}