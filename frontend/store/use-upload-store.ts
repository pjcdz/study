import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

interface UploadState {
  // Estado
  files: File[]
  inputText: string
  summary: string
  flashcards: string
  currentStep: 'upload' | 'summary' | 'flashcards'
  isLoading: boolean
  
  // Acciones
  addFiles: (newFiles: File[]) => void
  removeFile: (index: number) => void
  setInputText: (text: string) => void
  setSummary: (text: string) => void
  setFlashcards: (tsv: string) => void
  setCurrentStep: (step: 'upload' | 'summary' | 'flashcards') => void
  setIsLoading: (loading: boolean) => void
  reset: () => void
}

// No usamos SerializableFile porque no podemos implementar correctamente la interfaz File
// y los archivos no se pueden serializar correctamente para localStorage de todos modos

export const useUploadStore = create<UploadState>()(
  persist(
    (set) => ({
      // Estado inicial
      files: [],
      inputText: '',
      summary: '',
      flashcards: '',
      currentStep: 'upload',
      isLoading: false,
      
      // Acciones
      addFiles: (newFiles) => set((state) => {
        return { files: [...state.files, ...newFiles] };
      }),
      
      removeFile: (index) => set((state) => ({
        files: state.files.filter((_, i) => i !== index)
      })),
      
      setInputText: (text) => set({ inputText: text }),
      
      setSummary: (text) => set({ summary: text }),
      
      setFlashcards: (tsv) => set({ flashcards: tsv }),
      
      setCurrentStep: (step) => set({ currentStep: step }),
      
      setIsLoading: (loading) => set({ isLoading: loading }),
      
      reset: () => set({
        files: [],
        inputText: '',
        summary: '',
        flashcards: '',
        currentStep: 'upload',
        isLoading: false
      })
    }),
    {
      name: 'study-app-storage', // nombre único para el almacenamiento
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
)