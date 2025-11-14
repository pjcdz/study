import type { WorkflowStore } from '@/store/use-workflow-store';
import type { StageType } from '@/lib/types/workflow';
import apiClient, { ApiError, ApiErrorType } from '@/lib/api-client';

export class WorkflowProcessor {
  private store: any; // Will be the Zustand store
  private abortController: AbortController | null = null;
  private isProcessing = false;

  constructor(store: any) {
    this.store = store;
  }

  /**
   * Process a complete workflow through all three stages
   */
  async processWorkflow(workflowId: string): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    if (!workflow) {
      console.error(`Workflow ${workflowId} not found`);
      return;
    }

    console.log(`Starting workflow processing for: ${workflow.fileName}`);
    this.isProcessing = true;
    this.abortController = new AbortController();

    try {
      // Stage 1: Extract content
      await this.processStage(workflowId, 'content');
      
      // Check if paused or cancelled
      if (this.store.isPaused || this.abortController.signal.aborted) {
        console.log('Workflow processing paused or cancelled');
        return;
      }

      // Stage 2: Generate summary
      await this.processStage(workflowId, 'summary');
      
      // Check if paused or cancelled
      if (this.store.isPaused || this.abortController.signal.aborted) {
        console.log('Workflow processing paused or cancelled');
        return;
      }

      // Stage 3: Generate flashcards
      await this.processStage(workflowId, 'flashcards');

      console.log(`Workflow ${workflowId} completed successfully`);
    } catch (error) {
      console.error(`Workflow ${workflowId} failed:`, error);
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  /**
   * Process a specific stage of a workflow
   */
  async processStage(workflowId: string, stage: StageType): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    console.log(`Processing stage ${stage} for workflow ${workflowId}`);
    
    // Update stage status to processing
    this.store.updateStageStatus(workflowId, stage, 'processing');

    try {
      let result: string;
      let stats;

      switch (stage) {
        case 'content':
          // For the content stage, we just mark the file as ready
          // The actual processing happens in the summary stage
          result = `Archivo listo: ${workflow.fileName}`;
          stats = { generationTimeMs: 0 };
          break;

        case 'summary':
          // Generate summary from file
          // This stage does both content extraction and summary generation
          const formData = new FormData();
          formData.append('file', workflow.file);
          const summaryResponse = await apiClient.processSummary(formData);
          result = summaryResponse.notionMarkdown;
          stats = summaryResponse.stats;
          break;

        case 'flashcards':
          // Generate flashcards from summary
          const summaryResult = workflow.stages.summary.result;
          if (!summaryResult) {
            throw new Error('Summary stage must be completed before flashcards');
          }
          const flashcardsResponse = await apiClient.processFlashcards(summaryResult);
          result = flashcardsResponse.flashcards;
          stats = flashcardsResponse.stats;
          break;

        default:
          throw new Error(`Unknown stage: ${stage}`);
      }

      // Update stage with result
      this.store.setStageResult(workflowId, stage, result, stats);
      console.log(`Stage ${stage} completed for workflow ${workflowId}`);
    } catch (error) {
      console.error(`Stage ${stage} failed for workflow ${workflowId}:`, error);
      
      // Map error to user-friendly message
      const errorMessage = this.getErrorMessage(error);
      this.store.setStageError(workflowId, stage, errorMessage);
      
      throw error;
    }
  }

  /**
   * Process the next pending workflow in the queue
   */
  async processNext(): Promise<void> {
    if (this.store.isPaused) {
      console.log('Processing is paused');
      return;
    }

    const nextWorkflow = this.store.getNextPendingWorkflow();
    if (!nextWorkflow) {
      console.log('No pending workflows to process');
      return;
    }

    console.log(`Processing next workflow: ${nextWorkflow.fileName}`);
    this.store.setActiveWorkflow(nextWorkflow.id);
    
    await this.processWorkflow(nextWorkflow.id);
    
    // After completing this workflow, process the next one if not paused
    if (!this.store.isPaused) {
      await this.processNext();
    }
  }

  /**
   * Retry a failed stage
   */
  async retryStage(workflowId: string, stage: StageType): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    console.log(`Retrying stage ${stage} for workflow ${workflowId}`);
    
    // Clear error state
    this.store.updateStageStatus(workflowId, stage, 'pending');
    
    // Process the stage again
    await this.processStage(workflowId, stage);
  }

  /**
   * Cancel the current processing
   */
  cancelCurrent(): void {
    if (this.abortController) {
      this.abortController.abort();
      console.log('Current workflow processing cancelled');
    }
  }

  /**
   * Map API errors to user-friendly messages
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ApiErrorType.INVALID_API_KEY:
          return 'API Key inválida. Configura tu API Key en Ajustes.';
        case ApiErrorType.QUOTA_EXCEEDED:
          return 'Cuota excedida. Intenta más tarde.';
        case ApiErrorType.NETWORK_ERROR:
          return 'Error de red. Verifica tu conexión.';
        case ApiErrorType.FILE_TOO_LARGE:
          return 'Archivo demasiado grande. Máximo 20MB.';
        case ApiErrorType.FILE_PROCESSING_FAILED:
          return 'Error al procesar el archivo. Intenta con otro formato.';
        default:
          return error.message || 'Error desconocido';
      }
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'Error desconocido al procesar';
  }

  /**
   * Check if currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

// Create a singleton instance
let processorInstance: WorkflowProcessor | null = null;

export function getWorkflowProcessor(store: any): WorkflowProcessor {
  if (!processorInstance) {
    processorInstance = new WorkflowProcessor(store);
  }
  return processorInstance;
}
