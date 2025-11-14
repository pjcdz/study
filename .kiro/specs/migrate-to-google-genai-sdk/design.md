# Documento de Diseño

## Overview

Esta migración reemplaza completamente Vercel AI SDK con la SDK nativa de Google GenAI (`@google/genai`) para aprovechar todas las capacidades de la API de Gemini sin abstracciones intermedias. La migración se centra en el servicio `geminiClient.ts` y las API routes que lo utilizan, manteniendo compatibilidad total con el frontend existente.

### Objetivos Principales

1. Eliminar dependencias de Vercel AI SDK (`ai`, `@ai-sdk/google`)
2. Implementar todas las funcionalidades usando `@google/genai` exclusivamente
3. Agregar soporte para AbortSignal para cancelación de solicitudes
4. Mantener compatibilidad con el frontend sin cambios en componentes React
5. Preparar la base para funcionalidades avanzadas como File Search

### Beneficios de la Migración

- Acceso directo a todas las funcionalidades de Gemini API
- Mejor control sobre el manejo de archivos con Files API
- Preparación para File Search y otras características avanzadas
- Eliminación de abstracciones innecesarias
- Mejor tipado con tipos nativos de Google
- Soporte nativo para cancelación de solicitudes

## Architecture

### Diagrama de Arquitectura Actual vs Nueva


```
ARQUITECTURA ACTUAL (Vercel AI SDK)
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React Components)                                 │
│ - UploadArea, SummaryDisplay, FlashcardsDisplay            │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP Requests (FormData)
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ API Routes (Next.js)                                        │
│ - /api/summary                                              │
│ - /api/flashcards                                           │
└────────────────┬────────────────────────────────────────────┘
                 │ Calls service functions
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ geminiClient.ts (Vercel AI SDK)                             │
│ - generateMultimodalContent()                               │
│ - Uses: import { generateText } from 'ai'                   │
│ - Uses: import { google } from '@ai-sdk/google'             │
│ - Fallback to @google/generative-ai for large files        │
└────────────────┬────────────────────────────────────────────┘
                 │ API Calls
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Gemini API (Google)                                         │
└─────────────────────────────────────────────────────────────┘

NUEVA ARQUITECTURA (Google GenAI SDK Nativo)
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React Components) - SIN CAMBIOS                   │
│ - UploadArea, SummaryDisplay, FlashcardsDisplay            │
└────────────────┬────────────────────────────────────────────┘
                 │ HTTP Requests (FormData) - MISMO FORMATO
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ API Routes (Next.js) - ACTUALIZADAS                         │
│ - /api/summary                                              │
│ - /api/flashcards                                           │
│ - Mantienen mismo formato de respuesta                     │
└────────────────┬────────────────────────────────────────────┘
                 │ Calls refactored functions
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ geminiClient.ts (Google GenAI SDK Nativo)                   │
│ - generateMultimodalContent() - REFACTORIZADO               │
│ - generateText() - REFACTORIZADO                            │
│ - generateSummaryFromParts() - NUEVO                        │
│ - Uses: import { GoogleGenAI } from '@google/genai'         │
│ - Soporte para AbortSignal                                  │
│ - Sin fallbacks, todo nativo                                │
└────────────────┬────────────────────────────────────────────┘
                 │ API Calls directas
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Gemini API (Google)                                         │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Nuevo Cliente GoogleGenAI


```typescript
import { GoogleGenAI, Part, GenerateContentResponse } from '@google/genai';

// Inicialización del cliente
const ai = new GoogleGenAI({ apiKey: userApiKey });

// Acceso a modelos
const model = 'gemini-2.5-flash';

// Generación de contenido
const response = await ai.models.generateContent({
  model,
  contents: { parts },
  config: {
    temperature: 1,
    maxOutputTokens: 8192,
    topP: 0.8,
    topK: 40
  }
});
```

### 2. Estructura de Parts (Contenido Multimodal)

```typescript
// Tipo Part nativo de Google GenAI
type Part = 
  | { text: string }
  | { inlineData: { data: string; mimeType: string } }
  | { fileData: { fileUri: string; mimeType: string } };

