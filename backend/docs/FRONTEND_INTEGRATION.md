# Guía de Integración Frontend para Actualización Multimodal

Esta guía proporciona los pasos necesarios para integrar las nuevas funcionalidades multimodales de Study Tool en el frontend, permitiendo a los usuarios proporcionar su propia API Key de Google AI Studio y procesar tanto texto como archivos (PDF e imágenes).

## Gestión de API Key de Usuario

### 1. Interfaz para Configuración de API Key

Añadir un componente para que el usuario configure su API Key:

```tsx
// components/settings/api-key-manager.tsx
import { useState, useEffect } from 'react';

export function ApiKeyManager() {
  const [apiKey, setApiKey] = useState<string>('');
  const [saved, setSaved] = useState<boolean>(false);
  
  // Cargar API Key guardada al montar el componente
  useEffect(() => {
    const savedKey = localStorage.getItem('studyToolUserApiKey');
    if (savedKey) {
      setApiKey(savedKey);
      setSaved(true);
    }
  }, []);
  
  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('studyToolUserApiKey', apiKey);
      setSaved(true);
    }
  };
  
  const handleClear = () => {
    localStorage.removeItem('studyToolUserApiKey');
    setApiKey('');
    setSaved(false);
  };
  
  return (
    <div className="p-4 border rounded-lg bg-card">
      <h3 className="text-lg font-medium mb-2">Configuración de API Key</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Para utilizar las funciones de IA, necesitas proporcionar tu propia API Key de Google AI Studio.
        <a href="https://aistudio.google.com/" target="_blank" rel="noopener" className="text-primary ml-1">
          Obtener una API Key
        </a>
      </p>
      
      <div className="flex gap-2 mb-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Ingresa tu API Key de Google AI Studio"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded">
          Guardar
        </button>
        {saved && (
          <button onClick={handleClear} className="px-4 py-2 border rounded">
            Borrar
          </button>
        )}
      </div>
      
      {saved && (
        <p className="text-sm text-green-600">
          ✓ API Key guardada localmente
        </p>
      )}
      <p className="text-xs text-muted-foreground mt-2">
        La API Key se guarda solo en tu navegador y nunca se envía a nuestros servidores.
      </p>
    </div>
  );
}
```

### 2. Validación de API Key

Crear un hook para verificar la disponibilidad de la API Key:

```tsx
// lib/hooks/useApiKey.ts
import { useState, useEffect } from 'react';

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const savedKey = localStorage.getItem('studyToolUserApiKey');
    setApiKey(savedKey);
    setIsLoading(false);
  }, []);
  
  return {
    apiKey,
    isLoading,
    isAvailable: !!apiKey
  };
}
```

## Manejo de Archivos y Solicitudes Multimodales

### 1. Componente para Subida de Archivos

```tsx
// components/upload/multimodal-uploader.tsx
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
```

### 2. Actualización de Cliente API

```typescript
// lib/api-client.ts
export async function processSummary(content: string | FormData, apiKey: string) {
  let body;
  let headers: Record<string, string> = {
    'X-User-API-Key': apiKey
  };
  
  // Si content es string, enviarlo como JSON
  if (typeof content === 'string') {
    body = JSON.stringify({ textPrompt: content });
    headers['Content-Type'] = 'application/json';
  } else {
    // Si es FormData, enviarlo como multipart/form-data
    body = content;
    // No establecer Content-Type, el navegador lo hará automáticamente con el boundary correcto
  }
  
  const response = await fetch('/api/summary', {
    method: 'POST',
    headers,
    body
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Error ${response.status}`);
  }
  
  return response.json();
}

export async function processFlashcards(content: string | FormData, apiKey: string) {
  // Similar a processSummary pero con el endpoint /flashcards
  let body;
  let headers: Record<string, string> = {
    'X-User-API-Key': apiKey
  };
  
  if (typeof content === 'string') {
    body = JSON.stringify({ textPrompt: content });
    headers['Content-Type'] = 'application/json';
  } else {
    body = content;
  }
  
  const response = await fetch('/api/flashcards', {
    method: 'POST',
    headers,
    body
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Error ${response.status}`);
  }
  
  return response.json();
}

export async function condenseSummary(markdownContent: string, condensationType: 'shorter' | 'clarity' | 'examples', apiKey: string) {
  const response = await fetch('/api/summary/condense', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-User-API-Key': apiKey
    },
    body: JSON.stringify({ markdownContent, condensationType })
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Error ${response.status}`);
  }
  
  return response.json();
}
```

## Integración en Páginas Existentes

### 1. Página de Subida (Upload)

```tsx
// app/[locale]/upload/page.tsx
'use client';

