# Guía de Integración Frontend para Actualización Multimodal

Esta guía proporciona los pasos necesarios para integrar las nuevas funcionalidades multimodales de StudyApp en el frontend, permitiendo a los usuarios proporcionar su propia API Key de Google AI Studio y procesar tanto texto como archivos (PDF e imágenes).

## Gestión de API Key de Usuario

### 1. Interfaz para Configuración de API Key

Añadir un componente para que el usuario configure su API Key, preferiblemente dentro de una sección de ajustes de la aplicación. Este componente utilizaría claves de internacionalización para los textos.

```tsx
// components/settings/api-key-manager.tsx
import { useState, useEffect } from 'react';
// Suponiendo que tienes una función t para internacionalización, ej: import { useTranslations } from 'next-intl';

export function ApiKeyManager() {
  // const t = useTranslations('settings'); // o el namespace apropiado
  const [apiKey, setApiKey] = useState<string>('');
  const [isKeySaved, setIsKeySaved] = useState<boolean>(false);
  
  useEffect(() => {
    const savedKey = localStorage.getItem('studyToolUserApiKey');
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
  }, []);
  
  const handleSave = () => {
    if (apiKey.trim()) {
      localStorage.setItem('studyToolUserApiKey', apiKey);
      setIsKeySaved(true);
      // toast.success(t('apiKey.saved'));
    }
  };
  
  const handleClear = () => {
    localStorage.removeItem('studyToolUserApiKey');
    setApiKey('');
    setIsKeySaved(false);
    // toast.info(t('apiKey.cleared')); // Suponiendo que tienes una clave para esto
  };
  
  return (
    <div className="p-4 border rounded-lg bg-card">
      {/* Título, ej: t('apiKey.title') que sería "API Key" */}
      <h3 className="text-lg font-medium mb-2">{"API Key"}</h3>
      {/* Descripción, ej: t('apiKey.description') */}
      <p className="text-sm text-muted-foreground mb-4">
        {"Your Google Gemini API key is required to use AI features"}
      </p>
      {/* Nota sobre dónde obtener la clave, usando t('apiInfo.howToGet') y t('apiInfo.getApiKeyButton') */}
      <p className="text-sm text-muted-foreground mb-4">
        {"How to get a Google Gemini API Key:"}
        <a href="https://aistudio.google.com/" target="_blank" rel="noopener" className="text-primary ml-1">
          {"Go to Google AI Studio"}
        </a>
      </p>
      
      <div className="flex gap-2 mb-2">
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          // Placeholder, ej: t('apiKey.placeholder')
          placeholder={"Enter your Google AI Studio API Key"}
          className="flex-1 px-3 py-2 border rounded"
        />
        {/* Botón Guardar, ej: t('apiKey.saveButton') */}
        <button onClick={handleSave} className="px-4 py-2 bg-primary text-primary-foreground rounded">
          {"Save API Key"}
        </button>
        {isKeySaved && (
          // Botón Borrar, ej: t('apiKey.clearButton')
          <button onClick={handleClear} className="px-4 py-2 border rounded">
            {"Clear API Key"}
          </button>
        )}
      </div>
      
      {isKeySaved && (
        // Mensaje de clave guardada, ej: t('apiKey.saved')
        <p className="text-sm text-green-600">
          {"API Key saved successfully"}
        </p>
      )}
      {/* Nota sobre almacenamiento local, ej: t('apiKey.localStorageNote') */}
      <p className="text-xs text-muted-foreground mt-2">
        {"Your API Key is stored only in your browser and never sent to our servers."}
      </p>

      {/* Sección de información adicional sobre la API podría usar t('apiInfo.title') y t('apiInfo.geminiDescription') */}
      <div className="mt-4">
        <h4 className="font-medium">{"About Gemini API"}</h4>
        <p className="text-xs text-muted-foreground">
          {"This application uses Google's Gemini 1.5 Flash API to generate summaries and flashcards. You need to provide your own API key from Google AI Studio."}
        </p>
        {/* Pasos para obtener la clave: t('apiInfo.step1'), t('apiInfo.step2'), etc. */}
      </div>
    </div>
  );
}
```

### 2. Validación de API Key (Hook)