// Ejemplo de construcción de Parts
const parts: Part[] = [
  { text: "Analiza este documento" },
  { 
    inlineData: { 
      data: buffer.toString('base64'), 
      mimeType: 'application/pdf' 
    } 
  }
];
```

### 3. Función makeApiCall con AbortSignal

```typescript
async function makeApiCall<T>(
  apiPromise: Promise<T>,
  signal: AbortSignal
): Promise<T> {
  // Verificar si ya está abortado
  if (signal.aborted) {
    throw new Error('Aborted');
  }

  // Crear promesa que se rechaza cuando se aborta
  const abortPromise = new Promise<never>((_, reject) => {
    signal.addEventListener('abort', () => {
      reject(new Error('Aborted'));
    });
  });

  // Race entre la API call y el abort
  try {
    return await Promise.race([apiPromise, abortPromise]);
  } catch (error: any) {
    if (error.message === 'Aborted') {
      console.log("Gemini request was aborted.");
    }
    throw error;
  }
}
```

### 4. Función generateSummaryFromParts (Nueva)


```typescript
export async function generateSummaryFromParts(
  parts: Part[], 
  signal: AbortSignal,
  apiKey: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  
  const generateContentPromise = ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
  });
  
  const response = await makeApiCall(generateContentPromise, signal);
  const text = response.text;
  
  if (!text) {
    throw new Error("No text response from Gemini.");
  }
  
  return text;
}
```

### 5. Función generateText Refactorizada

```typescript
export async function generateText(
  prompt: string, 
  signal: AbortSignal,
  apiKey: string
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey });
  
  const generateContentPromise = ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
  });
  
  const response = await makeApiCall(generateContentPromise, signal);
  const text = response.text.trim();
  
  if (!text) {
    throw new Error("No text response from Gemini.");
  }
  
  return text;
}
```

### 6. Función generateMultimodalContent Refactorizada

```typescript
export async function generateMultimodalContent(
  userApiKey: string,
  parts: Part[],
  systemInstructionText?: string,
  signal?: AbortSignal
): Promise<GenerationResult> {
  const ai = new GoogleGenAI({ apiKey: userApiKey });
  
  // Construir parts con system instruction si existe
  const contentParts: Part[] = systemInstructionText
    ? [{ text: systemInstructionText }, ...parts]
    : parts;
  
  const generateContentPromise = ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: contentParts },
    config: {
      temperature: 1,
      maxOutputTokens: 8192,
      topP: 0.8,
      topK: 40
    }
  });
  
  // Usar makeApiCall si hay signal, sino llamar directamente
  const response = signal 
    ? await makeApiCall(generateContentPromise, signal)
    : await generateContentPromise;
  
  const text = response.text;
  
  // Extraer métricas de uso
  const usageMetadata = response.usageMetadata || {};
  const stats = {
    promptTokens: usageMetadata.promptTokenCount || 0,
    candidatesTokens: usageMetadata.candidatesTokenCount || 0,
    totalTokens: usageMetadata.totalTokenCount || 0
  };
  
  return {
    generatedText: text,
    stats
  };
}
```

### 7. Manejo de Archivos con Files API


```typescript
export async function processFileForGemini(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
  filename: string = `file-${Date.now()}`
): Promise<Part> {
  const fileSize = buffer.length;
  const ai = new GoogleGenAI({ apiKey });
  
  // Archivos pequeños: usar inlineData
  if (fileSize <= MAX_INLINE_FILE_SIZE) {
    return {
      inlineData: {
        data: buffer.toString('base64'),
        mimeType
      }
    };
  }
  
  // Archivos grandes: usar Files API
  const fileBlob = new Blob([buffer], { type: mimeType });
  
  const file = await ai.files.upload({
    file: fileBlob,
    config: { displayName: filename }
  });
  
  // Trackear el archivo
  sessionManager.trackFileProcessing(apiKey, file.name, filename);
  
  // Esperar procesamiento
  let getFile = await ai.files.get({ name: file.name });
  let attempts = 0;
  const maxAttempts = 30;
  
  while (getFile.state === 'PROCESSING' && attempts < maxAttempts) {
    attempts++;
    await new Promise(resolve => setTimeout(resolve, 2000));
    getFile = await ai.files.get({ name: file.name });
  }
  
  if (getFile.state === 'FAILED') {
    sessionManager.updateFileStatus(apiKey, file.name, 'FAILED');
    throw new Error('File processing failed');
  }
  
  sessionManager.updateFileStatus(apiKey, file.name, 'PROCESSED');
  
  return {
    fileData: {
      fileUri: file.uri,
      mimeType
    }
  };
}

