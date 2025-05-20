import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
  // Actions
  addFiles: (newFiles: File[]) => void
  removeFile: (index: number) => void
  setInputText: (text: string) => void
  // Updated summary methods
  addSummary: (text: string) => void
  setCurrentSummaryIndex: (index: number) => void
  getCurrentSummary: () => string
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
      // Actions
      addFiles: (newFiles: File[]) =>
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
        })),
      removeFile: (index: number) =>
        set((state) => ({
          files: state.files.filter((_, i) => i !== index),
          originalFiles: state.originalFiles.filter((_, i) => i !== index),
        })),
      setInputText: (text: string) => set({ inputText: text }),
      // New summary methods
      addSummary: (text: string) => 
        set((state) => {
          // First add the summary
          const updatedSummaries = [...state.summaries, text];
          // Then set the index to the last position
          return {
            summaries: updatedSummaries,
            currentSummaryIndex: updatedSummaries.length - 1
          };
        }),
      setCurrentSummaryIndex: (index: number) => 
        set((state) => ({
          currentSummaryIndex: Math.max(0, Math.min(index, state.summaries.length - 1))
        })),
      getCurrentSummary: () => {
        const { summaries, currentSummaryIndex } = get();
        return summaries[currentSummaryIndex] || '';
      },
      setFlashcards: (tsv: string) => set({ flashcards: tsv }),
      setCurrentStep: (step: 'upload' | 'summary' | 'flashcards') =>
        set({ currentStep: step }),
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
      startProcessing: () => set({
        isLoading: true,
        processingStartTime: Date.now(),
        elapsedTimeMs: 0
      }),
      stopProcessing: () => set({
        isLoading: false,
        processingStartTime: null,
        elapsedTimeMs: 0
      }),
      updateElapsedTime: () => set(state => {
        if (state.isLoading && state.processingStartTime) {
          return {
            elapsedTimeMs: Date.now() - state.processingStartTime
          };
        }
        return {};
      }),
      reset: () => {
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
        })
        
        // Clear localStorage keys
        if (typeof window !== 'undefined') {
          // Clear the main store
          localStorage.removeItem('upload-store')
          
          // Clear flashcards data
          localStorage.removeItem('FLASHCARDS_DATA')
          
          // Clear legacy keys for backward compatibility
          localStorage.removeItem('studyToolSummaries')
          localStorage.removeItem('studyToolFlashcards')
          localStorage.removeItem('studyToolCurrentStep')
          localStorage.removeItem('studyToolCurrentSummaryIndex')
          
          console.log('Estado completamente reiniciado: todas las claves eliminadas')
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
        // We now persist timer state to keep it across pages
        processingStartTime: state.processingStartTime,
        elapsedTimeMs: state.elapsedTimeMs,
        isLoading: state.isLoading,
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