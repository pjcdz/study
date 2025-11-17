import type { WorkflowStore } from '@/store/use-workflow-store';
import type { StageType } from '@/lib/types/workflow';
import apiClient, { ApiError, ApiErrorType } from '@/lib/api-client';
import { streamingSummaryService } from '@/lib/services/streamingSummaryService';

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

    // Check if files exist (they won't exist after page reload due to persistence)
    if (workflow.files.length === 0 || !workflow.files.every(f => f.file)) {
      const errorMsg = 'Los archivos no están disponibles. Por favor, vuelve a subirlos.';
      console.error(`Workflow ${workflowId}: ${errorMsg}`);
      this.store.setStageError(workflowId, 'content', errorMsg);
      return;
    }

    console.log(`Starting workflow processing for: ${workflow.fileName}`);
    this.isProcessing = true;
    this.abortController = new AbortController();

    try {
      // Stage 1: Extract content (no streaming needed)
      await this.processStage(workflowId, 'content');
      
      // Check if paused or cancelled
      if (this.store.isPaused || this.abortController.signal.aborted) {
        console.log('Workflow processing paused or cancelled');
        return;
      }

      // Stage 2: Generate summary with streaming
      await this.processStageWithStreaming(workflowId, 'summary');
      
      // Check if paused or cancelled
      if (this.store.isPaused || this.abortController.signal.aborted) {
        console.log('Workflow processing paused or cancelled');
        return;
      }

      // Stage 3: Generate flashcards with streaming
      await this.processStageWithStreaming(workflowId, 'flashcards');

      console.log(`Workflow ${workflowId} completed successfully`);
    } catch (error) {
      console.error(`Workflow ${workflowId} failed:`, error);
    } finally {
      this.isProcessing = false;
      this.abortController = null;
    }
  }

  /**
   * Process a specific stage of a workflow with streaming support
   */
  async processStageWithStreaming(workflowId: string, stage: StageType): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    console.log(`Processing stage ${stage} with streaming for workflow ${workflowId}`);
    
    // Update stage status to processing
    this.store.updateStageStatus(workflowId, stage, 'processing');

    try {
      switch (stage) {
        case 'content':
          // Content stage doesn't need streaming
          await this.processStage(workflowId, stage);
          break;

        case 'summary':
          await this.processSummaryWithStreaming(workflowId);
          break;

        case 'flashcards':
          await this.processFlashcardsWithStreaming(workflowId);
          break;

        default:
          throw new Error(`Unknown stage: ${stage}`);
      }

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
   * Process summary with streaming
   */
  private async processSummaryWithStreaming(workflowId: string): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    if (!workflow || workflow.files.length === 0) {
      throw new Error('Workflow or files not found');
    }

    const apiKey = this.getUserApiKey();
    if (!apiKey) {
      throw new Error('API Key no configurada');
    }

    // Mark as streaming
    this.store.setStageStreaming(workflowId, 'summary', true);

    try {
      // Process all files
      const files = workflow.files.map(f => f.file);
      
      await streamingSummaryService.generateSummaryStreamFromMultipleFiles(
        files,
        apiKey,
        {
          onChunk: (text, charDelay) => {
            this.store.updateStageStreamingText(workflowId, 'summary', text, charDelay);
          },
          onComplete: (fullText, metadata) => {
            this.store.setStageStreaming(workflowId, 'summary', false);
            this.store.setStageResult(workflowId, 'summary', fullText, {
              promptTokens: metadata.promptTokens,
              candidatesTokens: metadata.candidatesTokens,
              totalTokens: metadata.totalTokens,
            });
          },
          onError: (error) => {
            this.store.setStageStreaming(workflowId, 'summary', false);
            throw error;
          }
        }
      );
    } catch (error) {
      this.store.setStageStreaming(workflowId, 'summary', false);
      throw error;
    }
  }
  
  /**
   * Process flashcards with streaming
   */
  private async processFlashcardsWithStreaming(workflowId: string): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    const summaryResult = workflow.stages.summary.result;
    if (!summaryResult) {
      throw new Error('Summary stage must be completed before flashcards');
    }

    const apiKey = this.getUserApiKey();
    if (!apiKey) {
      throw new Error('API Key no configurada');
    }

    // Mark as streaming
    this.store.setStageStreaming(workflowId, 'flashcards', true);

    try {
      await streamingSummaryService.generateFlashcardsStream(
        summaryResult,
        apiKey,
        {
          onChunk: (text, charDelay) => {
            this.store.updateStageStreamingText(workflowId, 'flashcards', text, charDelay);
          },
          onComplete: (fullText, metadata) => {
            this.store.setStageStreaming(workflowId, 'flashcards', false);
            this.store.setStageResult(workflowId, 'flashcards', fullText, {
              promptTokens: metadata.promptTokens,
              candidatesTokens: metadata.candidatesTokens,
              totalTokens: metadata.totalTokens,
            });
          },
          onError: (error) => {
            this.store.setStageStreaming(workflowId, 'flashcards', false);
            throw error;
          }
        }
      );
    } catch (error) {
      this.store.setStageStreaming(workflowId, 'flashcards', false);
      throw error;
    }
  }
  
  /**
   * Get user API key from localStorage
   */
  private getUserApiKey(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('studyToolUserApiKey');
  }
  
  /**
   * Process a specific stage of a workflow (non-streaming fallback)
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
          // For the content stage, we just mark the files as ready
          // The actual processing happens in the summary stage
          result = `${workflow.files.length} archivo(s) listo(s): ${workflow.files.map(f => f.name).join(', ')}`;
          stats = { generationTimeMs: 0 };
          break;

        case 'summary':
          // Generate summary from files
          // This stage does both content extraction and summary generation
          const formData = new FormData();
          workflow.files.forEach(fileInfo => {
            formData.append('file', fileInfo.file);
          });
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
   * Process all pending workflows simultaneously
   * Processes each stage in parallel across all workflows
   */
  async processAllSimultaneously(): Promise<void> {
    if (this.store.isPaused) {
      console.log('Processing is paused');
      return;
    }

    // Get all pending workflows that have files
    const pendingWorkflows = this.store.workflows.filter(
      (w: any) => w.overallStatus === 'pending' && w.files && w.files.length > 0 && w.files.every((f: any) => f.file)
    );

    if (pendingWorkflows.length === 0) {
      console.log('No pending workflows with files to process');
      return;
    }

    console.log(`Starting simultaneous processing of ${pendingWorkflows.length} workflows`);
    this.isProcessing = true;

    try {
      // Stage 1: Mark content as ready for all workflows (files are already available in memory)
      console.log('Stage 1: Marking content as ready for all workflows');
      pendingWorkflows.forEach((workflow: any) => {
        const result = `${workflow.files.length} archivo(s) listo(s): ${workflow.files.map((f: any) => f.name).join(', ')}`;
        this.store.setStageResult(workflow.id, 'content', result, { generationTimeMs: 0 });
      });

      // Check if paused
      if (this.store.isPaused) {
        console.log('Processing paused after content stage');
        return;
      }

      // Stage 2: Process summary for all workflows simultaneously with streaming
      console.log('Stage 2: Processing summary for all workflows');
      await Promise.all(
        pendingWorkflows.map((workflow: any) =>
          this.processStageWithStreaming(workflow.id, 'summary').catch(error => {
            console.error(`Summary stage failed for workflow ${workflow.id}:`, error);
          })
        )
      );

      // Check if paused
      if (this.store.isPaused) {
        console.log('Processing paused after summary stage');
        return;
      }

      // Stage 3: Process flashcards for all workflows simultaneously
      console.log('Stage 3: Processing flashcards for all workflows');
      await Promise.all(
        pendingWorkflows.map((workflow: any) =>
          this.processStageWithStreaming(workflow.id, 'flashcards').catch(error => {
            console.error(`Flashcards stage failed for workflow ${workflow.id}:`, error);
          })
        )
      );

      console.log('All workflows processing completed');
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Process the next pending workflow in the queue (sequential processing)
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
   * Retry a failed stage with exponential backoff
   */
  async retryStage(workflowId: string, stage: StageType, retryCount: number = 0): Promise<void> {
    const workflow = this.store.getWorkflow(workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    const maxRetries = 3;
    const baseDelay = 1000; // 1 second

    console.log(`Retrying stage ${stage} for workflow ${workflowId} (attempt ${retryCount + 1}/${maxRetries})`);
    
    // Clear error state
    this.store.updateStageStatus(workflowId, stage, 'pending');
    
    try {
      // Process the stage again
      await this.processStage(workflowId, stage);
    } catch (error) {
      if (retryCount < maxRetries - 1) {
        // Calculate exponential backoff delay
        const delay = baseDelay * Math.pow(2, retryCount);
        console.log(`Retry failed, waiting ${delay}ms before next attempt`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delay));
        
        // Retry recursively
        return this.retryStage(workflowId, stage, retryCount + 1);
      } else {
        // Max retries reached, throw error
        console.error(`Max retries reached for stage ${stage} of workflow ${workflowId}`);
        throw error;
      }
    }
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
   * Cancel streaming for a specific stage
   */
  cancelStageStreaming(workflowId: string, stage: StageType): void {
    // Cancel the streaming service
    streamingSummaryService.cancel();
    
    // Update store to reflect cancellation
    this.store.cancelStageStreaming(workflowId, stage);
    
    console.log(`Streaming cancelled for stage ${stage} of workflow ${workflowId}`);
  }

  /**
   * Map API errors to user-friendly messages with actionable suggestions
   */
  private getErrorMessage(error: unknown): string {
    if (error instanceof ApiError) {
      switch (error.type) {
        case ApiErrorType.INVALID_API_KEY:
          return 'API Key inválida. Por favor, verifica tu API Key en la página de configuración y asegúrate de que sea correcta.';
        case ApiErrorType.QUOTA_EXCEEDED:
          return 'Cuota de API excedida. Intenta más tarde o verifica tu límite de uso en Google AI Studio.';
        case ApiErrorType.NETWORK_ERROR:
          return 'Error de conexión de red. Verifica tu conexión a internet e intenta nuevamente.';
        case ApiErrorType.FILE_TOO_LARGE:
          return 'El archivo es demasiado grande (máximo 20MB). Intenta con un archivo más pequeño o divide el contenido.';
        case ApiErrorType.FILE_PROCESSING_FAILED:
          return 'Error al procesar el archivo. Intenta con otro formato (PDF o imagen) o verifica que el archivo no esté corrupto.';
        default:
          return error.message || 'Error desconocido. Intenta nuevamente o contacta soporte si el problema persiste.';
      }
    }

    if (error instanceof Error) {
      return `${error.message}. Intenta nuevamente o verifica los detalles del error.`;
    }

    return 'Error desconocido al procesar. Por favor, intenta nuevamente.';
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
