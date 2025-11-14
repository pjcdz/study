# Design Document: Docker to Next.js Migration

## Overview

Esta migración transforma Study App de una arquitectura multi-contenedor con Docker (backend Express + frontend Next.js) a una aplicación Next.js monolítica integral. El objetivo es simplificar el desarrollo, deployment y mantenimiento eliminando la complejidad de Docker mientras se mantiene toda la funcionalidad existente.

### Current Architecture

```
study-app/
├── backend/                    # Express.js server
│   ├── src/
│   │   ├── app.js             # Main Express app
│   │   ├── controllers/       # API controllers
│   │   ├── services/          # Business logic (Gemini AI)
│   │   └── config/            # Prompts and configuration
│   ├── Dockerfile
│   └── package.json
├── frontend/                   # Next.js app
│   ├── app/                   # Next.js app directory
│   │   ├── api/              # Proxy routes to backend
│   │   └── [locale]/         # Internationalized pages
│   ├── components/
│   ├── lib/
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yaml        # Orchestration
```

### Target Architecture

```
study-app/
├── app/                       # Next.js app directory (consolidated)
│   ├── api/                  # Next.js API Routes (replaces Express)
│   │   ├── summary/
│   │   │   ├── route.ts     # Direct implementation
│   │   │   └── condense/
│   │   │       └── route.ts
│   │   ├── flashcards/
│   │   │   └── route.ts
│   │   └── files/
│   │       └── status/
│   │           └── route.ts
│   └── [locale]/             # Internationalized pages
├── components/               # UI components
├── lib/                      # Utilities and services
│   ├── services/            # Gemini AI integration (from backend)
│   ├── config/              # Configuration (from backend)
│   └── types/               # TypeScript types
├── public/                   # Static assets
├── next.config.js           # Next.js configuration
├── package.json             # Consolidated dependencies
└── .env.local              # Environment variables
```

## Architecture

### Migration Strategy

La migración sigue un enfoque de **consolidación progresiva**:

1. **Phase 1: Structure Consolidation** - Mover archivos del frontend al root
2. **Phase 2: Backend Integration** - Migrar servicios y lógica de negocio
3. **Phase 3: API Routes Conversion** - Convertir Express endpoints a Next.js API Routes
4. **Phase 4: Cleanup** - Eliminar archivos de Docker y carpetas antiguas
5. **Phase 5: Documentation** - Actualizar toda la documentación

### Key Design Decisions

#### 1. Next.js API Routes vs Express

**Decision**: Usar Next.js API Routes nativas en lugar de mantener Express

**Rationale**:
- Simplifica el stack tecnológico (un solo framework)
- Elimina la necesidad de proxy entre frontend y backend
- Mejor integración con el sistema de build de Next.js
- Soporte nativo para TypeScript
- Deployment más simple (un solo proceso)

**Trade-offs**:
- Necesidad de adaptar middleware de Express a Next.js
- Cambio en el manejo de file uploads (multer → FormData nativo)

#### 2. File Upload Handling

**Decision**: Usar FormData nativo de Next.js en lugar de multer

**Rationale**:
- Next.js 14+ tiene soporte nativo para FormData en API Routes
- Elimina dependencia de multer
- Más simple y directo

**Implementation**:
```typescript
// Next.js API Route
export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File;
  const buffer = Buffer.from(await file.arrayBuffer());
  // Process buffer...
}
```

#### 3. Service Layer Architecture

**Decision**: Mantener la capa de servicios del backend en `lib/services/`

**Rationale**:
- Separación de concerns (API routes vs business logic)
- Reutilización de código
- Facilita testing
- Mantiene la lógica de integración con Gemini AI intacta

#### 4. Environment Variables

**Decision**: Consolidar en `.env.local` con prefijos `NEXT_PUBLIC_` para variables del cliente

**Rationale**:
- Next.js tiene convenciones claras para variables de entorno
- `NEXT_PUBLIC_` expone variables al cliente de forma segura
- Variables sin prefijo solo están disponibles en el servidor

**Configuration**:
```env
# Server-side only
GEMINI_API_KEY=...
SENTRY_DSN=...

# Client-side accessible
NEXT_PUBLIC_APP_URL=...
NEXT_PUBLIC_ENABLE_ANALYTICS=...
```

## Components and Interfaces

### API Routes Structure

#### 1. Summary API Route (`app/api/summary/route.ts`)

**Purpose**: Generar resúmenes detallados usando Gemini AI

