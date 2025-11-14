import { useState } from 'react';
import { useApiKey } from '@/lib/hooks/useApiKey';

type UploadProps = {
  onSuccess: (result: any) => void;
  onError: (error: string) => void;
  endpoint: 'summary' | 'flashcards';
};

export function MultimodalUploader({ onSuccess, onError, endpoint }: UploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { apiKey, isAvailable } = useApiKey();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Verificar tipo de archivo
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!validTypes.includes(selectedFile.type)) {
        onError(`Tipo de archivo no soportado: ${selectedFile.type}. Por favor, sube un PDF o una imagen.`);
        return;
      }
      
      // Verificar tamaño (límite de 20MB)
      if (selectedFile.size > 20 * 1024 * 1024) {
        onError('El archivo excede el límite de 20MB.');
        return;
      }
      
      setFile(selectedFile);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey) {
      onError('API Key no configurada. Por favor, configura tu API Key de Google AI Studio en Ajustes.');
      return;
    }
    
    if (!file && !textPrompt.trim()) {
      onError('Por favor, sube un archivo o escribe un texto para procesar.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const formData = new FormData();
      
      if (file) {
        formData.append('file', file);
      }
      
      if (textPrompt.trim()) {
        formData.append('textPrompt', textPrompt);
      }
      
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: {
          'X-User-API-Key': apiKey
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      onSuccess(result);
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Error desconocido al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Texto (opcional)</label>
        <textarea 
          value={textPrompt}
          onChange={(e) => setTextPrompt(e.target.value)}
          placeholder="Escribe tu texto o instrucciones aquí..."
          className="w-full h-32 p-2 border rounded"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-1">Archivo (opcional)</label>
        <input 
          type="file" 
          onChange={handleFileChange}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
          accept=".pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
        />
        {file && (
          <p className="mt-1 text-sm text-green-600">
            Archivo seleccionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
          </p>
        )}
      </div>
      
      {!isAvailable && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          ⚠️ API Key no configurada. Por favor, configura tu API Key en Ajustes antes de continuar.
        </div>
      )}
      
      <button
        type="submit"
        disabled={isLoading || !isAvailable || (!file && !textPrompt.trim())}
        className="w-full py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
      >
        {isLoading ? 'Procesando...' : 'Procesar contenido'}
      </button>
    </form>
  );
}