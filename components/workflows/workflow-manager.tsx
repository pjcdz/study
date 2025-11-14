'use client';

import { useState, useEffect } from 'react';
import { Plus, Play, Pause, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WorkflowCard } from './workflow-card';
import { ResultModal } from './result-modal';
import { useWorkflowStore } from '@/store/use-workflow-store';
import { getWorkflowProcessor } from '@/lib/services/workflowProcessor';
import { toast } from 'sonner';
import type { StageType } from '@/lib/types/workflow';

export function WorkflowManager() {
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
  }>({
    isOpen: false,
    title: '',
    content: '',
    contentType: 'text',
  });

  const summary = getSummary();
  const processor = getWorkflowProcessor(useWorkflowStore.getState());

  // Handle file selection
  const handleAddFiles = (multiple: boolean) => {
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
          toast.error(`${file.name} excede el límite de 20MB`);
          return false;
        }
        return true;
      });

      if (validFiles.length === 0) return;

      if (multiple) {
        addMultipleWorkflows(validFiles);
        toast.success(`${validFiles.length} archivos añadidos`);
      } else {
        addWorkflow(validFiles[0]);
        toast.success('Archivo añadido');
      }
    };

    input.click();
  };

  // Handle start all
  const handleStartAll = async () => {
    startAll();
    toast.info('Iniciando procesamiento de todos los workflows');
    await processor.processNext();
  };

  // Handle start individual workflow
  const handleStartWorkflow = async (id: string) => {
    startWorkflow(id);
    toast.info('Iniciando workflow');
    await processor.processWorkflow(id);
  };

  // Handle pause/resume
  const handlePauseResume = () => {
    if (isPaused) {
      resumeProcessing();
      toast.info('Procesamiento reanudado');
      processor.processNext();
    } else {
      pauseProcessing();
      toast.info('Procesamiento pausado');
    }
  };

  // Handle remove workflow
  const handleRemoveWorkflow = (id: string) => {
    removeWorkflow(id);
    toast.success('Workflow eliminado');
  };

  // Handle retry stage
  const handleRetryStage = async (workflowId: string, stage: StageType) => {
    toast.info('Reintentando etapa');
    await processor.retryStage(workflowId, stage);
  };

  // Handle view result
  const handleViewResult = (workflowId: string, stage: StageType) => {
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
    });
  };

  // Handle copy result
  const handleCopyResult = async (workflowId: string, stage: StageType) => {
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    const stageData = workflow.stages[stage];
    if (!stageData.result) return;

    try {
      await navigator.clipboard.writeText(stageData.result);
      toast.success('Copiado al portapapeles');
    } catch (error) {
      toast.error('Error al copiar');
    }
  };

  // Handle export result
  const handleExportResult = (workflowId: string, stage: StageType) => {
    const workflow = workflows.find((w) => w.id === workflowId);
    if (!workflow) return;

    const stageData = workflow.stages[stage];
    if (!stageData.result) return;

    const blob = new Blob([stageData.result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.fileName.replace(/\.[^/.]+$/, '')}-${stage}.${
      stage === 'flashcards' ? 'tsv' : 'md'
    }`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Archivo exportado');
  };

  const hasPendingWorkflows = summary.pending > 0;
  const isProcessing = summary.processing > 0;

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Flujo de Trabajo: Documentos a Flashcards
        </h1>
        <p className="text-muted-foreground">
          Transforma múltiples documentos en tarjetas de estudio
        </p>
      </div>

      {/* Controls Bar */}
      <div className="bg-card border rounded-lg p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-4">
          {/* Add Files Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Añadir Archivos
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleAddFiles(false)}>
                Nuevo workflow (archivo único)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAddFiles(true)}>
                Nuevo workflow (múltiples archivos)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Start All Button */}
          <Button
            onClick={handleStartAll}
            disabled={!hasPendingWorkflows || isProcessing}
          >
            <Play className="w-4 h-4 mr-2" />
            Iniciar Todo
          </Button>

          {/* Pause/Resume Button */}
          {isProcessing && (
            <Button variant="outline" onClick={handlePauseResume}>
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Reanudar
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </>
              )}
            </Button>
          )}
        </div>

        {/* Summary Stats */}
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium">Total:</span>
            <span>{summary.total}</span>
          </div>
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle2 className="w-4 h-4" />
            <span>Completados: {summary.completed}</span>
          </div>
          <div className="flex items-center gap-2 text-primary">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Procesando: {summary.processing}</span>
          </div>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span>Errores: {summary.error}</span>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 p-3 bg-muted/50 rounded text-sm text-muted-foreground">
          <p>
            <strong>Nota:</strong> Usa "Iniciar Todo" para procesar todos los
            workflows, o el botón "▶" en cada tarjeta para procesar workflows
            individuales.
          </p>
        </div>
      </div>

      {/* Workflow List */}
      {workflows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>No hay workflows. Añade archivos para comenzar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {workflows.map((workflow) => (
            <WorkflowCard
              key={workflow.id}
              workflow={workflow}
              onRemove={handleRemoveWorkflow}
              onStart={handleStartWorkflow}
              onRetryStage={handleRetryStage}
              onViewResult={handleViewResult}
              onCopyResult={handleCopyResult}
              onExportResult={handleExportResult}
            />
          ))}
        </div>
      )}

      {/* Result Modal */}
      <ResultModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ ...modalState, isOpen: false })}
        title={modalState.title}
        content={modalState.content}
        contentType={modalState.contentType}
      />
    </div>
  );
}