export async function cleanupFile(
  fileName: string, 
  apiKey: string
): Promise<boolean> {
  try {
    const ai = new GoogleGenAI({ apiKey });
    await ai.files.delete({ name: fileName });
    sessionManager.removeFileTracking(apiKey, fileName);
    return true;
  } catch (error) {
    console.error(`Failed to delete file: ${error}`);
    return false;
  }
}
```

## Data Models

### Tipos TypeScript Actualizados

```typescript
import { Part, GenerateContentResponse } from '@google/genai';

// Resultado de generación
export interface GenerationResult {
  generatedText: string;
  stats: GenerationStats;
}

export interface GenerationStats {
  promptTokens: number;
  candidatesTokens: number;
  totalTokens: number;
}

// Tipos de error (sin cambios)
export const ERROR_TYPES = {
  QUOTA_EXCEEDED: 'QUOTA_EXCEEDED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  INVALID_API_KEY: 'INVALID_API_KEY',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_PROCESSING_FAILED: 'FILE_PROCESSING_FAILED'
} as const;
```

## Error Handling

### Mapeo de Errores de Google GenAI SDK


```typescript
function handleGeminiError(error: any): never {
  console.error('Error calling Gemini API:', error);
  
  // API Key inválida
  if (error.message?.includes('API key not valid') || 
      error.message?.includes('API key is missing')) {
    const authError: any = new Error(
      'API Key inválida o sin permisos. Por favor, verifica tu API Key.'
    );
    authError.type = ERROR_TYPES.INVALID_API_KEY;
    authError.status = 401;
    throw authError;
  }
  
  // Cuota excedida
  if (error.message?.includes('quota') || 
      error.status === 429 ||
      error.message?.includes('RESOURCE_EXHAUSTED')) {
    const quotaError: any = new Error(
      'Se ha excedido la cuota para esta API Key.'
    );
    quotaError.type = ERROR_TYPES.QUOTA_EXCEEDED;
    quotaError.status = 429;
    throw quotaError;
  }
  
  // Error de red
  if (error.name === 'FetchError' || 
      error.code === 'ENOTFOUND' ||
      error.message?.includes('network')) {
    const networkError: any = new Error(
      `Error de red al conectar con Gemini API: ${error.message}`
    );
    networkError.type = ERROR_TYPES.NETWORK_ERROR;
    networkError.status = 503;
    throw networkError;
  }
  
  // Solicitud abortada
  if (error.message === 'Aborted') {
    const abortError: any = new Error('Solicitud cancelada por el usuario');
    abortError.type = ERROR_TYPES.UNKNOWN_ERROR;
    abortError.status = 499;
    throw abortError;
  }
  
  // Error desconocido
  const unknownError: any = new Error(error.message || 'Error desconocido');
  unknownError.type = ERROR_TYPES.UNKNOWN_ERROR;
  unknownError.status = 500;
  throw unknownError;
}
```

### Uso en generateMultimodalContent

```typescript
export async function generateMultimodalContent(
  userApiKey: string,
  parts: Part[],
  systemInstructionText?: string,
  signal?: AbortSignal
): Promise<GenerationResult> {
  try {
    // ... código de generación ...
  } catch (error: any) {
    handleGeminiError(error);
  }
}
```

## Testing Strategy

### 1. Pruebas Unitarias

**Archivo: `lib/services/__tests__/geminiClient.test.ts`**

```typescript
describe('generateText', () => {
  it('should generate text from prompt', async () => {
    const signal = new AbortController().signal;
    const result = await generateText('Test prompt', signal, 'test-key');
    expect(result).toBeTruthy();
  });
  
  it('should throw when aborted', async () => {
    const controller = new AbortController();
    controller.abort();
    
    await expect(
      generateText('Test', controller.signal, 'test-key')
    ).rejects.toThrow('Aborted');
  });
});