**Interface**:
```typescript
// Request
POST /api/summary
Headers: {
  'X-User-API-Key': string
}
Body: FormData {
  textPrompt?: string
  files?: File[]
}

// Response
{
  notionMarkdown: string
  stats: {
    generationTimeMs: number
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

// Error Response
{
  error: string
  errorType: 'INVALID_API_KEY' | 'QUOTA_EXCEEDED' | 'FILE_TOO_LARGE' | 'UNKNOWN_ERROR'
}
```

**Implementation Strategy**:
- Extraer FormData del request
- Validar API key del header
- Procesar archivos (PDF/imágenes) a buffers
- Llamar al servicio de Gemini con multimodal content
- Retornar markdown formateado

#### 2. Condense Summary API Route (`app/api/summary/condense/route.ts`)

**Purpose**: Condensar o mejorar resúmenes existentes

**Interface**:
```typescript
// Request
POST /api/summary/condense
Headers: {
  'X-User-API-Key': string
}
Body: {
  markdownContent: string
  condensationType: 'shorter' | 'clarity' | 'examples'
}

// Response
{
  notionMarkdown: string
  stats: {
    generationTimeMs: number
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}
```

**Implementation Strategy**:
- Recibir markdown content y tipo de condensación
- Construir prompt específico según el tipo
- Llamar a Gemini con el prompt y contenido
- Retornar markdown condensado

#### 3. Flashcards API Route (`app/api/flashcards/route.ts`)

**Purpose**: Generar flashcards en formato TSV para Quizlet

**Interface**:
```typescript
// Request
POST /api/flashcards
Headers: {
  'X-User-API-Key': string
}
Body: FormData {
  textPrompt?: string
  file?: File
}

// Response
{
  flashcards: string  // TSV format
  stats: {
    generationTimeMs: number
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}
```

**Implementation Strategy**:
- Similar a summary pero con prompt diferente
- Generar formato TSV (tab-separated values)
- Validar formato de salida

#### 4. File Status API Route (`app/api/files/status/route.ts`)

**Purpose**: Obtener estado de archivos en procesamiento

**Interface**:
```typescript
// Request
GET /api/files/status
Headers: {
  'X-User-API-Key': string
}

// Response
{
  fileStatus: {
    [fileId: string]: {
      status: 'processing' | 'ready' | 'error'
      progress?: number
    }
  }
}
```

### Service Layer

#### 1. Gemini Client Service (`lib/services/geminiClient.ts`)

**Purpose**: Interfaz con la API de Gemini AI

**Key Functions**:
```typescript
// Generate multimodal content (text + files)
export async function generateMultimodalContent(
  apiKey: string,
  parts: Array<{text?: string, fileData?: FileData}>,
  systemInstruction: string
): Promise<{generatedText: string, stats: Stats}>

// Process file for Gemini (upload large files)
export async function processFileForGemini(
  buffer: Buffer,
  mimeType: string,
  apiKey: string,
  filename: string
): Promise<FilePart>

// Convert file to inline data part
export function fileToGenerativePart(
  buffer: Buffer,
  mimeType: string
): InlineDataPart

// Cleanup uploaded files
export async function cleanupFile(
  fileId: string,
  apiKey: string
): Promise<void>
```

**Migration Notes**:
- Convertir de ES modules a TypeScript
- Mantener toda la lógica de manejo de archivos grandes
- Preservar error handling y tipos de error
- Adaptar imports para Next.js

#### 2. Session Manager Service (`lib/services/sessionManager.ts`)

**Purpose**: Gestionar estado de archivos por usuario

**Key Functions**:
```typescript
export class SessionManager {
  // Track file status for a user
  setFileStatus(apiKey: string, fileId: string, status: FileStatus): void
  
  // Get all file statuses for a user
  getFileStatus(apiKey: string): Record<string, FileStatus>
  
  // Clean up old sessions
  cleanup(): void
}
```

#### 3. Prompts Configuration (`lib/config/prompts.ts`)

**Purpose**: Almacenar prompts del sistema para Gemini

**Structure**:
```typescript
export const prompts = {
  notionPrompt: string,      // Prompt para generar resúmenes
  flashcardPrompt: string    // Prompt para generar flashcards
}
```

**Migration Notes**:
- Convertir de `.js` a `.ts`
- Mantener los prompts exactamente como están
- Exportar como constantes tipadas

## Data Models

### TypeScript Types and Interfaces

#### API Types

