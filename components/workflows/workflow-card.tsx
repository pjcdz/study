'use client';

import { Play, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StageCard } from './stage-card';
import type { WorkflowState } from '@/lib/types/workflow';
import { cn } from '@/lib/utils';

interface WorkflowCardProps {
  workflow: WorkflowState;
  onRemove: (id: string) => void;
  onStart: (id: string) => void;
  onRetryStage: (workflowId: string, stage: 'content' | 'summary' | 'flashcards') => void;
  onViewResult: (workflowId: string, stage: 'content' | 'summary' | 'flashcards') => void;
  onCopyResult: (workflowId: string, stage: 'content' | 'summary' | 'flashcards') => void;
  onExportResult: (workflowId: string, stage: 'content' | 'summary' | 'flashcards') => void;
}

export function WorkflowCard({
  workflow,
  onRemove,
  onStart,
  onRetryStage,
  onViewResult,
  onCopyResult,
  onExportResult,
}: WorkflowCardProps) {
  const { id, fileName, fileSize, overallStatus, stages } = workflow;

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Determine if start button should be enabled
  const canStart = overallStatus === 'pending' || overallStatus === 'error';

  // Status badge styling
  const statusBadgeStyles = {
    pending: 'bg-muted text-muted-foreground',
    processing: 'bg-primary/10 text-primary',
    completed: 'bg-green-500/10 text-green-600 dark:text-green-400',
    error: 'bg-destructive/10 text-destructive',
    paused: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400',
  };

  const statusLabels = {
    pending: 'Pendiente',
    processing: 'Procesando...',
    completed: 'Completado',
    error: 'Error',
    paused: 'Pausado',
  };

  return (
    <div className="border rounded-lg p-4 bg-card shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3 flex-1">
          <FileText className="w-5 h-5 text-muted-foreground mt-0.5" />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{fileName}</h3>
            <p className="text-xs text-muted-foreground">
              {formatFileSize(fileSize)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <span
            className={cn(
              'px-2 py-1 rounded-full text-xs font-medium',
              statusBadgeStyles[overallStatus]
            )}
          >
            {statusLabels[overallStatus]}
          </span>

          {/* Start Button */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => onStart(id)}
            disabled={!canStart}
            title={canStart ? 'Iniciar workflow' : 'Workflow en proceso o completado'}
          >
            <Play className="w-4 h-4" />
          </Button>

          {/* Delete Button */}
          <Button
            size="icon"
            variant="outline"
            onClick={() => onRemove(id)}
            title="Eliminar workflow"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stage Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <StageCard
          stage={stages.content}
          stageType="content"
          stageNumber={1}
          workflowId={id}
          onRetry={() => onRetryStage(id, 'content')}
          onViewResult={() => onViewResult(id, 'content')}
        />
        <StageCard
          stage={stages.summary}
          stageType="summary"
          stageNumber={2}
          workflowId={id}
          onRetry={() => onRetryStage(id, 'summary')}
          onViewResult={() => onViewResult(id, 'summary')}
          onCopyResult={() => onCopyResult(id, 'summary')}
        />
        <StageCard
          stage={stages.flashcards}
          stageType="flashcards"
          stageNumber={3}
          workflowId={id}
          onRetry={() => onRetryStage(id, 'flashcards')}
          onViewResult={() => onViewResult(id, 'flashcards')}
          onExportResult={() => onExportResult(id, 'flashcards')}
        />
      </div>
    </div>
  );
}