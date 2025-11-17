'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Play, Pause, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WorkflowCard } from './workflow-card';
import { ResultModal } from './result-modal';
import { useWorkflowStore } from '@/store/use-workflow-store';
import { getWorkflowProcessor } from '@/lib/services/workflowProcessor';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import type { StageType } from '@/lib/types/workflow';
import apiClient from '@/lib/api-client';

export function WorkflowManager() {
  const t = useTranslations('workflows');
  const {
    workflows,
    isPaused,
    activeWorkflowId,
    addWorkflow,
    addMultipleWorkflows,
    removeWorkflow,
    startAll,
    startWorkflow,
    pauseProcessing,
    resumeProcessing,
    getSummary,
  } = useWorkflowStore();

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    title: string;
    content: string;
    contentType: 'markdown' | 'tsv' | 'text';
    workflowId?: string;
    stage?: StageType;
  }>({
    isOpen: false,
    title: '',
    content: '',
    contentType: 'text',
  });
  
  const [isCondensing, setIsCondensing] = useState(false);

  const summary = getSummary();
  const processor = useMemo(() => getWorkflowProcessor(useWorkflowStore.getState()), []);

  // Handle file selection
  const handleAddFiles = useCallback((multiple: boolean) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.accept = '.pdf,.png,.jpg,.jpeg,.gif,.webp';

    input.onchange = (e) => {
      const files = Array.from((e.target as HTMLInputElement).files || []);
      if (files.length === 0) return;

      // Validate files
      const validFiles = files.filter((file) => {
        if (file.size > 20 * 1024 * 1024) {
          toast.error(t('toast.fileTooLarge', { name: file.name }));
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      if (multiple) {
        addMultipleWorkflows(validFiles);
        toast.success(t('toast.filesAdded', { count: validFiles.length }));
      } else {
        addWorkflow(validFiles[0]);
        toast.success(t('toast.fileAdded'));
      }
    };

    input.click();
  }, [addWorkflow, addMultipleWorkflows, t]);

  // Handle start all - Process all workflows simultaneously
  const handleStartAll = useCallback(async () => {
    // Check if any pending workflows have files
    const pendingWorkflows = workflows.filter(w => w.overallStatus === 'pending');
    const pendingWithoutFiles = pendingWorkflows.filter(
      (w) => !w.files || w.files.length === 0 || !w.files.every(f => f.file)
    );
    const pendingWithFiles = pendingWorkflows.filter(
      (w) => w.files && w.files.length > 0 && w.files.every(f => f.file)
    );
    
    // Auto-remove workflows without files
    if (pendingWithoutFiles.length > 0) {
      pendingWithoutFiles.forEach(w => removeWorkflow(w.id));
      toast.info(`Se eliminaron ${pendingWithoutFiles.length} workflow(s) sin archivos disponibles`);
    }
    
    if (pendingWithFiles.length === 0) {
      toast.error('No hay workflows con archivos disponibles. Agrega nuevos archivos para comenzar.');
      return;
    }

    startAll();
    toast.info(t('toast.startingAll'));
    await processor.processAllSimultaneously();
  }, [startAll, processor, t, workflows, removeWorkflow]);

  // Handle start individual workflow
  const handleStartWorkflow = useCallback(async (id: string) => {
    startWorkflow(id);
    toast.info(t('toast.startingWorkflow'));
    await processor.processWorkflow(id);
  }, [startWorkflow, processor, t]);

  // Handle pause/resume
  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      resumeProcessing();
      toast.info(t('toast.resumed'));
      processor.processNext();
    } else {
      pauseProcessing();
      toast.info(t('toast.paused'));
    }
  }, [isPaused, resumeProcessing, pauseProcessing, processor, t]);

  // Handle remove workflow
  const handleRemoveWorkflow = useCallback((id: string) => {
    removeWorkflow(id);
    toast.success(t('toast.removed'));
  }, [removeWorkflow, t]);

  // Handle retry stage
  const handleRetryStage = useCallback(async (workflowId: string, stage: StageType) => {
    toast.info(t('toast.retrying'));
    await processor.retryStage(workflowId, stage);
  }, [processor, t]);
  
  // Handle cancel streaming
  const handleCancelStreaming = useCallback((workflowId: string, stage: StageType) => {
    processor.cancelStageStreaming(workflowId, stage);
    toast.info(t('toast.cancelled'));
  }, [processor, t]);

  // Handle view result
  const handleViewResult = useCallback((workflowId: string, stage: StageType) => {
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    const stageData = workflow.stages[stage];
    if (!stageData.result && !stageData.error) return;

    const stageLabels = {
      content: 'Contenido',
      summary: 'Resumen',
      flashcards: 'Flashcards',
    };

    setModalState({
      isOpen: true,
      title: `${stageLabels[stage]} - ${workflow.fileName}`,
      content: stageData.error || stageData.result || '',
      contentType: stage === 'flashcards' ? 'tsv' : 'markdown',
      workflowId,
      stage,
    });
  }, [workflows]);
  
  // Handle condense summary
  const handleCondenseSummary = useCallback(async () => {
    if (!modalState.workflowId || !modalState.stage || modalState.stage !== 'summary') return;
    
    const workflow = workflows.find((w) => w.id === modalState.workflowId);
    if (!workflow) return;
    
    const currentSummary = workflow.stages.summary.result;
    if (!currentSummary) return;
    
    try {
      setIsCondensing(true);
      
      await apiClient.condenseSummaryStream(
        currentSummary,
        {
          onChunk: (text, charDelay) => {
            // Update modal content in real-time
            setModalState(prev => ({
              ...prev,
              content: text,
            }));
          },
          onComplete: (fullText, metadata) => {
            // Update the workflow store with condensed summary
            processor.store.setStageResult(modalState.workflowId!, 'summary', fullText, metadata);
            
            toast.success(t('toast.condensed', { defaultValue: 'Resumen condensado exitosamente' }));
            setIsCondensing(false);
            
            // Update modal with final content
            setModalState(prev => ({
              ...prev,
              content: fullText,
            }));
          },
          onError: (error) => {
            console.error('Error condensing summary:', error);
            toast.error('Error al condensar el resumen');
            setIsCondensing(false);
          }
        }
      );
    } catch (error) {
      console.error('Error condensing summary:', error);
      toast.error('Error al condensar el resumen');
      setIsCondensing(false);
    }
  }, [modalState, workflows, processor, t]);

  // Handle copy result
  const handleCopyResult = useCallback(async (workflowId: string, stage: StageType) => {
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    const stageData = workflow.stages[stage];
    if (!stageData.result) return;

    try {
      await navigator.clipboard.writeText(stageData.result);
      toast.success(t('toast.copied'));
    } catch (error) {
      toast.error(t('toast.copyError'));
    }
  }, [workflows, t]);

  const hasPendingWorkflows = summary.pending > 0;
  const isProcessing = summary.processing > 0;

  return (
    <div className="min-h-screen">
      <div className="w-full max-w-[896px] mx-auto py-6 md:py-8 px-4">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            {t('title')}
          </h1>
          <p className="text-sm md:text-base text-muted-foreground">
            {t('description')}
          </p>
        </div>

        {/* Controls Bar */}
        <div className="bg-card/80 backdrop-blur-sm border rounded-xl p-4 md:p-6 mb-6 shadow-lg">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Add Files Button */}
          <Button onClick={() => handleAddFiles(true)}>
            <Plus className="w-4 h-4 mr-2" />
            {t('addFiles')}
          </Button>

          {/* Start All Button */}
          <Button
            onClick={handleStartAll}
            disabled={!hasPendingWorkflows || isProcessing}
          >
            <Play className="w-4 h-4 mr-2" />
            {t('startAll')}
          </Button>

          {/* Pause/Resume Button */}
          {isProcessing && (
            <Button variant="outline" onClick={handlePauseResume}>
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  {t('resume')}
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  {t('pause')}
                </>
              )}
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-3 md:gap-4 text-sm" role="status" aria-live="polite">
          <div className="flex items-center gap-2 bg-muted/50 px-3 py-2 rounded-md">
            <span className="font-medium">{t('summary.total')}:</span>
            <span className="font-bold" aria-label={`${summary.total} total workflows`}>{summary.total}</span>
          </div>
          <div className="flex items-center gap-2 bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-2 rounded-md">
            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
            <span className="font-medium" aria-label={`${summary.completed} completed workflows`}>{summary.completed}</span>
          </div>
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-2 rounded-md">
            <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
            <span className="font-medium" aria-label={`${summary.processing} processing workflows`}>{summary.processing}</span>
          </div>
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-2 rounded-md">
            <AlertCircle className="w-4 h-4" aria-hidden="true" />
            <span className="font-medium" aria-label={`${summary.error} workflows with errors`}>{summary.error}</span>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-muted/50 rounded text-sm text-muted-foreground">
          <p>
            <strong>Nota:</strong> {t('note')}
          </p>
          {isProcessing && summary.processing > 1 && (
            <p className="mt-2 text-primary font-medium">
              ⚡ Procesando {summary.processing} workflows simultáneamente
            </p>
          )}
        </div>
      </div>

      {/* Workflow List */}
      {workflows.length === 0 ? (
        <div className="text-center py-16 md:py-20">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-muted-foreground mb-2">{t('emptyState')}</p>
            <p className="text-sm text-muted-foreground/70">
              {t('note')}
            </p>
          </div>
        </div>
      ) : (
        <AnimatePresence mode="popLayout">
          <div className="space-y-4 md:space-y-6">
            {workflows.map((workflow) => (
              <WorkflowCard
                key={workflow.id}
                workflow={workflow}
                onRemove={handleRemoveWorkflow}
                onStart={handleStartWorkflow}
                onRetryStage={handleRetryStage}
                onViewResult={handleViewResult}
                onCopyResult={handleCopyResult}
                onCancelStreaming={handleCancelStreaming}
              />
            ))}
          </div>
          </AnimatePresence>
        )}

        {/* Result Modal */}
      <ResultModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        content={modalState.content}
        contentType={modalState.contentType}
        stageType={modalState.stage}
        onCondense={modalState.stage === 'summary' ? handleCondenseSummary : undefined}
        isCondensing={isCondensing}
        />
      </div>
    </div>
  );
}