```typescript
// lib/types/api.ts

export interface SummaryRequest {
  textPrompt?: string
  files?: File[]
}

export interface SummaryResponse {
  notionMarkdown: string
  stats: GenerationStats
}

export interface CondenseRequest {
  markdownContent: string
  condensationType: 'shorter' | 'clarity' | 'examples'
}

export interface FlashcardsRequest {
  textPrompt?: string
  file?: File
}

export interface FlashcardsResponse {
  flashcards: string
  stats: GenerationStats
}

export interface GenerationStats {
  generationTimeMs: number
  inputTokens: number
  outputTokens: number
  totalTokens: number
}

export interface ApiError {
  error: string
  errorType: ErrorType
  stack?: string
}

export type ErrorType = 
  | 'INVALID_API_KEY'
  | 'QUOTA_EXCEEDED'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FILE_TYPE'
  | 'UNKNOWN_ERROR'
```

#### Gemini Service Types

```typescript
// lib/types/gemini.ts

export interface GeminiPart {
  text?: string
  inlineData?: {
    mimeType: string
    data: string  // base64
  }
  fileData?: {
    mimeType: string
    fileUri: string
  }
}

export interface FileProcessingResult {
  fileId?: string
  part: GeminiPart
}

export interface GeminiResponse {
  generatedText: string
  stats: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
  }
}

export interface FileStatus {
  status: 'processing' | 'ready' | 'error'
  progress?: number
  error?: string
}
```

### File Upload Limits

```typescript
// lib/config/limits.ts

export const FILE_LIMITS = {
  MAX_FILE_SIZE: 20 * 1024 * 1024,        // 20MB
  MAX_INLINE_FILE_SIZE: 4 * 1024 * 1024,  // 4MB (inline vs upload)
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
}
```

## Error Handling

### Error Types and Handling Strategy

#### 1. API Key Validation

```typescript
// Middleware pattern for API routes
function validateApiKey(request: NextRequest): string | null {
  const apiKey = request.headers.get('X-User-API-Key')
  if (!apiKey) {
    return null
  }
  return apiKey
}

// Usage in API route
export async function POST(request: NextRequest) {
  const apiKey = validateApiKey(request)
  if (!apiKey) {
    return NextResponse.json(
      { error: 'API Key no proporcionada', errorType: 'INVALID_API_KEY' },
      { status: 401 }
    )
  }
  // Continue...
}
```

#### 2. File Upload Errors

```typescript
// Validate file type and size
function validateFile(file: File): { valid: boolean, error?: ApiError } {
  if (!FILE_LIMITS.ALLOWED_MIME_TYPES.includes(file.type)) {
    return {
      valid: false,
      error: {
        error: `Tipo de archivo no soportado: ${file.type}`,
        errorType: 'UNSUPPORTED_FILE_TYPE'
      }
    }
  }
  
  if (file.size > FILE_LIMITS.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: {
        error: `Archivo demasiado grande: ${Math.round(file.size / 1024 / 1024)}MB`,
        errorType: 'FILE_TOO_LARGE'
      }
    }
  }
  
  return { valid: true }
}
```

#### 3. Gemini API Errors

```typescript
// Error mapping from Gemini API
function mapGeminiError(error: any): ApiError {
  if (error.message?.includes('API key')) {
    return {
      error: 'API Key inválida o no autorizada',
      errorType: 'INVALID_API_KEY'
    }
  }
  
  if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
    return {
      error: 'Cuota de API excedida. Por favor intenta más tarde.',
      errorType: 'QUOTA_EXCEEDED'
    }
  }
  
  return {
    error: error.message || 'Error desconocido',
    errorType: 'UNKNOWN_ERROR'
  }
}
```

#### 4. Cleanup on Error

```typescript
// Pattern for cleaning up uploaded files on error
async function processWithCleanup<T>(
  apiKey: string,
  uploadedFileIds: string[],
  operation: () => Promise<T>
): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    // Cleanup uploaded files
    console.log(`Cleaning up ${uploadedFileIds.length} files due to error`)
    await Promise.all(
      uploadedFileIds.map(fileId =>
        cleanupFile(fileId, apiKey).catch(err =>
          console.log(`Non-critical cleanup error: ${err.message}`)
        )
      )
    )
    throw error
  }
}
```

## Validation Strategy

### Post-Migration Manual Validation

**Purpose**: Verificar que toda la funcionalidad existente sigue funcionando después de la migración

