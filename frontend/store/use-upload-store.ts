import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

// Extend the Window interface to include gtag
declare global {
  interface Window {
    gtag?: (event: string, action: string, params: Record<string, any>) => void;
  }
}

// Helper function to track events
const trackEvent = (eventName: string, eventParams: Record<string, any> = {}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', eventName, eventParams);
  }
};

export interface CustomFile {
  name: string
  type: string
  size: number
  thumbnailUrl: string
}

interface UploadState {
  files: CustomFile[]
  originalFiles: File[]
  inputText: string
  // Replace single summary with array of summaries
  summaries: string[]
  currentSummaryIndex: number
  flashcards: string
  currentStep: 'upload' | 'summary' | 'flashcards'
  isLoading: boolean
  // Timer state
  processingStartTime: number | null
  elapsedTimeMs: number
  // Streaming state
  isStreaming: boolean
  streamingSummary: string
  // Actions
  addFiles: (newFiles: File[]) => void
  removeFile: (index: number) => void
  setInputText: (text: string) => void
  // Updated summary methods
  addSummary: (text: string) => void
  setCurrentSummaryIndex: (index: number) => void
  getCurrentSummary: () => string
  // Streaming summary methods
  startStreamingSummary: () => void
  appendToStreamingSummary: (chunk: string) => void
  finishStreamingSummary: () => void
  resetStreamingSummary: () => void
  setFlashcards: (tsv: string) => void
  setCurrentStep: (step: 'upload' | 'summary' | 'flashcards') => void
  setIsLoading: (loading: boolean) => void
  startProcessing: () => void
  stopProcessing: () => void
  updateElapsedTime: () => void
  reset: () => void
}