Crear un hook para verificar la disponibilidad de la API Key:

```tsx
// lib/hooks/useApiKey.ts
import { useState, useEffect, useCallback } from 'react';

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isAvailable, setIsAvailable] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  const updateKeyState = useCallback(() => {
    const savedKey = localStorage.getItem('studyToolUserApiKey');
    setApiKey(savedKey);
    setIsAvailable(!!savedKey);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    updateKeyState();
    // Opcional: Escuchar cambios en localStorage si la clave puede ser modificada desde otra pestaña/componente
    window.addEventListener('storage', updateKeyState);
    return () => {
      window.removeEventListener('storage', updateKeyState);
    };
  }, [updateKeyState]);
  
  return {
    apiKey,
    isAvailable,
    isLoading,
    refreshApiKey: updateKeyState // Función para recargar el estado si es necesario
  };
}
```

## Manejo de Archivos y Solicitudes Multimodales

### 1. Componente para Subida de Archivos

```tsx
// components/upload/multimodal-uploader.tsx
import { useState, ChangeEvent, FormEvent } from 'react';
import { useApiKey } from '@/lib/hooks/useApiKey'; // Asegúrate que la ruta sea correcta
// Suponiendo que tienes una función t para internacionalización

type UploadProps = {
  onSuccess: (result: any) => void;
  onError: (errorKey: string, params?: Record<string, string | number>) => void; // Pasar clave de error para i18n
  endpoint: 'summary' | 'flashcards';
};

export function MultimodalUploader({ onSuccess, onError, endpoint }: UploadProps) {
  // const t = useTranslations('upload'); // o el namespace apropiado
  const [file, setFile] = useState<File | null>(null);
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { apiKey, isAvailable: isApiKeyAvailable } = useApiKey();
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
      if (!validTypes.includes(selectedFile.type)) {
        // onError(t('validation.invalidFileType', { type: selectedFile.type }));
        onError('validation.invalidFileType', { type: selectedFile.type });
        return;
      }
      if (selectedFile.size > 20 * 1024 * 1024) { // 20MB
        // onError(t('validation.fileTooLarge', { maxSize: 20 }));
        onError('validation.fileTooLarge', { maxSize: 20 });
        return;
      }
      setFile(selectedFile);
    }
  };
  
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isApiKeyAvailable) {
      // onError(t('toast.apiKeyMissing'));
      onError('toast.apiKeyMissing');
      return;
    }
    if (!file && !textPrompt.trim()) {
      // onError(t('validation.noContent'));
      onError('validation.noContent');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (textPrompt.trim()) formData.append('textPrompt', textPrompt);
      
      const response = await fetch(`/api/${endpoint}`, {
        method: 'POST',
        headers: { 'X-User-API-Key': apiKey! },
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        // Utilizar una clave de error genérica o mapear códigos de estado a claves específicas
        // onError(t('toast.error', { message: errorData.error || response.statusText }));
        onError('toast.error', { message: errorData.error || response.statusText });
        return;
      }
      
      const result = await response.json();
      onSuccess(result);
    } catch (error) {
      // onError(t('toast.networkError'));
      onError('toast.networkError');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        {/* Label, ej: t('textInput.labelWithoutFiles') o t('textInput.labelWithFiles') */}
        <label className="block text-sm font-medium mb-1">{"Text (optional)"}</label>
        <textarea 
          value={textPrompt}
          onChange={(e) => setTextPrompt(e.target.value)}
          // Placeholder, ej: t('textInput.placeholderWithoutFiles')
          placeholder={"Type or paste your text here..."}
          className="w-full h-32 p-2 border rounded"
        />
      </div>
      
      <div>
        {/* Label, ej: t('dropzone.title') */}
        <label className="block text-sm font-medium mb-1">{"File (optional)"}</label>
        <input 
          type="file" 
          onChange={handleFileChange}
          className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-primary file:text-primary-foreground"
          accept=".pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
        />
        {/* Info sobre archivo, ej: t('dropzone.sizeLimit') */}
        <p className="text-xs text-muted-foreground mt-1">{"Maximum 20MB per file. Supported formats: PDF and images"}</p>
        {file && (
          <p className="mt-1 text-sm text-green-600">
            {/* Usar t('fileList.remove', { name: file.name }) si se muestra el nombre */}
            {"Selected file:"} {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
          </p>
        )}
      </div>
      
      {!isApiKeyAvailable && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
          {/* Mensaje de API Key faltante, ej: t('upload.toast.apiKeyMissing') */}
          {"API Key not configured. Please configure your API Key in Settings before continuing."}
        </div>
      )}
      
      <button
        type="submit"
        disabled={isSubmitting || !isApiKeyAvailable || (!file && !textPrompt.trim())}
        className="w-full py-2 bg-primary text-primary-foreground rounded disabled:opacity-50"
      >
        {/* Texto de botón, ej: isSubmitting ? t('processing') : t('process') */}
        {isSubmitting ? "Processing..." : "Process Content"}
      </button>
    </form>
  );
}
```

