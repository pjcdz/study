# StudyApp - Documentación del Flujo de Trabajo

## Índice
1. [Introducción](#introducción)
2. [Requisitos Técnicos](#requisitos-técnicos)
3. [Arquitectura](#arquitectura)
4. [Flujo de Usuario](#flujo-de-usuario)
   - [1. Acceso inicial a `/upload` y validación de API](#1-acceso-inicial-a-upload-y-validación-de-api)
   - [2. Configuración de la API en `/api`](#2-configuración-de-la-api-en-api)
   - [3. Subida y procesamiento de archivos en `/upload`](#3-subida-y-procesamiento-de-archivos-en-upload)
   - [4. Pantalla de resumen en `/summary`](#4-pantalla-de-resumen-en-summary)
   - [5. Generación de flashcards y reinicio en `/flashcards`](#5-generación-de-flashcards-y-reinicio-en-flashcards)
5. [Componentes Principales](#componentes-principales)
6. [Almacenamiento de Estado](#almacenamiento-de-estado)
7. [Internacionalización](#internacionalización)
8. [Manejo de Errores](#manejo-de-errores)
9. [Mejores Prácticas y Consideraciones de Escalabilidad](#mejores-prácticas-y-consideraciones-de-escalabilidad)

## Introducción

StudyApp es una aplicación que permite a los usuarios procesar documentos (PDF, imágenes) o texto para generar resúmenes y flashcards de estudio utilizando la API de Google Gemini. La aplicación está diseñada para ser multimodal, permitiendo el procesamiento de diferentes tipos de contenido.

Esta documentación describe el flujo de trabajo completo de la aplicación, desde la configuración inicial hasta la generación de flashcards, para ayudar a desarrolladores a entender cómo funciona la aplicación y cómo pueden mantenerla o extenderla.

## Requisitos Técnicos

- **Frontend**: Next.js 15.x, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Node.js, Express.js
- **API Externa**: Google Gemini 1.5 Pro para procesamiento de IA
- **Almacenamiento**: LocalStorage (frontend) para API keys y estado de la aplicación
- **Contenedores**: Docker para desarrollo y producción

## Arquitectura

La aplicación sigue una arquitectura cliente-servidor:

- **Frontend** (Next.js): Gestiona la interfaz de usuario, la navegación y almacena temporalmente los datos del usuario.
- **Backend** (Express): Procesa las solicitudes, se comunica con la API de Gemini y devuelve los resultados al frontend.

### Estructura de Directorios

```
frontend/
├── app/                       # Páginas y rutas de Next.js
│   └── [locale]/              # Rutas localizadas (es/en)
│       ├── api/               # Página de configuración de API key
│       ├── upload/            # Página de subida de archivos
│       ├── summary/           # Página de resumen
│       └── flashcards/        # Página de flashcards
├── components/                # Componentes reutilizables
├── lib/                       # Utilidades y hooks personalizados
│   └── hooks/                 # Hooks como useApiKey, useProcessingTimer
├── messages/                  # Archivos de internacionalización
├── store/                     # Gestión de estado (Zustand)
└── docs/                      # Documentación (este archivo)

backend/
├── src/
│   ├── controllers/           # Controladores para las diferentes funcionalidades
│   ├── services/              # Servicios, incluido geminiClient.js
│   └── config/                # Configuraciones, incluyendo prompts
└── docs/                      # Documentación del backend
```

## Flujo de Usuario

### 1. Acceso inicial a `/upload` y validación de API

**User Story**:

> **As a** new user  
> **I want** to land on the upload page (`/upload`)  
> **so that** I can immediately see dónde subir mi documento.

**Comportamiento Esperado**:

- Al entrar a `/upload`, el sistema comprueba si existe una API key guardada.
- Si no hay API key configurada:
  - Muestra un diálogo modal con el mensaje "No puedes subir un archivo sin configurar tu API primero".
  - Al confirmar el diálogo, redirige a `/api`.
- Si hay API key configurada:
  - Permite permanecer en `/upload` sin interrupciones.

**Implementación Técnica**:

```typescript
// El hook useApiKey maneja la verificación de la API key
const { isAvailable, isLoading, isMounted } = useApiKey()

// En la página de upload, verificamos si la API key está disponible
useEffect(() => {
  if (isApiKeyLoading || !isMounted) return;
  
  if (!isAvailable) {
    setShowApiKeyDialog(true)
  }
}, [isAvailable, isApiKeyLoading, isMounted]);
```

### 2. Configuración de la API en `/api`

**User Story**:

> **As a** user without an API key  
> **I want** to be redirigido a la página de configuración (`/api`)  
> **so that** pueda ingresar y guardar mi clave.

**Comportamiento Esperado**:

- La ruta `/api` muestra un formulario para ingresar la API key.
- Tras pulsar "Guardar" y validar la clave:
  - Almacena la API key en local storage.
  - Redirige a `/upload`.
- Si el usuario intenta forzar manualmente `/upload` sin haber guardado la clave:
  - Muestra un popup modal con el mensaje "No puedes subir un archivo sin configurar tu API primero".
  - Impide la subida de archivos.

**Implementación Técnica**:

```typescript
// Guardar la API key
const handleSaveApiKey = async () => {
  if (!apiKey.trim()) {
    toast.error(t('errors.emptyKey'))
    return
  }
  
  try {
    // Guardar API key y mostrar estados de carga
    await saveApiKey(apiKey)
    toast.success(t('success.keySaved'))
    
    // Redireccionar a la página de upload
    const locale = pathname.split('/')[1]
    router.push(`/${locale}/upload`)
  } catch (error) {
    // Manejo de errores
  }
}
```

### 3. Subida y procesamiento de archivos en `/upload`

**User Story**:

> **As a** user con API key configurada  
> **I want** subir un PDF o imagen desde `/upload`  
> **so that** el sistema procese el contenido y me muestre un resumen.

**Comportamiento Esperado**:

- La UI de `/upload` permite seleccionar y subir un archivo.
- Aparece un botón **Process** activado solo tras seleccionar un archivo válido.
- Al clicar **Process**:
  - Se envía el archivo al servidor.
  - Durante el procesamiento, muestra un spinner o barra de progreso.
  - Al completarse, redirige automáticamente a `/summary`.

**Implementación Técnica**:

- Componente `FileDropzone` para la selección de archivos
- Validaciones para tipos de archivo y tamaño máximo
- Procesador para extraer texto de PDFs usando PDF.js
- Manejo del estado de carga con `useProcessingTimer`

```typescript
const handleSubmit = async () => {
  try {
    // Validaciones...
    
    // Iniciar procesamiento y mostrar timer
    startProcessing();
    setCurrentStep('upload');
    
    // Procesar archivos PDF si los hay
    // Combinar texto y enviar la solicitud
    const response = await apiClient.processSummary(contentToSend);
    
    // Guardar resumen y redirigir a summary
    addSummary(response.notionMarkdown);
    router.push('./summary');
  } catch (error) {
    // Manejo de errores...
  }
}
```

### 4. Pantalla de resumen en `/summary`

**User Story**:

> **As a** user que acaba de subir un documento  
> **I want** ver una primera versión del resumen  
> **so that** pueda decidir si quiero condensarlo más o generar flashcards.

**Comportamiento Esperado**:

- Al llegar, muestra la **V1** del resumen sin indicador de paginación (`<1/1>`).
- Botones disponibles:
  - **Condense more**
  - **Generate flashcards**
- **Condense more**:
  1. Genera la **V2** y actualiza el indicador a `<2/2>`.
  2. Pulsarlo de nuevo genera la **V3** con `<3/3>`.
  3. Permite navegar retrospectivamente entre V1, V2 y V3.
  4. Cada versión se guarda en local storage para persistencia.
- **Generate flashcards**:
  - No modifica el resumen.
  - Inicia la creación de tarjetas y redirige a `/flashcards`.

**Implementación Técnica**:

- Gestión de versiones múltiples en el estado
- Controles de navegación para cambiar entre versiones
- Límite de tres versiones de resumen
- Persistencia en localStorage (useUploadStore)

```typescript
// Condensar más el resumen
const handleCondenseSummary = async () => {
  try {
    // Limitar a 3 versiones
    if (summaries.length >= 3) {
      toast.info(t('toast.maxVersionsReached'))
      return
    }
    
    // Procesar resumen...
    const response = await apiClient.condenseSummary(currentSummary);
    
    // Añadir nueva versión y actualizar índice
    addSummary(response.condensedSummary);
    setCurrentSummaryIndex(summaries.length);
  } catch (error) {
    // Manejo de errores...
  }
}
```

### 5. Generación de flashcards y reinicio en `/flashcards`

**User Story**:

> **As a** user que desea repasar el contenido  
> **I want** ver mis flashcards generadas  
> **so that** pueda estudiar directamente sin salir de la app.

**Comportamiento Esperado**:

- `/flashcards` muestra la lista de tarjetas generadas con título y contenido.
- Incluye un botón **Start Over**:
  - Al pulsarlo, elimina de local storage todos los resúmenes y flashcards previos.
  - Redirige a `/upload` para iniciar un nuevo flujo de subida y procesamiento.

**Implementación Técnica**:

- Formateo de flashcards para importación a Quizlet (formato TSV)
- Botón de copia al portapapeles
- Diálogo de confirmación antes de eliminar datos
- Reinicio completo de estado y localStorage

```typescript
// En el diálogo de confirmación
<AlertDialogAction onClick={() => {
  // Reset app state
  reset()
  
  // Limpiar localStorage
  localStorage.removeItem('studyToolSummaries')
  localStorage.removeItem('studyToolFlashcards')
  localStorage.removeItem('studyToolCurrentStep')
  localStorage.removeItem('studyToolCurrentSummaryIndex')
  
  // Redireccionar a upload
  router.push(`/${locale}/upload`)
}}>
```

## Componentes Principales

### Hooks Personalizados

#### useApiKey

Este hook gestiona la API key del usuario:
- Carga la API key desde localStorage
- Proporciona métodos para guardar, obtener y limpiar la API key
- Verifica si la API key está disponible
- Devuelve el estado de carga

```typescript
// lib/hooks/useApiKey.ts
export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  // Cargar la API key del localStorage
  useEffect(() => {
    // ...implementación...
  }, [])

  // Métodos para guardar, obtener y limpiar la API key
  const saveApiKey = useCallback((key: string): Promise<boolean> => {
    // ...implementación...
  }, [])

  const getApiKey = useCallback(() => {
    // ...implementación...
  }, [])

  const clearApiKey = useCallback((): Promise<boolean> => {
    // ...implementación...
  }, [])

  return { 
    apiKey,
    isAvailable,
    isLoading,
    saveApiKey,
    getApiKey,
    clearApiKey
  }
}
```

#### useProcessingTimer

Este hook maneja el temporizador durante el procesamiento:
- Muestra el tiempo transcurrido durante operaciones largas
- Proporciona estados de carga
- Permite iniciar y detener el temporizador

```typescript
// lib/hooks/useProcessingTimer.ts
export function useProcessingTimer() {
  const [isLoading, setIsLoading] = useState(false)
  const [seconds, setSeconds] = useState(0)
  // ...implementación...
}
```

### Componentes de UI

#### FileDropzone

Permite arrastrar y soltar archivos o seleccionarlos desde el explorador.
- Validación de tipos de archivo permitidos
- Validación de tamaño máximo
- Feedback visual durante el arrastre

#### FileList

Muestra la lista de archivos seleccionados y permite eliminarlos.

#### Modal API Key

Diálogo que se muestra cuando no hay API key configurada.

## Almacenamiento de Estado

La aplicación utiliza Zustand para gestionar el estado global.

### useUploadStore

Este store maneja:
- Los archivos seleccionados
- El texto ingresado
- Los resúmenes generados (múltiples versiones)
- Las flashcards generadas
- El paso actual del flujo (upload, summary, flashcards)
- El índice del resumen actual

```typescript
// store/use-upload-store.ts
export const useUploadStore = create<UploadState>()(
  persist(
    (set, get) => ({
      files: [],
      originalFiles: [],
      inputText: '',
      summaries: [],
      currentSummaryIndex: 0,
      flashcards: null,
      currentStep: 'upload',
      
      // Métodos para manipular el estado...
      
      reset: () => set({
        files: [],
        originalFiles: [],
        inputText: '',
        summaries: [],
        currentSummaryIndex: 0,
        flashcards: null,
        currentStep: 'upload'
      })
    }),
    {
      name: 'upload-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
```

## Internacionalización

La aplicación soporta múltiples idiomas usando Next-Intl.

### Estructura

- `/messages/en/messages.json` - Traducciones en inglés
- `/messages/es/messages.json` - Traducciones en español

### Uso

```typescript
// En componentes
const t = useTranslations('namespace')
t('key.subkey')

// En rutas dinámicas
const locale = pathname.split('/')[1]
router.push(`/${locale}/route`)
```

## Manejo de Errores

La aplicación maneja varios tipos de errores:

### Errores de API Key

- API key no configurada: redirección a `/api`
- API key inválida: mensaje de error y opción para corregir

### Errores de Procesamiento

- Errores de red: mensajes específicos con recomendaciones
- Cuotas excedidas: mensajes informativos
- Errores de formato o tipo de archivo: validaciones preventivas

### Implementación

```typescript
try {
  // Operación que puede fallar
} catch (error) {
  if (error instanceof ApiError) {
    switch(error.type) {
      case 'QUOTA_EXCEEDED':
        // Manejar error de cuota
        break;
      case 'INVALID_API_KEY':
        // Manejar error de API key
        break;
      // Otros casos...
    }
  } else {
    // Manejar errores genéricos
  }
}
```

## Mejores Prácticas y Consideraciones de Escalabilidad

### Seguridad

- La API key se almacena solo en el cliente (localStorage)
- Se envía al backend en cada solicitud a través de headers
- No se almacena en el backend

### Rendimiento

- Procesamiento asíncrono para archivos grandes
- Indicadores visuales durante operaciones largas
- Lazy loading de componentes pesados

### Escalabilidad

- Arquitectura modular para facilitar extensiones
- Separación clara entre frontend y backend
- Containerización para despliegue consistente

### Futuras Mejoras

- Autenticación de usuarios para guardar resúmenes y flashcards en la nube
- Más opciones de exportación para flashcards
- Soporte para más tipos de archivo
- Mejoras en la extracción de texto de PDFs complejos
- Opciones de personalización de resúmenes