describe('generateSummaryFromParts', () => {
  it('should generate from parts array', async () => {
    const parts: Part[] = [{ text: 'Test content' }];
    const signal = new AbortController().signal;
    
    const result = await generateSummaryFromParts(parts, signal, 'test-key');
    expect(result).toBeTruthy();
  });
});

describe('processFileForGemini', () => {
  it('should use inlineData for small files', async () => {
    const smallBuffer = Buffer.from('small content');
    const part = await processFileForGemini(
      smallBuffer, 
      'text/plain', 
      'test-key'
    );
    
    expect(part).toHaveProperty('inlineData');
  });
  
  it('should use Files API for large files', async () => {
    const largeBuffer = Buffer.alloc(25 * 1024 * 1024); // 25MB
    const part = await processFileForGemini(
      largeBuffer, 
      'application/pdf', 
      'test-key'
    );
    
    expect(part).toHaveProperty('fileData');
  });
});
```

### 2. Pruebas de Integración

**Archivo: `app/api/__tests__/summary.test.ts`**


```typescript
describe('POST /api/summary', () => {
  it('should process text prompt', async () => {
    const formData = new FormData();
    formData.append('textPrompt', 'Test content');
    
    const response = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'X-User-API-Key': 'test-key' },
      body: formData
    });
    
    expect(response.ok).toBe(true);
    const data = await response.json();
    expect(data).toHaveProperty('notionMarkdown');
    expect(data).toHaveProperty('stats');
  });
  
  it('should process file upload', async () => {
    const formData = new FormData();
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    formData.append('file0', file);
    
    const response = await fetch('/api/summary', {
      method: 'POST',
      headers: { 'X-User-API-Key': 'test-key' },
      body: formData
    });
    
    expect(response.ok).toBe(true);
  });
  
  it('should return 401 without API key', async () => {
    const formData = new FormData();
    formData.append('textPrompt', 'Test');
    
    const response = await fetch('/api/summary', {
      method: 'POST',
      body: formData
    });
    
    expect(response.status).toBe(401);
  });
});
```

### 3. Pruebas de Compatibilidad con Frontend

**Verificar que el formato de respuesta no cambia:**

```typescript
describe('Response format compatibility', () => {
  it('should maintain summary response format', async () => {
    const response = await apiClient.processSummary('Test content');
    
    // Verificar estructura esperada por el frontend
    expect(response).toHaveProperty('notionMarkdown');
    expect(response).toHaveProperty('stats');
    expect(response.stats).toHaveProperty('promptTokens');
    expect(response.stats).toHaveProperty('candidatesTokens');
    expect(response.stats).toHaveProperty('totalTokens');
    expect(response.stats).toHaveProperty('generationTimeMs');
  });
  
  it('should maintain flashcards response format', async () => {
    const response = await apiClient.processFlashcards('Test content');
    
    expect(response).toHaveProperty('flashcards');
    expect(response).toHaveProperty('stats');
  });
  
  it('should maintain error format', async () => {
    try {
      await apiClient.processSummary('Test', 'invalid-key');
    } catch (error: any) {
      expect(error).toHaveProperty('type');
      expect(error.type).toBe(ApiErrorType.INVALID_API_KEY);
    }
  });
});
```

## Implementación por Fases

### Fase 1: Preparación y Configuración

1. Actualizar `package.json`:
   - Remover `ai` y `@ai-sdk/google`
   - Verificar versión de `@google/genai`
   - Ejecutar `npm install`

2. Crear archivo de utilidades `makeApiCall`:
   - Implementar función con soporte para AbortSignal
   - Agregar tests unitarios

### Fase 2: Refactorización de Funciones Core

1. Refactorizar `generateText`:
   - Reemplazar Vercel AI SDK con Google GenAI
   - Agregar soporte para AbortSignal
   - Actualizar tests

2. Crear `generateSummaryFromParts`:
   - Nueva función para contenido multimodal
   - Soporte para AbortSignal
   - Tests unitarios

3. Refactorizar `generateMultimodalContent`:
   - Eliminar código de fallback
   - Usar solo Google GenAI SDK
   - Mantener misma interfaz pública
   - Actualizar tests

### Fase 3: Actualización de Manejo de Archivos

1. Refactorizar `processFileForGemini`:
   - Usar `ai.files.upload` nativo
   - Usar `ai.files.get` para verificar estado
   - Mantener integración con sessionManager

2. Refactorizar `cleanupFile`:
   - Usar `ai.files.delete` nativo

### Fase 4: Actualización de API Routes

1. Actualizar `/api/summary`:
   - Verificar que usa funciones refactorizadas
   - Mantener formato de respuesta
   - Tests de integración

2. Actualizar `/api/flashcards`:
   - Verificar que usa funciones refactorizadas
   - Mantener formato de respuesta
   - Tests de integración

### Fase 5: Actualización de Tipos

1. Actualizar `lib/types/gemini.ts`:
   - Importar tipos nativos de `@google/genai`
   - Eliminar tipos duplicados
   - Extender tipos nativos donde sea necesario

### Fase 6: Limpieza y Verificación

1. Eliminar código obsoleto:
   - Remover imports de Vercel AI SDK
   - Remover funciones de fallback
   - Limpiar comentarios obsoletos

2. Verificación final:
   - Ejecutar todos los tests
   - Verificar compilación TypeScript
   - Probar manualmente con frontend

## Consideraciones de Migración

### Cambios en la API

| Vercel AI SDK | Google GenAI SDK |
|---------------|------------------|
| `generateText({ model, prompt })` | `ai.models.generateContent({ model, contents })` |
| `result.text` | `response.text` |
| `result.usage.promptTokens` | `response.usageMetadata.promptTokenCount` |
| `google(MODEL_NAME)` | `new GoogleGenAI({ apiKey })` |

### Compatibilidad con Frontend

- **Sin cambios requeridos** en componentes React
- **Mismo formato** de FormData en requests
- **Mismo formato** de respuestas JSON
- **Mismos tipos** de error (ERROR_TYPES)

### Beneficios Post-Migración

1. **Preparación para File Search**: Base lista para agregar funcionalidad de búsqueda semántica
2. **Mejor control**: Acceso directo a todas las opciones de configuración
3. **Menos dependencias**: Eliminación de capa de abstracción innecesaria
4. **Cancelación nativa**: Soporte para AbortSignal en todas las operaciones
5. **Tipos mejorados**: Uso de tipos oficiales de Google

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Incompatibilidad con frontend | Baja | Alto | Mantener exactamente el mismo formato de respuesta |
| Errores en manejo de archivos grandes | Media | Medio | Tests exhaustivos con archivos de diferentes tamaños |
| Cambios en comportamiento de API | Baja | Medio | Documentar diferencias y ajustar según sea necesario |
| Problemas con AbortSignal | Media | Bajo | Hacer AbortSignal opcional inicialmente |
| Regresiones en funcionalidad | Media | Alto | Suite completa de tests antes de desplegar |
