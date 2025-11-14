'use client';

import { Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StageState, StageType } from '@/lib/types/workflow';
import { cn } from '@/lib/utils';

interface StageCardProps {
  stage: StageState;
  stageType: StageType;
  stageNumber: 1 | 2 | 3;
  workflowId: string;
  onRetry?: () => void;
  onViewResult?: () => void;
  onCopyResult?: () => void;
  onExportResult?: () => void;
}

const stageLabels: Record<StageType, string> = {
  content: 'Contenido',
  summary: 'Resumen',
  flashcards: 'Flashcards',
};

export function StageCard({
  stage,
  stageType,
  stageNumber,
  workflowId,
  onRetry,
  onViewResult,
  onCopyResult,
  onExportResult,
}: StageCardProps) {
  const { status, progress, error } = stage;

  // Determine border and background colors based on status
  const statusStyles = {
    pending: 'border-muted bg-muted/20',
    processing: 'border-primary bg-primary/5',
    completed: 'border-green-500 bg-green-500/5',
    error: 'border-destructive bg-destructive/5',
  };

  return (
    <div
      className={cn(
        'rounded-lg border-2 p-4 transition-all',
        statusStyles[status]
      )}
    >
      {/* Stage Header */}
      <div className="flex items-center gap-2 mb-3">
        <div
          className={cn(
            'flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold',
            status === 'completed' && 'bg-green-500 text-white',
            status === 'processing' && 'bg-primary text-primary-foreground',
            status === 'error' && 'bg-destructive text-white',
            status === 'pending' && 'bg-muted text-muted-foreground'
          )}
        >
          {stageNumber}
        </div>
        <h3 className="font-semibold text-sm">{stageLabels[stageType]}</h3>
      </div>

      {/* Status Icon and Message */}
      <div className="flex items-center gap-2 mb-3">
        {status === 'pending' && (
          <>
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Pendiente</span>
          </>
        )}
        {status === 'processing' && (
          <>
            <Loader2 className="w-4 h-4 text-primary animate-spin" />
            <span className="text-xs text-primary">Procesando...</span>
          </>
        )}
        {status === 'completed' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <span className="text-xs text-green-600 dark:text-green-400">
              Completado
            </span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-4 h-4 text-destructive" />
            <span className="text-xs text-destructive">Error</span>
          </>
        )}
      </div>

      {/* Progress Bar (only for processing) */}
      {status === 'processing' && progress !== undefined && (
        <div className="mb-3">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && error && (
        <div className="mb-3 p-2 bg-destructive/10 rounded text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {status === 'completed' && (
          <>
            {stageType === 'content' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewResult}
                className="text-xs"
              >
                Ver Detalles
              </Button>
            )}
            {stageType === 'summary' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onViewResult}
                  className="text-xs"
                >
                  Ver Resumen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCopyResult}
                  className="text-xs"
                >
                  Copiar
                </Button>
              </>
            )}
            {stageType === 'flashcards' && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onViewResult}
                  className="text-xs"
                >
                  Ver Flashcards
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onExportResult}
                  className="text-xs"
                >
                  Exportar
                </Button>
              </>
            )}
          </>
        )}

        {status === 'error' && (
          <>
            <Button
              size="sm"
              variant="outline"
              onClick={onViewResult}
              className="text-xs"
            >
              Ver Error
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={onRetry}
              className="text-xs"
            >
              Reintentar
            </Button>
          </>
        )}

        {status === 'pending' && (
          <span className="text-xs text-muted-foreground">Esperando...</span>
        )}
      </div>
    </div>
  );
}