**Validation Checklist**:
- [ ] Upload de PDF genera resumen correcto
- [ ] Upload de imagen genera resumen correcto
- [ ] Upload múltiple funciona
- [ ] Condensación de resumen funciona
- [ ] Generación de flashcards funciona
- [ ] Cambio de idioma funciona (ES/EN)
- [ ] Tema dark/light funciona
- [ ] Manejo de errores muestra mensajes correctos
- [ ] Performance es comparable o mejor

**Note**: No se agregarán nuevos tests como parte de esta migración. Solo se verificará que la funcionalidad existente continúa funcionando.

## Migration Execution Plan

### Phase 1: Structure Consolidation

**Goal**: Mover archivos del frontend al root

**Steps**:
1. Mover `frontend/app/` → `app/`
2. Mover `frontend/components/` → `components/` (merge con existente)
3. Mover `frontend/lib/` → `lib/` (merge con existente)
4. Mover `frontend/public/` → `public/` (merge con existente)
5. Mover `frontend/i18n/` → `i18n/` (merge con existente)
6. Mover `frontend/messages/` → `messages/` (merge con existente)
7. Mover `frontend/store/` → `store/` (merge con existente)
8. Mover archivos de configuración:
   - `frontend/next.config.js` → `next.config.js` (merge)
   - `frontend/tailwind.config.ts` → `tailwind.config.ts` (merge)
   - `frontend/tsconfig.json` → `tsconfig.json` (merge)
   - `frontend/postcss.config.mjs` → `postcss.config.mjs`
   - `frontend/.eslintrc.js` → `.eslintrc.js`

**Validation**:
- Verificar que no hay imports rotos
- Ejecutar `npm run build` exitosamente

### Phase 2: Backend Integration

**Goal**: Migrar servicios y configuración del backend

**Steps**:
1. Crear `lib/services/` si no existe
2. Migrar `backend/src/services/geminiClient.js` → `lib/services/geminiClient.ts`
   - Convertir a TypeScript
   - Adaptar imports
   - Mantener toda la lógica
3. Migrar `backend/src/services/sessionManager.js` → `lib/services/sessionManager.ts`
4. Migrar `backend/src/services/gemini-pdf-client.js` → `lib/services/gemini-pdf-client.ts`
5. Crear `lib/config/` si no existe
6. Migrar `backend/src/config/prompts.js` → `lib/config/prompts.ts`
7. Crear tipos en `lib/types/`:
   - `api.ts` - Tipos de API
   - `gemini.ts` - Tipos de Gemini
8. Consolidar dependencias en `package.json` root

**Validation**:
- Compilación TypeScript sin errores
- Imports resuelven correctamente
- `npm run build` ejecuta sin errores

### Phase 3: API Routes Conversion

**Goal**: Convertir Express endpoints a Next.js API Routes

**Steps**:
1. Actualizar `app/api/summary/route.ts`:
   - Eliminar proxy al backend
   - Implementar lógica directa usando servicios migrados
   - Manejar FormData nativamente
   - Implementar validación de API key
   - Implementar error handling

2. Actualizar `app/api/summary/condense/route.ts`:
   - Eliminar proxy al backend
   - Implementar lógica de condensación
   - Usar servicio de Gemini directamente

3. Actualizar `app/api/flashcards/route.ts`:
   - Eliminar proxy al backend
   - Implementar generación de flashcards
   - Manejar file upload

4. Crear `app/api/files/status/route.ts`:
   - Implementar endpoint de status
   - Usar sessionManager

**Validation**:
- Cada endpoint responde correctamente
- File uploads funcionan
- Error handling funciona
- API key validation funciona

### Phase 4: Environment Variables

**Goal**: Consolidar configuración

**Steps**:
1. Crear `.env.local` en root
2. Migrar variables del backend:
   ```env
   GEMINI_API_KEY=...
   ```
3. Migrar variables del frontend:
   ```env
   NEXT_PUBLIC_APP_URL=...
   SENTRY_DSN=...
   SENTRY_ORG=...
   SENTRY_PROJECT=...
   ```
4. Actualizar referencias en código
5. Crear `.env.example` con template

**Validation**:
- Variables se leen correctamente
- No hay variables hardcodeadas

### Phase 5: Scripts Update

**Goal**: Actualizar package.json scripts

**Steps**:
1. Actualizar scripts en `package.json`:
   ```json
   {
     "scripts": {
       "dev": "next dev",
       "build": "next build",
       "start": "next start",
       "lint": "next lint"
     }
   }
   ```
