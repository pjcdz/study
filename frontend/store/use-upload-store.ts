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
  // Actions
  addFiles: (newFiles: File[]) => void
  removeFile: (index: number) => void
  setInputText: (text: string) => void
  setSummary: (text: string) => void
  setFlashcards: (tsv: string) => void
  setCurrentStep: (step: 'upload' | 'summary' | 'flashcards') => void
  setIsLoading: (loading: boolean) => void
  reset: () => void
}

export const useUploadStore = create<UploadState>()(
  persist(
    (set) => ({
      // Estado inicial
      files: [],
      originalFiles: [],
      inputText: '',
      summary: '',
      flashcards: '',
      currentStep: 'upload' as const,
      isLoading: false,
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
      setIsLoading: (loading: boolean) => set({ isLoading: loading }),
      reset: () =>
        set({
          files: [],
          originalFiles: [],
          inputText: '',
          summary: '',
          flashcards: '',
          currentStep: 'upload',
          isLoading: false,
        }),
    }),
    {
      name: 'upload-store',
      storage: createJSONStorage(() => localStorage),
      // No persistimos archivos (File) ya que no son serializables para JSON
      partialize: (state) => ({
        inputText: state.inputText,
        summary: state.summary,
        flashcards: state.flashcards,
        currentStep: state.currentStep,
        // No guardamos los archivos ni el estado de carga
      }),
      // Si cambia la estructura del estado, esto garantiza compatibilidad
      version: 1,
    }
  )
);