### 2. Actualización de Cliente API

El `api-client.ts` debería permanecer estructuralmente similar, pero las funciones que lo llaman deben manejar los errores y pasar la API key.

```typescript
// lib/api-client.ts

// ... (processSummary, processFlashcards, condenseSummary como estaban, asegurándose que toman apiKey)
// Ejemplo para processSummary:
export async function processSummary(content: string | FormData, apiKey: string) {
  let body;
  let headers: Record<string, string> = {
    'X-User-API-Key': apiKey
  };
  
  if (typeof content === 'string') {
    body = JSON.stringify({ textPrompt: content }); // O la estructura que espere el backend
    headers['Content-Type'] = 'application/json';
  } else {
    body = content;
  }
  
  const response = await fetch('/api/summary', { // Asegúrate que el endpoint sea correcto
    method: 'POST',
    headers,
    body
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `Error ${response.status}`); // El llamador manejará esto para i18n
  }
  
  return response.json();
}

// ... (otras funciones como processFlashcards, condenseSummary)
```

## Integración en Páginas Existentes

### 1. Página de Subida (Upload)

```tsx
// app/[locale]/upload/page.tsx (o la ruta correspondiente)
'use client';

import { useState } from 'react';
import { MultimodalUploader } from '@/components/upload/multimodal-uploader'; // Ajustar ruta
import { ApiKeyManager } from '@/components/settings/api-key-manager'; // Ajustar ruta, si se muestra aquí
import { useApiKey } from '@/lib/hooks/useApiKey'; // Ajustar ruta
// Suponiendo que tienes una función t para internacionalización y un componente Toast

export default function UploadPage() {
  // const t = useTranslations(); // Namespace global o específico
  const [result, setResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { isAvailable: isApiKeyAvailable, isLoading: isApiKeyLoading } = useApiKey();
  
  const handleSuccess = (data: any) => {
    setResult(data);
    setErrorMsg(null);
    // toast.success(t('upload.toast.success'));
    // Redirigir a la página de resumen, por ejemplo
  };
  
  const handleError = (errorKey: string, params?: Record<string, string | number>) => {
    // const message = t(errorKey, params);
    const message = `Error: ${errorKey}`; // Placeholder si t no está configurado aquí
    setErrorMsg(message);
    setResult(null);
    // toast.error(message);
  };
  
  if (isApiKeyLoading) {
    return <div>{"Loading API Key status..."}</div>; // Usar un componente Skeleton o loader
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      {/* Título, ej: t('upload.title') */}
      <h1 className="text-2xl font-bold mb-6">{"Add Study Material"}</h1>
      
      {!isApiKeyAvailable && (
        <div className="mb-6">
          {/* Título para sección de API Key, ej: t('upload.apiKeyDialog.title') */}
          <h2 className="text-lg font-semibold mb-2">{"API Key Required"}</h2>
          {/* Aquí se podría mostrar un mensaje o el ApiKeyManager directamente */}
          <p className="text-red-500 mb-2">
            {/* t('upload.toast.apiKeyMissing') */}
            {"You cannot upload a file without configuring your API key first."}
          </p>
          {/* <ApiKeyManager /> */}
          {/* Un botón para ir a la página de configuración de la API Key */}
          {/* <Link href={`/${locale}/settings?tab=api`}>{t('upload.apiKeyDialog.configure')}</Link> */}
        </div>
      )}
      
      <div className="mb-6">
        {/* Título, ej: t('upload.multimodalDescription') */}
        <h2 className="text-lg font-semibold mb-2">{"Process Content"}</h2>
        <p className="text-sm text-muted-foreground mb-4">
          {"Upload a file (PDF or image) and/or enter text to generate a summary."}
        </p>
        
        <MultimodalUploader 
          endpoint="summary" // o "flashcards" según sea necesario
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </div>
      
      {errorMsg && (
        <div className="p-4 mb-6 bg-red-50 border border-red-200 rounded">
          {/* Título de error, ej: t('toast.error', { message: '' }).split(':')[0] */}
          <h3 className="text-red-600 font-medium">{"Error"}</h3>
          <p>{errorMsg}</p>
        </div>
      )}
      
      {result && (
        <div className="p-4 border rounded bg-card">
          {/* Título de resultado */}
          <h3 className="font-medium mb-2">{"Result"}</h3>
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

Para gestionar adecuadamente los errores de API Key inválida o cuota excedida, el componente que muestra el error (podría ser un `ApiErrorHandler` o directamente en la página) debería usar las claves de i18n.

```tsx
// components/error/api-error-handler.tsx (Ejemplo conceptual)
// Suponiendo que tienes una función t para internacionalización

