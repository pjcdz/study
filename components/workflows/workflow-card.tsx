'use client';

import { memo } from 'react';
import { Play, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StageCard } from './stage-card';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import type { WorkflowState } from '@/lib/types/workflow';
import { cn } from '@/lib/utils';

interface WorkflowCardProps {
  workflow: WorkflowState;
  onRemove: (id: string) => void;
  onStart: (id: string) => void;
  onRetryStage: (workflowId: string, stage: 'content' | 'summary' | 'flashcards') => void;
  onViewResult: (workflowId: string, stage: 'content' | 'summary' | 'flashcards') => void;
  onCopyResult: (workflowId: string, stage: 'content' | 'summary' | 'flashcards') => void;
  onCancelStreaming?: (workflowId: string, stage: 'content' | 'summary' | 'flashcards') => void;
}

function WorkflowCardComponent({
  workflow,
  onRemove,
  onStart,
  onRetryStage,
  onViewResult,
  onCopyResult,
  onCancelStreaming,
}: WorkflowCardProps) {
  const t = useTranslations('workflows');
  const { id, fileName, files = [], overallStatus, stages } = workflow;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Calculate total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  // Determine if start button should be enabled
  const canStart = (overallStatus === 'pending' || overallStatus === 'error') && files.length > 0 && files.every(f => f.file);

  // Status badge styling
  const statusBadgeStyles = {
    pending: 'bg-muted text-muted-foreground',
    processing: 'bg-primary/10 text-primary',
    completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
    error: 'bg-destructive/10 text-destructive',
    paused: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.3 }}
      className="border rounded-xl p-4 md:p-6 bg-card/80 backdrop-blur-sm shadow-md hover:shadow-xl transition-all duration-300"
      role="article"
      aria-label={`Workflow: ${fileName}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-4">
        <div className="flex-1 min-w-0">
          {/* Files List */}
          {files.length > 0 ? (
            <>
              <div className="space-y-2">
                {files.map((file) => (
                  <div key={file.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                    <FileText className="w-5 h-5 text-muted-foreground mt-0.5" aria-hidden="true" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{file.name}</h4>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                      {!file.file && (
                        <p className="text-xs text-amber-600 dark:text-amber-400">
                          ⚠️ Archivo no disponible
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              <p className="text-xs text-muted-foreground mt-2">
                Total: {formatFileSize(totalSize)}
              </p>
              
              {files.some(f => !f.file) && overallStatus === 'pending' && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 p-2 bg-amber-500/10 rounded">
                  ⚠️ Los archivos no están disponibles después de recargar la página. Por favor, elimina este workflow y vuelve a agregar los archivos.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-amber-600 dark:text-amber-400 p-2 bg-amber-500/10 rounded">
              ⚠️ No hay archivos en este workflow. Por favor, elimínalo y crea uno nuevo.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              statusBadgeStyles[overallStatus]
            )}
          >
            {t(`status.${overallStatus}`)}
          </span>

          {/* Start Button */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => onStart(id)}
            disabled={!canStart}
            title={t('actions.start')}
            aria-label={t('actions.start')}
          >
            <Play className="w-4 h-4" aria-hidden="true" />
          </Button>

          {/* Delete Button */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => onRemove(id)}
            title={t('actions.remove')}
            aria-label={t('actions.remove')}
          >
            <Trash2 className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Stage Cards - Solo Summary y Flashcards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4" role="group" aria-label="Workflow stages">
        <StageCard
          stage={stages.summary}
          stageType="summary"
          stageNumber={1}
          workflowId={id}
          onRetry={() => onRetryStage(id, 'summary')}
          onViewResult={() => onViewResult(id, 'summary')}
          onCopyResult={() => onCopyResult(id, 'summary')}
          onCancelStreaming={onCancelStreaming ? () => onCancelStreaming(id, 'summary') : undefined}
        />
        <StageCard
          stage={stages.flashcards}
          stageType="flashcards"
          stageNumber={2}
          workflowId={id}
          onRetry={() => onRetryStage(id, 'flashcards')}
          onViewResult={() => onViewResult(id, 'flashcards')}
          onCopyResult={() => onCopyResult(id, 'flashcards')}
          onCancelStreaming={onCancelStreaming ? () => onCancelStreaming(id, 'flashcards') : undefined}
        />
      </div>
    </motion.div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const WorkflowCard = memo(WorkflowCardComponent);