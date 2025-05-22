# StudyApp - Documentación del Flujo de Trabajo

## Índice
1. [Introducción](#introducción)
2. [Requisitos Técnicos](#requisitos-técnicos)
3. [Arquitectura](#arquitectura)
4. [Flujo de Usuario](#flujo-de-usuario)
   - [1. Acceso inicial y validación de API Key](#1-acceso-inicial-y-validación-de-api-key)
   - [2. Configuración de la API Key](#2-configuración-de-la-api-key)
   - [3. Subida y procesamiento de archivos](#3-subida-y-procesamiento-de-archivos)
   - [4. Pantalla de resumen](#4-pantalla-de-resumen)
   - [5. Generación de flashcards y reinicio](#5-generación-de-flashcards-y-reinicio)
5. [Componentes Principales](#componentes-principales)
6. [Almacenamiento de Estado](#almacenamiento-de-estado)
7. [Internacionalización](#internacionalización)
8. [Manejo de Errores](#manejo-de-errores)
9. [Mejores Prácticas y Consideraciones de Escalabilidad](#mejores-prácticas-y-consideraciones-de-escalabilidad)

## Introducción

StudyApp es una aplicación que permite a los usuarios procesar documentos (PDF, imágenes) o texto para generar resúmenes y flashcards de estudio utilizando la API de Google Gemini 1.5 Flash. La aplicación está diseñada para ser multimodal.

Esta documentación describe el flujo de trabajo completo de la aplicación.

## Requisitos Técnicos

- **Frontend**: Next.js, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Node.js, Express.js
- **API Externa**: Google Gemini 1.5 Flash para procesamiento de IA
- **Almacenamiento**: LocalStorage (frontend) para API keys y estado de la aplicación
- **Contenedores**: Docker para desarrollo y producción

## Arquitectura

- **Frontend** (Next.js): Gestiona la UI, navegación, y almacena la API key y estado en localStorage.
- **Backend** (Express): Procesa solicitudes, se comunica con la API de Gemini.

### Estructura de Directorios (Frontend relevante)

```
frontend/
├── app/
│   └── [locale]/
│       ├── upload/            # Página de subida (ruta principal inicial)
│       ├── summary/           # Página de resumen
│       ├── flashcards/        # Página de flashcards
│       └── settings/          # Página de configuración (incluye API y apariencia)
├── components/
├── lib/
│   └── hooks/                 # useApiKey, useProcessingTimer
├── messages/                  # Archivos de internacionalización (en.json, es.json)
├── store/                     # Gestión de estado (Zustand)
└── docs/
```

## Flujo de Usuario

(Los textos de UI deben usar la función `t` de `next-intl` con claves de `messages.json`)

### 1. Acceso inicial y validación de API Key

**User Story**: Al acceder a la aplicación (ej. ruta `/upload` o raíz que redirige a `/upload`).

**Comportamiento Esperado**:
- El sistema comprueba si existe una API key guardada en localStorage (`useApiKey` hook).
- Si no hay API key:
  - Muestra un diálogo o mensaje indicando la necesidad de configurar la API key (ej. usando `t('upload.apiKeyDialog.title')` y `t('settings.apiKey.missing')`).
  - Ofrece un botón/link para ir a la página de configuración (ej. `t('upload.apiKeyDialog.configure')` que lleva a `/settings` con la pestaña de API seleccionada).
  - Las funcionalidades de subida/procesamiento están deshabilitadas.
- Si hay API key: Permite el uso normal de la aplicación.

**Implementación Técnica**:
- Hook `useApiKey` para verificar estado de la API key.
- Componente condicional en la página de subida para mostrar el aviso y el enlace a configuración.

### 2. Configuración de la API Key

**User Story**: Usuario navega a la página de configuración (ej. `/settings`, pestaña API) para ingresar su clave.

**Comportamiento Esperado**:
- La página de configuración (ej. `app/[locale]/settings/page.tsx`) tiene una sección para la API Key.
- Muestra campos y textos usando claves de `messages.json` (ej. `t('settings.apiKey.title')`, `t('settings.apiKey.placeholder')`, `t('settings.apiKey.saveButton')`).
- Incluye información sobre cómo obtener una API key (ej. `t('settings.apiInfo.title')`, `t('settings.apiInfo.howToGet')`, `t('settings.apiInfo.step1')`, etc., y `t('settings.apiInfo.getApiKeyButton')`).
- Al guardar, la clave se almacena en localStorage. Se muestra una notificación (ej. `toast.success(t('settings.apiKey.saved'))`).
- El usuario puede borrar la clave (ej. `t('settings.apiKey.clearButton')`).

**Implementación Técnica**:
- Componente `ApiKeyManager` (o similar) dentro de la página de Settings.
- Uso de `localStorage.setItem` y `localStorage.removeItem`.
- El hook `useApiKey` se actualiza para reflejar el nuevo estado.

### 3. Subida y procesamiento de archivos

**User Story**: Usuario en `/upload` con API key configurada, sube un archivo (PDF/imagen) y/o introduce texto.

**Comportamiento Esperado**:
- UI permite seleccionar archivos y/o escribir texto (usando `t('upload.dropzone.title')`, `t('upload.textInput.labelWithoutFiles')`).
- Botón "Process" (ej. `t('upload.process')`) se activa si hay contenido.
- Al clicar "Process":
  - Se envía el contenido al backend con la API Key en la cabecera `X-User-API-Key`.
  - Muestra indicador de carga (ej. `t('upload.processing')`).
  - Al completarse, se guarda el resultado y redirige a `/summary`.
  - Notificaciones de éxito/error (ej. `toast.success(t('upload.toast.success'))` o `toast.error(t('upload.toast.error', { message: ... }))`).

**Implementación Técnica**:
- Componente `MultimodalUploader` o similar.
- `FormData` para enviar archivos y texto.
- `fetch` al endpoint del backend (ej. `/api/summary`).
- `useUploadStore` (Zustand) para guardar el resultado.
- `useRouter` de Next.js para la redirección.

### 4. Pantalla de resumen

**User Story**: Usuario es redirigido a `/summary` después del procesamiento.

**Comportamiento Esperado**:
- Muestra el resumen generado (ej. `t('summary.title')`).
- Botones disponibles:
  - "Condense More" (ej. `t('summary.actions.condense')`).
    - Genera nuevas versiones del resumen (hasta un límite, ej. 3).
    - Permite navegar entre versiones.
    - Notificaciones (ej. `toast.success(t('summary.toast.condensed'))`).
  - "Generate Flashcards" (ej. `t('summary.actions.generateFlashcards')`).
    - Envía el resumen actual al backend para generar flashcards.
    - Redirige a `/flashcards`.
    - Notificaciones (ej. `toast.success(t('summary.toast.success'))`).
  - "Copy" (ej. `t('summary.actions.copy')`) para copiar el contenido del resumen.

**Implementación Técnica**:
- `useUploadStore` para obtener y actualizar resúmenes.
- Llamadas al backend para condensar y generar flashcards.
- Componente para mostrar el markdown (ej. `MarkdownPreview`).

### 5. Generación de flashcards y reinicio

**User Story**: Usuario en `/flashcards` revisa las flashcards y puede reiniciar el proceso.

**Comportamiento Esperado**:
- Muestra las flashcards generadas (ej. `t('flashcards.title')`).
- Opciones para copiar en formato TSV (ej. `t('flashcards.actions.copy')`).
- Botón "Restart" o "Start New Project" (ej. `t('navigation.restart')` o `t('flashcards.actions.startNewProject')`).
  - Muestra diálogo de confirmación (ej. `t('navigation.restartConfirm')`, `t('navigation.restartDescription')`).
  - Al confirmar, limpia el estado de `useUploadStore` y localStorage relacionado.
  - Redirige a `/upload`.
  - Notificación (ej. `toast.success(t('flashcards.toast.resetSuccess'))`).

**Implementación Técnica**:
- `useUploadStore` para obtener flashcards y para la función `reset()`.
- `localStorage.removeItem` para limpiar datos persistidos.
- Componente `AlertDialog` de ShadCN para la confirmación.

## Componentes Principales

### Hooks Personalizados

#### useApiKey
Gestiona la API key:
- Carga/guarda/limpia la API key de `localStorage`.
- Proporciona estado `isAvailable`, `isLoading`, `apiKey`.
- (Ver `backend/docs/FRONTEND_INTEGRATION.md` para un ejemplo más detallado).

#### useProcessingTimer (si aún se usa)
Maneja un temporizador visual durante operaciones largas.

### Componentes de UI (ShadCN y personalizados)
- `FileDropzone`, `FileList`, `ApiKeyManager`, `MultimodalUploader`, `MarkdownPreview`.
- Componentes de ShadCN como `Button`, `Dialog`, `AlertDialog`, `Input`, `Toast` (Sonner).

## Almacenamiento de Estado

### useUploadStore (Zustand)
Gestiona el estado global del flujo de subida:
- Archivos, texto de entrada.
- Resúmenes (múltiples versiones), índice del resumen current.
- Flashcards.
- Paso actual del flujo (si es necesario).
- Persistencia en `localStorage`.

```typescript
// store/use-upload-store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ... (definición de la interfaz de estado)

export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
      // ... (estado inicial y acciones como addSummary, addFlashcards, reset)
      files: [],
      inputText: '',
      summaries: [], // Array de strings (markdowns)
      currentSummaryIndex: 0,
      flashcards: null, // String en formato TSV o un array de objetos flashcard

      reset: () => set({
        files: [],
        inputText: '',
        summaries: [],
        currentSummaryIndex: 0,
        flashcards: null,
      }),
      // ... otras acciones
    }),
    {
      name: 'StudyApp-upload-store', // Nombre único para localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
);
```

## Internacionalización

- Utiliza `next-intl`.
- Archivos de mensajes en `/messages/{locale}/messages.json`.
- Uso de `useTranslations()` hook en componentes.
  ```typescript
  // Ejemplo en un componente
  import { useTranslations } from 'next-intl';
  // ...
  const t = useTranslations('upload'); // 'upload' es un namespace en messages.json
  // ...
  // <Button>{t('process')}</Button>
  ```

## Manejo de Errores
- **Errores de API Key**:
  - Clave no configurada: Mensaje y guía a Settings (ej. `t('settings.apiKey.missing')`).
  - Clave inválida (detectada por el backend): Mensaje específico (ej. `t('upload.toast.invalidApiKey')` o `t('toast.apiKeyError')`).
- **Errores de Procesamiento (Backend)**:
  - Cuota excedida: `t('toast.quotaExceeded')`.
  - Errores de red: `t('toast.networkError')`.
  - Otros errores del API de Gemini: Mensaje genérico de error del servidor.
- **Validaciones del Frontend**:
  - Tipo/tamaño de archivo: `t('upload.validation.invalidFileType')`, `t('upload.validation.fileTooLarge')`.
  - Contenido vacío: `t('upload.validation.noContent')`.
- Notificaciones de error usando Toasts (Sonner) con mensajes internacionalizados.

## Mejores Prácticas y Consideraciones de Escalabilidad
- **Seguridad**: API key solo en cliente (localStorage), transmitida por HTTPS.
- **Rendimiento**: Indicadores de carga, procesamiento asíncrono.
- **Escalabilidad**: Arquitectura modular.
- **Futuras Mejoras**: Autenticación de usuarios, más opciones de exportación, etc.