export function ApiErrorHandler({ errorKey, errorParams }: { errorKey: string, errorParams?: Record<string, string | number> }) {
  // const t = useTranslations(); // Namespace global o específico
  // const message = t(errorKey, errorParams);
  const message = `Error: ${errorKey}`; // Placeholder

  // Determinar tipo de error basado en errorKey y mostrar mensaje apropiado
  // Por ejemplo, si errorKey es 'toast.apiKeyError' o 'toast.quotaExceeded'
  
  let title = "Error"; // t('toast.error', { message: '' }).split(':')[0];
  let specificMessage = message;
  let solution = "";

  if (errorKey === 'toast.apiKeyError' || errorKey.includes('apiKeyInvalid')) {
    // title = t('settings.apiKey.title'); // o un título específico de error de API
    specificMessage = "The provided API Key is invalid or does not have permissions."; // t('api.errors.invalidKey') o similar
    // solution = t('api.errors.checkKeySolution'); // "Solution: Verify your API Key..."
  } else if (errorKey === 'toast.quotaExceeded') {
    // title = t('toast.quotaExceeded').split('.')[0]; // "API usage limit exceeded"
    specificMessage = "You have exceeded the usage limit for your API Key.";
    // solution = t('toast.quotaExceededSolution'); // "Solution: Wait or check your quota..."
  }
  
  return (
    <div className="p-4 bg-red-50 border border-red-200 rounded">
      <h3 className="text-red-600 font-medium">{title}</h3>
      <p className="mb-2">{specificMessage}</p>
      {solution && <p className="text-sm">{solution}</p>}
    </div>
  );
}
```

## Consideraciones de UI/UX

1.  **Indicadores de carga**: Usar componentes Skeleton o spinners durante cargas (ej. `isApiKeyLoading`, `isSubmitting`).
2.  **Feedback visual**: Usar toasts (ej. Sonner) para notificaciones de éxito/error, utilizando claves de `messages.json` (ej. `t('toast.success')`, `t('toast.error', { message: ... })`).
3.  **Validaciones**: Realizar validaciones en el cliente (tipos de archivo, tamaño) y mostrar mensajes usando i18n (ej. `t('upload.validation.fileTooLarge')`).
4.  **Información de ayuda**: En la sección de configuración de API Key, incluir los pasos detallados de `settings.apiInfo.step1`, `step2`, etc. y el botón `settings.apiInfo.getApiKeyButton`.
5.  **Gestión de estados**: Manejar adecuadamente los estados de carga, éxito y error en todos los componentes interactivos.

## Ejemplo de Integración Completa

Se recomienda que los ejemplos de integración en el frontend sigan la estructura de `messages.json` para los textos y se adapten a los componentes reales de la aplicación.

---

Esta guía proporciona la base para integrar las nuevas funcionalidades multimodales en el frontend. Adapta el código según las necesidades específicas de tu aplicación y la estructura actual del frontend, utilizando las claves de internacionalización de tus archivos `messages.json`.