export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
      // Initial state
      files: [],
      originalFiles: [],
      inputText: '',
      // Replace single summary with array and index
      summaries: [],
      currentSummaryIndex: 0,
      flashcards: '',
      currentStep: 'upload' as const,
      isLoading: false,
      // Timer state
      processingStartTime: null,
      elapsedTimeMs: 0,
      // Streaming state
      isStreaming: false,
      streamingSummary: '',
      // Actions
      addFiles: (newFiles: File[]) => {
        // Track file uploads
        trackEvent('files_uploaded', {
          file_count: newFiles.length,
          file_types: newFiles.map(file => file.type),
          total_size_bytes: newFiles.reduce((sum, file) => sum + file.size, 0),
          avg_size_bytes: newFiles.length > 0 
            ? Math.round(newFiles.reduce((sum, file) => sum + file.size, 0) / newFiles.length) 
            : 0
        });
        
        set((state) => ({
          files: [
            ...state.files,
            ...newFiles.map((file) => ({
              name: file.name,
              type: file.type,
              size: file.size,
              thumbnailUrl: file.type.includes('image/')
                ? URL.createObjectURL(file)
                : '',
            })),
          ],
          originalFiles: [...state.originalFiles, ...newFiles],
        }));
      },
      
      removeFile: (index: number) => {
        const fileToRemove = get().originalFiles[index];
        if (fileToRemove) {
          trackEvent('file_removed', {
            file_type: fileToRemove.type,
            file_size: fileToRemove.size
          });
        }
        
        set((state) => ({
          files: state.files.filter((_, i) => i !== index),
          originalFiles: state.originalFiles.filter((_, i) => i !== index),
        }));
      },
      
      setInputText: (text: string) => set({ inputText: text }),
      
      // Enhanced summary methods with tracking
      addSummary: (text: string) => 
        set((state) => {
          // Track summary generation with version information
          const summaryVersion = state.summaries.length; // 0=original, 1=condensed, 2=extra condensed
          const summaryType = 
            summaryVersion === 0 ? 'original' : 
            summaryVersion === 1 ? 'condensed' : 
            `condensed_level_${summaryVersion}`;
          
          trackEvent('summary_generated', {
            char_count: text.length,
            token_estimate: Math.ceil(text.length / 4),
            file_count: get().originalFiles.length,
            summary_version: summaryVersion,
            summary_type: summaryType
          });
          
          // First add the summary
          const updatedSummaries = [...state.summaries, text];
          // Then set the index to the last position
          return {
            summaries: updatedSummaries,
            currentSummaryIndex: updatedSummaries.length - 1
          };
        }),
        
      setCurrentSummaryIndex: (index: number) => 
        set((state) => {
          const newIndex = Math.max(0, Math.min(index, state.summaries.length - 1));
          
          // Track when user switches between different summary versions
          if (newIndex !== state.currentSummaryIndex) {
            trackEvent('summary_version_changed', {
              from_version: state.currentSummaryIndex,
              to_version: newIndex,
              from_type: state.currentSummaryIndex === 0 ? 'original' : 
                        state.currentSummaryIndex === 1 ? 'condensed' : 
                        `condensed_level_${state.currentSummaryIndex}`,
              to_type: newIndex === 0 ? 'original' : 
                      newIndex === 1 ? 'condensed' : 
                      `condensed_level_${newIndex}`
            });
          }
          
          return { currentSummaryIndex: newIndex };
        }),
        
      getCurrentSummary: () => {
        const { summaries, currentSummaryIndex } = get();
        return summaries[currentSummaryIndex] || '';
      },
      
      // Streaming summary methods
      startStreamingSummary: () => {
        trackEvent('streaming_summary_started');
        set((state) => {
          // Add a new empty summary to the array and set it as current
          const updatedSummaries = [...state.summaries, ''];
          return {
            summaries: updatedSummaries,
            currentSummaryIndex: updatedSummaries.length - 1,
            isStreaming: true,
            streamingSummary: ''
          };
        });
      },
      
      appendToStreamingSummary: (chunk: string) => {
        set((state) => {
          const updatedSummaries = [...state.summaries];
          // Append chunk to the current summary being streamed
          updatedSummaries[state.currentSummaryIndex] = 
            (updatedSummaries[state.currentSummaryIndex] || '') + chunk;
          return { summaries: updatedSummaries, streamingSummary: state.streamingSummary + chunk };
        });
      },
      
      finishStreamingSummary: () => {
        const currentSummary = get().getCurrentSummary();
        trackEvent('streaming_summary_completed', {
          char_count: currentSummary.length,
          token_estimate: Math.ceil(currentSummary.length / 4),
          file_count: get().originalFiles.length,
          summary_version: get().currentSummaryIndex,
          summary_type: get().currentSummaryIndex === 0 ? 'original' : 
                       get().currentSummaryIndex === 1 ? 'condensed' : 
                       `condensed_level_${get().currentSummaryIndex}`
        });
        set({ isStreaming: false });
      },

      resetStreamingSummary: () => {
        set({ streamingSummary: '', isStreaming: false });
      },
      
      setFlashcards: (tsv: string) => {
        // Count cards by counting non-empty lines
        const cardCount = tsv.split('\n').filter(line => line.trim().length > 0).length;
        trackEvent('flashcards_generated', { card_count: cardCount });
        
        set({ flashcards: tsv });
      },
      
      setCurrentStep: (step: 'upload' | 'summary' | 'flashcards') => {
        trackEvent('navigation_step_change', { step });
        set({ currentStep: step });
      },
      
      setIsLoading: (loading: boolean) => set((state) => {
        // If turning off loading, also reset timer state
        if (!loading && state.isLoading) {
          return { 
            isLoading: false, 
            processingStartTime: null,
            elapsedTimeMs: 0 
          };
        }
        return { isLoading: loading };
      }),
      
      startProcessing: () => {
        trackEvent('processing_started');
        set({
          isLoading: true,
          processingStartTime: Date.now(),
          elapsedTimeMs: 0
        });
      },
      
      stopProcessing: () => {
        const processingTime = get().elapsedTimeMs;
        trackEvent('processing_completed', { 
          duration_ms: processingTime,
          duration_seconds: Math.round(processingTime / 1000)
        });
        set({
          isLoading: false,
          processingStartTime: null,
          elapsedTimeMs: 0
        });
      },
      
      updateElapsedTime: () => set(state => {
        if (state.isLoading && state.processingStartTime) {
          return {
            elapsedTimeMs: Date.now() - state.processingStartTime
          };
        }
        return {};
      }),
      
      reset: () => {
        trackEvent('app_reset');
        
        // Reset state
        set({
          files: [],
          originalFiles: [],
          inputText: '',
          summaries: [],
          currentSummaryIndex: 0,
          flashcards: '',
          currentStep: 'upload',
          isLoading: false,
          processingStartTime: null,
          elapsedTimeMs: 0,
          isStreaming: false,
          streamingSummary: ''
        });
        
        // Clear localStorage keys
        if (typeof window !== 'undefined') {
          // Clear the main store
          localStorage.removeItem('upload-store');
          
          // Clear flashcards data
          localStorage.removeItem('FLASHCARDS_DATA');
          
          // Clear legacy keys for backward compatibility
          localStorage.removeItem('studyToolSummaries');
          localStorage.removeItem('studyToolFlashcards');
          localStorage.removeItem('studyToolCurrentStep');
          localStorage.removeItem('studyToolCurrentSummaryIndex');
          
          console.log('Estado completamente reiniciado: todas las claves eliminadas');
        }
      },
    }),
    {
      name: 'upload-store',
      storage: createJSONStorage(() => localStorage),
      // We don't persist File objects since they're not JSON serializable
      partialize: (state) => ({
        inputText: state.inputText,
        summaries: state.summaries,
        currentSummaryIndex: state.currentSummaryIndex,
        flashcards: state.flashcards,
        currentStep: state.currentStep,
        // Don't persist timer state to prevent issues with stale timers
        isLoading: false,
      }),
      // Version to ensure backward compatibility
      version: 2, // Increment version due to breaking changes
      
      // Handle migration from v1 to v2 (single summary to multiple summaries)
      onRehydrateStorage: () => {
        return (rehydratedState, error) => {
          if (error) {
            console.error('Error rehydrating upload store state:', error);
            return;
          }
          
          // Check if we need to migrate from v1 to v2
          if (rehydratedState) {
            const oldState = rehydratedState as any;
            
            // If the state has a summary property but not summaries array
            // (which indicates it's coming from v1), migrate it
            if (oldState.summary && (!oldState.summaries || oldState.summaries.length === 0)) {
              console.log('Migrating upload store from v1 to v2 (single summary to multiple summaries)');
              
              // Use the store's set function properly
              useUploadStore.setState({
                summaries: [oldState.summary],
                currentSummaryIndex: 0
              });
            }
          }
        }
      }
    }
  )
);

// For backward compatibility with existing code
// This allows us to gradually migrate components that use summary property
Object.defineProperty(useUploadStore.getState(), 'summary', {
  get: function() {
    return useUploadStore.getState().getCurrentSummary();
  },
  set: function(value) {
    if (!value) return;
    useUploadStore.getState().addSummary(value);
  },
  configurable: true
});