2. Eliminar scripts de Docker
3. Actualizar README con nuevos comandos

**Validation**:
- `npm run dev` inicia la app
- `npm run build` compila sin errores
- `npm run start` sirve la app compilada

### Phase 6: Cleanup

**Goal**: Eliminar archivos obsoletos

**Steps**:
1. Eliminar `docker-compose.yaml`
2. Eliminar `docker-stack.yml`
3. Eliminar `optimize-docker.sh`
4. Eliminar carpeta `backend/` completa
5. Eliminar carpeta `frontend/` completa
6. Eliminar archivos `.dockerignore`

**Validation**:
- No quedan referencias a Docker
- Proyecto compila y funciona

### Phase 7: Documentation

**Goal**: Actualizar toda la documentación

**Steps**:
1. Actualizar `README.md` principal:
   - Eliminar sección de Docker
   - Documentar nuevos comandos
   - Actualizar instrucciones de setup
   - Documentar estructura de carpetas
2. Consolidar docs de `frontend/docs/` y `backend/docs/` en `docs/`
3. Crear `docs/ARCHITECTURE.md` con nueva arquitectura
4. Crear `docs/API.md` con documentación de API Routes
5. Actualizar `docs/DEVELOPMENT.md` con workflow sin Docker

**Validation**:
- Documentación es clara y completa
- No hay referencias a Docker
- Instrucciones son correctas

## Rollback Strategy

En caso de problemas durante la migración:

### Backup Strategy

1. **Git Branch**: Crear branch `migration/docker-to-nextjs` antes de empezar
2. **Tag**: Crear tag `pre-migration` en el commit actual
3. **Backup Manual**: Copiar carpetas `backend/` y `frontend/` fuera del repo

### Rollback Steps

Si algo falla:
1. `git checkout main` (o branch anterior)
2. `git reset --hard pre-migration`
3. Restaurar `.env` files si es necesario
4. `docker-compose up --build`

### Validation Checkpoints

Después de cada fase, validar:
- [ ] La app compila sin errores (`npm run build`)
- [ ] La app inicia correctamente (`npm run dev`)
- [ ] La funcionalidad básica funciona (verificación manual)

Si algún checkpoint falla, hacer rollback de esa fase antes de continuar.

## Performance Considerations

### Expected Improvements

1. **Startup Time**: Sin Docker, el tiempo de inicio debería reducirse significativamente
2. **Hot Reload**: Next.js Fast Refresh será más rápido sin overhead de Docker
3. **Build Time**: Un solo build process en lugar de dos

### Potential Issues

1. **Memory Usage**: Todo en un proceso puede usar más memoria
   - **Mitigation**: Monitorear y ajustar si es necesario

2. **File Upload Size**: Next.js tiene límites por defecto
   - **Mitigation**: Configurar en `next.config.js`:
   ```javascript
   module.exports = {
     api: {
       bodyParser: {
         sizeLimit: '20mb'
       }
     }
   }
   ```

## Security Considerations

### API Key Handling

- API keys del usuario se envían en headers (X-User-API-Key)
- Nunca se almacenan en el servidor
- Se validan en cada request

### File Upload Security

- Validación de tipo MIME
- Límite de tamaño de archivo
- Sanitización de nombres de archivo
- Buffers se limpian después de procesamiento

### Environment Variables

- Variables sensibles (GEMINI_API_KEY) solo en servidor
- Variables del cliente usan prefijo NEXT_PUBLIC_
- Nunca commitear .env.local

## Deployment Considerations

### Vercel Deployment

La nueva arquitectura es ideal para Vercel:

```javascript
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"]
}
```

### Environment Variables in Production

Configurar en Vercel dashboard:
- `GEMINI_API_KEY` (secret)
- `SENTRY_DSN`
- `NEXT_PUBLIC_APP_URL`

### Build Configuration

```javascript
// next.config.js
module.exports = {
  output: 'standalone',  // Para deployment optimizado
  api: {
    bodyParser: {
      sizeLimit: '20mb'
    }
  }
}
```

## Success Criteria

La migración se considera exitosa cuando:

1. ✅ Toda la funcionalidad existente funciona correctamente
2. ✅ No hay archivos o referencias a Docker
3. ✅ La aplicación se ejecuta con `npm run dev`
4. ✅ El build se completa sin errores
5. ✅ Todos los tests pasan
6. ✅ La documentación está actualizada
7. ✅ El performance es igual o mejor que antes
8. ✅ El deployment es más simple que antes
