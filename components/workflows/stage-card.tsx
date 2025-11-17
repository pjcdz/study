'use client';

import { memo, useRef, useEffect } from 'react';
import { Clock, CheckCircle2, AlertCircle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import type { StageState, StageType } from '@/lib/types/workflow';
import { cn } from '@/lib/utils';
import { StreamingText } from '@/components/streaming/streaming-text';

interface StageCardProps {
  stage: StageState;
  stageType: StageType;
  stageNumber: 1 | 2 | 3;
  workflowId: string;
  onRetry?: () => void;
  onViewResult?: () => void;
  onCopyResult?: () => void;
  onCancelStreaming?: () => void;
}

function StageCardComponent({
  stage,
  stageType,
  stageNumber,
  workflowId,
  onRetry,
  onViewResult,
  onCopyResult,
  onCancelStreaming,
}: StageCardProps) {
  const t = useTranslations('workflows');
  const { status, progress, error, isStreaming, streamingText, charDelay, stats } = stage;
  const streamingContentRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to show streaming content
  useEffect(() => {
    if (isStreaming && streamingContentRef.current) {
      streamingContentRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'nearest' 
      });
    }
  }, [isStreaming, streamingText]);

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
        'rounded-lg border-2 p-4 transition-all duration-300 hover:shadow-md min-h-[116px]',
        statusStyles[status]
      )}
      role="region"
      aria-label={`${t(`stages.${stageType}`)} stage - ${t(`status.${status}`)}`}
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
        <h3 className="font-semibold text-sm">{t(`stages.${stageType}`)}</h3>
      </div>

      {/* Status Icon and Message */}
      <div className="flex items-center gap-2 mb-3" aria-live="polite" aria-atomic="true">
        {status === 'pending' && (
          <>
            <Clock className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">{t('status.pending')}</span>
          </>
        )}
        {status === 'processing' && (
          <>
            <Loader2 className="w-4 h-4 text-primary animate-spin" aria-hidden="true" />
            <span className="text-xs text-primary">{t('status.processing')}</span>
          </>
        )}
        {status === 'completed' && (
          <>
            <CheckCircle2 className="w-4 h-4 text-green-500" aria-hidden="true" />
            <span className="text-xs text-green-600 dark:text-green-400">
              {t('status.completed')}
            </span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-4 h-4 text-destructive" aria-hidden="true" />
            <span className="text-xs text-destructive">{t('status.error')}</span>
          </>
        )}
      </div>

      {/* Progress Bar (only for processing) */}
      <AnimatePresence>
        {status === 'processing' && progress !== undefined && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3"
          >
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <motion.div
                className="bg-primary h-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Streaming Content Preview */}
      {isStreaming && streamingText && (
        <div 
          ref={streamingContentRef}
          className="mb-3 p-3 bg-muted/30 rounded-md max-h-32 overflow-y-auto"
        >
          <StreamingText
            textToType={streamingText}
            charDelay={charDelay || 20}
            isStreaming={true}
            className="text-xs text-foreground/80"
          />
        </div>
      )}

      {/* Error Message */}
      {status === 'error' && error && (
        <div className="mb-3 p-2 bg-destructive/10 rounded text-xs text-destructive">
          {error}
        </div>
      )}
      
      {/* Usage Stats */}
      {status === 'completed' && stats && (
        <div className="mb-3 text-xs text-muted-foreground">
          <span>Tokens: {stats.totalTokens}</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        {isStreaming && (
          <Button
            size="sm"
            variant="destructive"
            onClick={onCancelStreaming}
            className="text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            {t('actions.cancel')}
          </Button>
        )}
        
        {status === 'completed' && (
          <>
            {stageType === 'content' && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewResult}
                className="text-xs"
              >
                {t('actions.viewDetails')}
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
                  {t('actions.viewSummary')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCopyResult}
                  className="text-xs"
                >
                  {t('actions.copy')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://www.notion.so/new', '_blank')}
                  className="text-xs"
                >
                  {t('actions.openNotion')}
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
                  {t('actions.viewFlashcards')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onCopyResult}
                  className="text-xs"
                >
                  {t('actions.copy')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://quizlet.com/create-set', '_blank')}
                  className="text-xs"
                >
                  {t('actions.openQuizlet')}
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
              {t('actions.viewError')}
            </Button>
            <Button
              size="sm"
              variant="default"
              onClick={onRetry}
              className="text-xs"
            >
              {t('actions.retry')}
            </Button>
          </>
        )}

        {status === 'pending' && (
          <span className="text-xs text-muted-foreground">{t('actions.waiting')}</span>
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const StageCard = memo(StageCardComponent);
