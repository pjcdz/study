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
  summary: string
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
  setSummary: (text: string) => void
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
      summary: '',
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
      setSummary: (text: string) => set({ summary: text }),
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
      reset: () =>
        set({
          files: [],
          originalFiles: [],
          inputText: '',
          summary: '',
          flashcards: '',
          currentStep: 'upload',
          isLoading: false,
          processingStartTime: null,
          elapsedTimeMs: 0,
        }),
    }),
    {
      name: 'upload-store',
      storage: createJSONStorage(() => localStorage),
      // We don't persist File objects since they're not JSON serializable
      partialize: (state) => ({
        inputText: state.inputText,
        summary: state.summary,
        flashcards: state.flashcards,
        currentStep: state.currentStep,
        // We now persist timer state to keep it across pages
        processingStartTime: state.processingStartTime,
        elapsedTimeMs: state.elapsedTimeMs,
        isLoading: state.isLoading,
      }),
      // Version to ensure backward compatibility
      version: 1,
    }
  )
);