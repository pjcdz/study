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

interface UsageMetadata {
  promptTokens: number
  candidatesTokens: number
  totalTokens: number
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
  // NEW: Streaming state for simple flow
  isStreamingSummary: boolean
  isStreamingFlashcards: boolean
  isStreamingCondense: boolean
  // NEW: Temporary streaming text
  streamingSummaryText: string
  streamingFlashcardsText: string
  // NEW: Current char delay for typewriter effect
  currentCharDelay: number
  // NEW: Streaming control
  abortStreamingController: AbortController | null
  // NEW: Usage metadata
  lastUsageMetadata: UsageMetadata | null
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
  // NEW: Streaming control actions
  setStreamingSummary: (isStreaming: boolean) => void
  setStreamingFlashcards: (isStreaming: boolean) => void
  setStreamingCondense: (isStreaming: boolean) => void
  // NEW: Update streaming text
  updateStreamingSummaryText: (text: string, charDelay: number) => void
  updateStreamingFlashcardsText: (text: string, charDelay: number) => void
  // NEW: Complete streaming
  completeStreamingSummary: (finalText: string, metadata: UsageMetadata) => void
  completeStreamingFlashcards: (finalText: string, metadata: UsageMetadata) => void
  completeStreamingCondense: (finalText: string, metadata: UsageMetadata) => void
  // NEW: Cancel streaming
  cancelStreaming: () => void
  // NEW: Clear streaming state
  clearStreamingState: () => void
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
      // NEW: Streaming state
      isStreamingSummary: false,
      isStreamingFlashcards: false,
      isStreamingCondense: false,
      streamingSummaryText: '',
      streamingFlashcardsText: '',
      currentCharDelay: 20,
      abortStreamingController: null,
      lastUsageMetadata: null,
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
          // Clear previous summaries and flashcards when starting a new upload
          summaries: [],
          currentSummaryIndex: 0,
          flashcards: '',
          currentStep: 'upload',
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
        
        // Cancel any ongoing streaming
        const controller = get().abortStreamingController;
        if (controller) {
          controller.abort();
        }
        
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
          // Reset streaming state
          isStreamingSummary: false,
          isStreamingFlashcards: false,
          isStreamingCondense: false,
          streamingSummaryText: '',
          streamingFlashcardsText: '',
          currentCharDelay: 20,
          abortStreamingController: null,
          lastUsageMetadata: null,
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
      
      // NEW: Streaming control actions
      setStreamingSummary: (isStreaming: boolean) => set({ isStreamingSummary: isStreaming }),
      setStreamingFlashcards: (isStreaming: boolean) => set({ isStreamingFlashcards: isStreaming }),
      setStreamingCondense: (isStreaming: boolean) => set({ isStreamingCondense: isStreaming }),
      
      // NEW: Update streaming text
      updateStreamingSummaryText: (text: string, charDelay: number) => 
        set({ 
          streamingSummaryText: text, 
          currentCharDelay: charDelay 
        }),
      
      updateStreamingFlashcardsText: (text: string, charDelay: number) => 
        set({ 
          streamingFlashcardsText: text, 
          currentCharDelay: charDelay 
        }),
      
      // NEW: Complete streaming
      completeStreamingSummary: (finalText: string, metadata: UsageMetadata) => {
        trackEvent('streaming_summary_completed', {
          char_count: finalText.length,
          total_tokens: metadata.totalTokens,
          prompt_tokens: metadata.promptTokens,
          candidates_tokens: metadata.candidatesTokens
        });
        
        set((state) => ({
          summaries: [finalText],
          currentSummaryIndex: 0,
          isStreamingSummary: false,
          streamingSummaryText: '',
          lastUsageMetadata: metadata,
          abortStreamingController: null
        }));
      },
      
      completeStreamingFlashcards: (finalText: string, metadata: UsageMetadata) => {
        const cardCount = finalText.split('\n').filter(line => line.trim().length > 0).length;
        trackEvent('streaming_flashcards_completed', {
          card_count: cardCount,
          total_tokens: metadata.totalTokens,
          prompt_tokens: metadata.promptTokens,
          candidates_tokens: metadata.candidatesTokens
        });
        
        set({
          flashcards: finalText,
          isStreamingFlashcards: false,
          streamingFlashcardsText: '',
          lastUsageMetadata: metadata,
          abortStreamingController: null
        });
      },
      
      completeStreamingCondense: (finalText: string, metadata: UsageMetadata) => {
        trackEvent('streaming_condense_completed', {
          char_count: finalText.length,
          total_tokens: metadata.totalTokens,
          prompt_tokens: metadata.promptTokens,
          candidates_tokens: metadata.candidatesTokens
        });
        
        set((state) => {
          const updatedSummaries = [...state.summaries, finalText];
          return {
            summaries: updatedSummaries,
            currentSummaryIndex: updatedSummaries.length - 1,
            isStreamingCondense: false,
            streamingSummaryText: '',
            lastUsageMetadata: metadata,
            abortStreamingController: null
          };
        });
      },
      
      // NEW: Cancel streaming
      cancelStreaming: () => {
        const controller = get().abortStreamingController;
        if (controller) {
          controller.abort();
        }
        
        trackEvent('streaming_cancelled');
        
        set({
          isStreamingSummary: false,
          isStreamingFlashcards: false,
          isStreamingCondense: false,
          streamingSummaryText: '',
          streamingFlashcardsText: '',
          abortStreamingController: null
        });
      },
      
      // NEW: Clear streaming state
      clearStreamingState: () => 
        set({
          isStreamingSummary: false,
          isStreamingFlashcards: false,
          isStreamingCondense: false,
          streamingSummaryText: '',
          streamingFlashcardsText: '',
          currentCharDelay: 20,
          abortStreamingController: null
        }),
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
        // Don't persist streaming state - it should be ephemeral
        isStreamingSummary: false,
        isStreamingFlashcards: false,
        isStreamingCondense: false,
        streamingSummaryText: '',
        streamingFlashcardsText: '',
        // Persist last usage metadata for display
        lastUsageMetadata: state.lastUsageMetadata,
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