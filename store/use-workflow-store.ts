import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type {
  WorkflowState,
  WorkflowSummary,
  StageType,
  StageStatus,
  ExportOptions,
  ExportResult
} from '@/lib/types/workflow';
import type { GenerationStats } from '@/lib/types/api';

// Helper to generate UUID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Helper to create initial stage state
function createInitialStage() {
  return {
    status: 'pending' as StageStatus,
    progress: 0,
  };
}

interface WorkflowStore {
  // State
  workflows: WorkflowState[];
  activeWorkflowId: string | null;
  isPaused: boolean;
  
  // Workflow Management Actions
  addWorkflow: (file: File) => string;
  addMultipleWorkflows: (files: File[]) => string[];
  removeWorkflow: (id: string) => void;
  clearCompletedWorkflows: () => void;
  reset: () => void;
  
  // Processing Control Actions
  startAll: () => void;
  startWorkflow: (id: string) => void;
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  setActiveWorkflow: (id: string | null) => void;
  
  // Stage Management Actions
  updateStageStatus: (workflowId: string, stage: StageType, status: StageStatus) => void;
  updateStageProgress: (workflowId: string, stage: StageType, progress: number) => void;
  setStageResult: (workflowId: string, stage: StageType, result: string, stats?: GenerationStats) => void;
  setStageError: (workflowId: string, stage: StageType, error: string) => void;
  
  // Streaming Actions
  setStageStreaming: (workflowId: string, stage: StageType, isStreaming: boolean) => void;
  updateStageStreamingText: (workflowId: string, stage: StageType, text: string, charDelay: number) => void;
  cancelStageStreaming: (workflowId: string, stage: StageType) => void;
  
  // Selectors
  getWorkflow: (id: string) => WorkflowState | undefined;
  getSummary: () => WorkflowSummary;
  getNextPendingWorkflow: () => WorkflowState | undefined;
  
  // Export
  exportWorkflow: (workflowId: string, options: Partial<ExportOptions>) => ExportResult | null;
  exportMultiple: (options: ExportOptions) => ExportResult | null;
}