import { useState } from 'react';
import { MultimodalUploader } from '@/components/upload/multimodal-uploader';
import { ApiKeyManager } from '@/components/settings/api-key-manager';
import { useApiKey } from '@/lib/hooks/useApiKey';

export default function UploadPage() {
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { isAvailable } = useApiKey();
  
  const handleSuccess = (data: any) => {
    setResult(data);
    setError(null);
  };
  
  const handleError = (errorMsg: string) => {
    setError(errorMsg);
    setResult(null);
  };
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Subir Contenido</h1>
      
      {!isAvailable && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Configuración Necesaria</h2>
          <ApiKeyManager />
        </div>
      )}
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Procesar Contenido</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sube un archivo (PDF o imagen) y/o proporciona texto para generar resúmenes o tarjetas de estudio.
        </p>
        
        <MultimodalUploader 
          endpoint="summary"
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded">
          <h3 className="text-red-600 font-medium">Error</h3>
          <p>{error}</p>
        </div>
      )}
      
      {result && (
        <div className="p-4 border rounded bg-card">
          <h3 className="font-medium mb-2">Resultado</h3>
          <pre className="whitespace-pre-wrap text-sm bg-muted p-2 rounded">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
```

## Manejo de Errores

Para gestionar adecuadamente los errores de API Key inválida o cuota excedida:

```tsx
// components/error/api-error-handler.tsx
export function ApiErrorHandler({ error }: { error: string }) {
  // Determinar tipo de error y mostrar mensaje apropiado
  if (error.includes('API Key inválida') || error.includes('401')) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded">
        <h3 className="text-red-600 font-medium">Error de API Key</h3>
        <p className="mb-2">La API Key proporcionada no es válida o no tiene permisos para acceder a la API de Gemini.</p>
        <p className="text-sm">Solución: Verifica tu API Key en <a href="https://aistudio.google.com/" className="text-primary">Google AI Studio</a> y asegúrate de que esté correctamente configurada.</p>
      </div>
    );
  }
  
  if (error.includes('cuota') || error.includes('429')) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 className="text-yellow-600 font-medium">Límite de cuota excedido</h3>
        <p className="mb-2">Has excedido el límite de uso para tu API Key.</p>
        <p className="text-sm">Solución: Espera un tiempo antes de intentar nuevamente o revisa tus límites de cuota en Google Cloud Console.</p>
      </div>
    );
  }
  
  // Error genérico
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <h3 className="text-red-600 font-medium">Error</h3>
      <p>{error}</p>
    </div>
  );
}
```

## Consideraciones de UI/UX

1. **Indicadores de carga**: Implementar spinners o barras de progreso para solicitudes que pueden tomar tiempo (procesamiento de PDFs extensos)
2. **Feedback visual**: Mostrar claramente cuando un archivo ha sido correctamente subido
3. **Validaciones**: Verificar tipos de archivo y tamaño antes de enviar al backend
4. **Información de ayuda**: Proporcionar tooltips o información sobre el propósito de la API Key y cómo obtenerla
5. **Gestión de estados**: Manejar adecuadamente los estados de carga, éxito y error

## Ejemplo de Integración Completa

Puedes consultar un ejemplo completo de integración en los archivos de ejemplo incluidos en este repositorio:

- `/examples/summary-page-integration.tsx`: Ejemplo de página de resúmenes con soporte multimodal
- `/examples/flashcards-page-integration.tsx`: Ejemplo de página de tarjetas de estudio con soporte multimodal
- `/examples/settings-page-integration.tsx`: Ejemplo de página de configuración con gestión de API Key

---

Esta guía proporciona la base para integrar las nuevas funcionalidades multimodales en el frontend. Adapta el código según las necesidades específicas de tu aplicación y la estructura actual del frontend.