export const useWorkflowStore = create<WorkflowStore>()(
  persist(
    (set, get) => ({
      // Initial State
      workflows: [],
      activeWorkflowId: null,
      isPaused: false,
      
      // Note: Store automatically cleans up on hydration via onRehydrateStorage
      
      // Workflow Management Actions
      addWorkflow: (file: File) => {
        const id = generateId();
        const fileInfo = {
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          file,
        };
        const workflow: WorkflowState = {
          id,
          fileName: file.name,
          files: [fileInfo],
          createdAt: Date.now(),
          stages: {
            content: createInitialStage(),
            summary: createInitialStage(),
            flashcards: createInitialStage(),
          },
          overallStatus: 'pending',
        };
        
        set((state) => ({
          workflows: [...state.workflows, workflow],
        }));
        
        return id;
      },
      
      addMultipleWorkflows: (files: File[]) => {
        // Create a single workflow with all files
        const id = generateId();
        const fileInfos = files.map(file => ({
          id: generateId(),
          name: file.name,
          type: file.type,
          size: file.size,
          file,
        }));
        
        const workflow: WorkflowState = {
          id,
          fileName: files.length === 1 ? files[0].name : `${files.length} archivos`,
          files: fileInfos,
          createdAt: Date.now(),
          stages: {
            content: createInitialStage(),
            summary: createInitialStage(),
            flashcards: createInitialStage(),
          },
          overallStatus: 'pending',
        };
        
        set((state) => ({
          workflows: [...state.workflows, workflow],
        }));
        
        return [id];
      },

      removeWorkflow: (id: string) => {
        set((state) => ({
          workflows: state.workflows.filter((w) => w.id !== id),
          activeWorkflowId: state.activeWorkflowId === id ? null : state.activeWorkflowId,
        }));
      },
      
      clearCompletedWorkflows: () => {
        set((state) => ({
          workflows: state.workflows.filter((w) => w.overallStatus !== 'completed'),
        }));
      },
      
      reset: () => {
        set({
          workflows: [],
          activeWorkflowId: null,
          isPaused: false,
        });
        // Force persistence to localStorage
        if (typeof window !== 'undefined') {
          localStorage.removeItem('workflow-store');
        }
      },
      
      // Processing Control Actions
      startAll: () => {
        set({ isPaused: false });
        // The actual processing will be handled by WorkflowProcessor
      },
      
      startWorkflow: (id: string) => {
        set({ activeWorkflowId: id, isPaused: false });
        // The actual processing will be handled by WorkflowProcessor
      },
      
      pauseProcessing: () => {
        set({ isPaused: true });
      },
      
      resumeProcessing: () => {
        set({ isPaused: false });
      },
      
      setActiveWorkflow: (id: string | null) => {
        set({ activeWorkflowId: id });
      },
      
      // Stage Management Actions
      updateStageStatus: (workflowId: string, stage: StageType, status: StageStatus) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w;
            
            const updatedStage = {
              ...w.stages[stage],
              status,
              ...(status === 'processing' && { startedAt: Date.now() }),
              ...(status === 'completed' && { completedAt: Date.now() }),
            };
            
            const updatedStages = {
              ...w.stages,
              [stage]: updatedStage,
            };
            
            // Update overall status based on stages
            let overallStatus = w.overallStatus;
            if (status === 'processing') {
              overallStatus = 'processing';
            } else if (
              updatedStages.summary.status === 'completed' &&
              updatedStages.flashcards.status === 'completed'
            ) {
              overallStatus = 'completed';
            } else if (status === 'error') {
              overallStatus = 'error';
            }
            
            return {
              ...w,
              stages: updatedStages,
              overallStatus,
            };
          }),
        }));
      },
      
      updateStageProgress: (workflowId: string, stage: StageType, progress: number) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w;
            
            return {
              ...w,
              stages: {
                ...w.stages,
                [stage]: {
                  ...w.stages[stage],
                  progress,
                },
              },
            };
          }),
        }));
      },
      
      setStageResult: (workflowId: string, stage: StageType, result: string, stats?: GenerationStats) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w;
            
            return {
              ...w,
              stages: {
                ...w.stages,
                [stage]: {
                  ...w.stages[stage],
                  result,
                  stats,
                  status: 'completed',
                  completedAt: Date.now(),
                },
              },
            };
          }),
        }));
      },
      
      setStageError: (workflowId: string, stage: StageType, error: string) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w;
            
            return {
              ...w,
              stages: {
                ...w.stages,
                [stage]: {
                  ...w.stages[stage],
                  error,
                  status: 'error',
                  isStreaming: false,
                },
              },
              overallStatus: 'error',
            };
          }),
        }));
      },
      
      // Streaming Actions
      setStageStreaming: (workflowId: string, stage: StageType, isStreaming: boolean) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w;
            
            return {
              ...w,
              stages: {
                ...w.stages,
                [stage]: {
                  ...w.stages[stage],
                  isStreaming,
                  ...(isStreaming && { streamingText: '', charDelay: 20 }),
                },
              },
            };
          }),
        }));
      },
      
      updateStageStreamingText: (workflowId: string, stage: StageType, text: string, charDelay: number) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w;
            
            return {
              ...w,
              stages: {
                ...w.stages,
                [stage]: {
                  ...w.stages[stage],
                  streamingText: text,
                  charDelay,
                },
              },
            };
          }),
        }));
      },
      
      cancelStageStreaming: (workflowId: string, stage: StageType) => {
        set((state) => ({
          workflows: state.workflows.map((w) => {
            if (w.id !== workflowId) return w;
            
            return {
              ...w,
              stages: {
                ...w.stages,
                [stage]: {
                  ...w.stages[stage],
                  isStreaming: false,
                  status: 'error',
                  error: 'Cancelado por el usuario',
                },
              },
            };
          }),
        }));
      },

      // Selectors
      getWorkflow: (id: string) => {
        return get().workflows.find((w) => w.id === id);
      },
      
      getSummary: () => {
        const workflows = get().workflows;
        return {
          total: workflows.length,
          completed: workflows.filter((w) => w.overallStatus === 'completed').length,
          processing: workflows.filter((w) => w.overallStatus === 'processing').length,
          error: workflows.filter((w) => w.overallStatus === 'error').length,
          pending: workflows.filter((w) => w.overallStatus === 'pending').length,
        };
      },
      
      getNextPendingWorkflow: () => {
        return get().workflows.find((w) => w.overallStatus === 'pending');
      },
      
      // Export Functions
      exportWorkflow: (workflowId: string, options: Partial<ExportOptions>) => {
        const workflow = get().getWorkflow(workflowId);
        if (!workflow) return null;
        
        const stages = options.stages || ['content', 'summary', 'flashcards'];
        const format = options.format || 'markdown';
        
        let content = '';
        let filename = '';
        let mimeType = '';
        
        if (format === 'markdown') {
          content = `# ${workflow.fileName}\n\n`;
          content += `**Created:** ${new Date(workflow.createdAt).toLocaleString()}\n\n`;
          
          stages.forEach((stage) => {
            const stageData = workflow.stages[stage];
            if (stageData.result) {
              content += `## ${stage.charAt(0).toUpperCase() + stage.slice(1)}\n\n`;
              content += `${stageData.result}\n\n`;
            }
          });
          
          filename = `${workflow.fileName.replace(/\.[^/.]+$/, '')}-export.md`;
          mimeType = 'text/markdown';
        } else if (format === 'json') {
          const exportData = {
            fileName: workflow.fileName,
            createdAt: workflow.createdAt,
            stages: stages.reduce((acc, stage) => {
              acc[stage] = workflow.stages[stage];
              return acc;
            }, {} as any),
          };
          
          content = JSON.stringify(exportData, null, 2);
          filename = `${workflow.fileName.replace(/\.[^/.]+$/, '')}-export.json`;
          mimeType = 'application/json';
        } else if (format === 'csv' && stages.includes('flashcards')) {
          // Export flashcards as CSV
          const flashcardsData = workflow.stages.flashcards.result;
          if (flashcardsData) {
            content = flashcardsData;
            filename = `${workflow.fileName.replace(/\.[^/.]+$/, '')}-flashcards.csv`;
            mimeType = 'text/csv';
          }
        }
        
        return { filename, content, mimeType };
      },
      
      exportMultiple: (options: ExportOptions) => {
        const { workflowIds, stages, format } = options;
        const workflows = workflowIds
          .map((id) => get().getWorkflow(id))
          .filter((w): w is WorkflowState => w !== undefined);
        
        if (workflows.length === 0) return null;
        
        let content = '';
        let filename = '';
        let mimeType = '';
        
        if (format === 'markdown') {
          workflows.forEach((workflow) => {
            content += `# ${workflow.fileName}\n\n`;
            content += `**Created:** ${new Date(workflow.createdAt).toLocaleString()}\n\n`;
            
            stages.forEach((stage) => {
              const stageData = workflow.stages[stage];
              if (stageData.result) {
                content += `## ${stage.charAt(0).toUpperCase() + stage.slice(1)}\n\n`;
                content += `${stageData.result}\n\n`;
              }
            });
            
            content += '\n---\n\n';
          });
          
          filename = `workflows-export-${Date.now()}.md`;
          mimeType = 'text/markdown';
        } else if (format === 'json') {
          const exportData = workflows.map((workflow) => ({
            fileName: workflow.fileName,
            createdAt: workflow.createdAt,
            stages: stages.reduce((acc, stage) => {
              acc[stage] = workflow.stages[stage];
              return acc;
            }, {} as any),
          }));
          
          content = JSON.stringify(exportData, null, 2);
          filename = `workflows-export-${Date.now()}.json`;
          mimeType = 'application/json';
        }
        
        return { filename, content, mimeType };
      },
    }),
    {
      name: 'workflow-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist completed workflows, not pending/processing ones with files
      partialize: (state) => ({
        workflows: state.workflows
          // Filter: only persist completed workflows
          .filter((w) => w.overallStatus === 'completed')
          .map((w) => ({
            ...w,
            files: (w.files || []).map(f => ({ ...f, file: undefined })), // Don't persist File objects
          })),
        activeWorkflowId: null, // Don't persist active workflow
        isPaused: false, // Don't persist paused state
      }),
      version: 3,
      migrate: (persistedState: any, version: number) => {
        // Clear old workflows when migrating to version 3
        // Version 3 only persists completed workflows
        if (version < 3) {
          return {
            workflows: [],
            activeWorkflowId: null,
            isPaused: false,
          };
        }
        return persistedState;
      },
      onRehydrateStorage: () => {
        return (state, error) => {
          if (error) {
            console.error('Error rehydrating workflow store:', error);
            return;
          }
          
          if (state) {
            // Clean up any pending workflows without File objects after page reload
            const validWorkflows = state.workflows.filter((w) => {
              // Keep completed workflows (they don't need File objects)
              if (w.overallStatus === 'completed') return true;
              
              // Keep pending/processing workflows only if they have valid File objects
              if (w.files && w.files.length > 0 && w.files.every(f => f.file)) return true;
              
              // Remove workflows without files or without File objects
              return false;
            });
            
            // Only update if we filtered out any workflows
            if (validWorkflows.length !== state.workflows.length) {
              state.workflows = validWorkflows;
              console.log(`Cleaned up ${state.workflows.length - validWorkflows.length} workflows without files`);
            }
          }
        };
      },
    }
  )
);
