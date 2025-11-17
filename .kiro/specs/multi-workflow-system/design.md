# Design Document: Multi-Workflow System

## Overview

El sistema de workflows múltiples permite a los usuarios procesar varios documentos simultáneamente a través de un pipeline de tres etapas: extracción de contenido, generación de resumen y creación de flashcards. El diseño se integra con la arquitectura existente de la aplicación, extendiendo el store de Zustand actual y creando nuevos componentes de UI que siguen el estilo visual de la app.

### Key Design Principles

1. **Procesamiento Secuencial**: Los workflows se procesan uno a la vez para evitar sobrecarga del API de Gemini
2. **Estado Persistente**: Todo el estado se persiste en localStorage para sobrevivir recargas del navegador
3. **UI Reactiva**: La interfaz se actualiza en tiempo real conforme cambian los estados
4. **Manejo Robusto de Errores**: Cada etapa puede fallar independientemente con opciones de reintento
5. **Integración con Sistema Existente**: Reutiliza componentes, servicios y patrones existentes

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Workflow Page                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │         WorkflowManager Component                      │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  WorkflowCard (Document 1)                       │  │  │
│  │  │    ├─ StageCard (Contenido)                      │  │  │
│  │  │    ├─ StageCard (Resumen)                        │  │  │
│  │  │    └─ StageCard (Flashcards)                     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  WorkflowCard (Document 2)                       │  │  │
│  │  │    ├─ StageCard (Contenido)                      │  │  │
│  │  │    ├─ StageCard (Resumen)                        │  │  │
│  │  │    └─ StageCard (Flashcards)                     │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              useWorkflowStore (Zustand)                      │
│  - workflows: WorkflowState[]                                │
│  - activeWorkflowId: string | null                           │
│  - isPaused: boolean                                         │
│  - Actions: addWorkflow, updateStage, processNext, etc.      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│              WorkflowProcessor Service                       │
│  - processWorkflow(workflowId)                               │
│  - processStage(workflowId, stage)                           │
│  - retryStage(workflowId, stage)                             │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│                   API Client                                 │
│  - processSummary()                                          │
│  - processFlashcards()                                       │
│  - extractContent()  [NEW]                                   │
└─────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Data Models

#### WorkflowState
```typescript
interface WorkflowState {
  id: string;                    // UUID único
  fileName: string;              // Nombre del archivo original
  fileType: string;              // MIME type
  fileSize: number;              // Tamaño en bytes
  file: File;                    // Archivo original
  createdAt: number;             // Timestamp de creación
  stages: {
    content: StageState;
    summary: StageState;
    flashcards: StageState;
  };
  overallStatus: 'pending' | 'processing' | 'completed' | 'error' | 'paused';
}
```


#### StageState
```typescript
interface StageState {
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress?: number;             // 0-100 para etapas con progreso
  result?: string;               // Contenido generado (markdown, TSV, etc.)
  error?: string;                // Mensaje de error si falla
  startedAt?: number;            // Timestamp de inicio
  completedAt?: number;          // Timestamp de completado
  stats?: GenerationStats;       // Estadísticas de generación
}
```

#### WorkflowSummary
```typescript
interface WorkflowSummary {
  total: number;
  completed: number;
  processing: number;
  error: number;
  pending: number;
}
```

### 2. Store Structure (Zustand)

```typescript
interface WorkflowStore {
  // State
  workflows: WorkflowState[];
  activeWorkflowId: string | null;
  isPaused: boolean;
  
  // Actions - Workflow Management
  addWorkflow: (file: File) => string;
  addMultipleWorkflows: (files: File[]) => string[];
  removeWorkflow: (id: string) => void;
  clearCompletedWorkflows: () => void;
  
  // Actions - Processing Control
  startAll: () => Promise<void>;              // Inicia TODOS los workflows pendientes
  startWorkflow: (id: string) => Promise<void>; // Inicia UN workflow específico
  pauseProcessing: () => void;
  resumeProcessing: () => void;
  processNextWorkflow: () => Promise<void>;
  
  // Actions - Stage Management
  updateStageStatus: (workflowId: string, stage: StageType, status: StageStatus) => void;
  updateStageProgress: (workflowId: string, stage: StageType, progress: number) => void;
  setStageResult: (workflowId: string, stage: StageType, result: string, stats?: GenerationStats) => void;
  setStageError: (workflowId: string, stage: StageType, error: string) => void;
  retryStage: (workflowId: string, stage: StageType) => Promise<void>;
  
  // Selectors
  getWorkflow: (id: string) => WorkflowState | undefined;
  getSummary: () => WorkflowSummary;
  getNextPendingWorkflow: () => WorkflowState | undefined;
}
```


### 3. Component Structure

#### WorkflowManager (Container Component)
- **Responsabilidad**: Orquestar la UI completa del sistema de workflows
- **Props**: Ninguno (consume el store directamente)
- **Estado Local**: 
  - `showExportDialog: boolean`
  - `selectedWorkflowsForExport: string[]`
- **Funcionalidad**:
  - Renderiza el header con botones de acción global
  - **Botón "Iniciar Todo"**: Procesa todos los workflows pendientes secuencialmente
  - **Botón "Pausar"**: Pausa el procesamiento global (visible solo cuando hay workflows procesándose)
  - Muestra el resumen de workflows (total, completados, procesando, errores)
  - Renderiza la lista de WorkflowCards
  - Maneja la exportación masiva

#### WorkflowCard (Presentational Component)
- **Responsabilidad**: Mostrar el estado de un workflow individual
- **Props**:
  ```typescript
  interface WorkflowCardProps {
    workflow: WorkflowState;
    onRemove: (id: string) => void;
    onStart: (id: string) => void;
  }
  ```
- **Funcionalidad**:
  - Muestra el nombre y metadatos del archivo
  - Renderiza las tres StageCards
  - Muestra el estado general del workflow
  - **Botón "Iniciar" individual** para procesar solo este workflow
  - Botón de eliminar
  - El botón "Iniciar" se deshabilita cuando el workflow está en procesamiento o completado

#### StageCard (Presentational Component)
- **Responsabilidad**: Mostrar el estado de una etapa específica
- **Props**:
  ```typescript
  interface StageCardProps {
    stage: StageState;
    stageType: 'content' | 'summary' | 'flashcards';
    stageNumber: 1 | 2 | 3;
    workflowId: string;
    onRetry?: () => void;
    onViewResult?: () => void;
    onCopyResult?: () => void;
    onExportResult?: () => void;
  }
  ```
- **Estados Visuales**:
  - **Pending**: Gris, icono de reloj, botones deshabilitados
  - **Processing**: Borde azul, spinner animado, barra de progreso
  - **Completed**: Borde verde, icono de check, botones habilitados
  - **Error**: Borde rojo, icono de error, botón de reintentar


#### ResultModal (Modal Component)
- **Responsabilidad**: Mostrar el resultado de una etapa en un modal
- **Props**:
  ```typescript
  interface ResultModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
    contentType: 'markdown' | 'tsv' | 'text';
  }
  ```
- **Funcionalidad**:
  - Renderiza contenido markdown con el componente MarkdownRenderer existente
  - Muestra TSV en formato de tabla
  - Botones de copiar y exportar

### 4. Service Layer

#### WorkflowProcessor Service
```typescript
class WorkflowProcessor {
  private store: WorkflowStore;
  private apiClient: ApiClient;
  
  constructor(store: WorkflowStore, apiClient: ApiClient);
  
  // Procesa un workflow completo (las 3 etapas)
  async processWorkflow(workflowId: string): Promise<void>;
  
  // Procesa una etapa específica
  async processStage(
    workflowId: string, 
    stage: StageType
  ): Promise<void>;
  
  // Reintenta una etapa que falló
  async retryStage(
    workflowId: string, 
    stage: StageType
  ): Promise<void>;
  
  // Procesa el siguiente workflow pendiente
  async processNext(): Promise<void>;
  
  // Cancela el procesamiento actual
  cancelCurrent(): void;
}
```

**Lógica de Procesamiento**:
1. **Etapa Content**: Extrae el contenido del archivo usando el API existente
2. **Etapa Summary**: Usa el contenido extraído para generar resumen
3. **Etapa Flashcards**: Usa el resumen para generar flashcards


## Data Flow

### Adding Workflows
```
User selects files
    ↓
WorkflowManager.handleAddFiles()
    ↓
store.addMultipleWorkflows(files)
    ↓
Creates WorkflowState for each file
    ↓
Persists to localStorage
    ↓
UI updates with new WorkflowCards
```

### Processing Workflows

#### Opción 1: Iniciar Todos (Batch Processing)
```
User clicks "Iniciar Todo" (botón global)
    ↓
store.startAll()
    ↓
WorkflowProcessor.processNext()
    ↓
Gets next pending workflow
    ↓
For each stage (content → summary → flashcards):
    ├─ Update stage status to 'processing'
    ├─ Call appropriate API endpoint
    ├─ Update progress (if applicable)
    ├─ On success: Set result and mark completed
    └─ On error: Set error message
    ↓
Mark workflow as completed
    ↓
If not paused: Process next workflow
    ↓
Repeat until all workflows are processed
```

#### Opción 2: Iniciar Individual (Single Processing)
```
User clicks "▶" button on specific WorkflowCard
    ↓
store.startWorkflow(workflowId)
    ↓
WorkflowProcessor.processWorkflow(workflowId)
    ↓
Process ONLY this workflow through all 3 stages
    ↓
For each stage (content → summary → flashcards):
    ├─ Update stage status to 'processing'
    ├─ Call appropriate API endpoint
    ├─ Update progress (if applicable)
    ├─ On success: Set result and mark completed
    └─ On error: Set error message
    ↓
Mark workflow as completed
    ↓
Stop (do NOT process other workflows)
```

**Diferencias Clave**:
- **Iniciar Todo**: Procesa workflows secuencialmente hasta completar todos
- **Iniciar Individual**: Procesa solo el workflow seleccionado y se detiene
- Ambos respetan el estado de pausa global
- El usuario puede mezclar ambos enfoques según necesite

### Retry Flow
```
User clicks "Reintentar" on failed stage
    ↓
store.retryStage(workflowId, stage)
    ↓
Clear error state
    ↓
WorkflowProcessor.processStage(workflowId, stage)
    ↓
Attempt processing again
    ↓
Update UI with new result or error
```

## Error Handling

### Error Types and Recovery

1. **Network Errors**
   - **Detección**: Timeout o fallo de conexión
   - **UI**: Mensaje "Error de red. Verifica tu conexión."
   - **Recuperación**: Botón de reintentar disponible inmediatamente

2. **API Key Errors**
   - **Detección**: Status 401 del API
   - **UI**: Mensaje "API Key inválida. Configura tu API Key."
   - **Recuperación**: Link directo a página de configuración

3. **Quota Exceeded**
   - **Detección**: Status 429 del API
   - **UI**: Mensaje "Cuota excedida. Intenta más tarde."
   - **Recuperación**: Pausar procesamiento automáticamente

4. **File Processing Errors**
   - **Detección**: Error específico del archivo
   - **UI**: Mensaje con detalles del error
   - **Recuperación**: Botón de reintentar, opción de eliminar workflow

5. **Unexpected Errors**
   - **Detección**: Cualquier error no categorizado
   - **UI**: Mensaje genérico con detalles técnicos
   - **Recuperación**: Botón de reintentar, opción de reportar bug


### Error Boundaries

- **Component Level**: Cada WorkflowCard tiene su propio error boundary
- **Store Level**: Errores en el store se capturan y se registran
- **API Level**: Todos los errores del API se mapean a tipos conocidos

## Testing Strategy

### Unit Tests

1. **Store Tests**
   - Agregar/remover workflows
   - Actualizar estados de etapas
   - Calcular resumen de workflows
   - Persistencia en localStorage

2. **Service Tests**
   - Procesamiento de workflows
   - Manejo de errores
   - Reintentos
   - Cancelación

3. **Component Tests**
   - Renderizado de estados
   - Interacciones de usuario
   - Transiciones de estado

### Integration Tests

1. **Flujo Completo**
   - Agregar múltiples archivos
   - Procesar todos los workflows
   - Manejar errores y reintentos
   - Exportar resultados

2. **Persistencia**
   - Guardar estado en localStorage
   - Restaurar estado al recargar
   - Manejar workflows interrumpidos

### E2E Tests

1. **Happy Path**
   - Usuario sube 3 archivos
   - Inicia procesamiento
   - Todos completan exitosamente
   - Exporta resultados

2. **Error Recovery**
   - Usuario sube archivo que falla
   - Reintenta procesamiento
   - Completa exitosamente

3. **Pausa/Reanudación**
   - Usuario inicia procesamiento
   - Pausa a mitad de camino
   - Reanuda y completa


## UI/UX Design

### Visual Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│  Header                                                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Flujo de Trabajo: Documentos a Flashcards            │   │
│  │ Transforma múltiples documentos en tarjetas...       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Controls Bar                                                │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ [+ Añadir Archivos ▼]  [▶ Iniciar Todo]  [⏸ Pausar] │   │
│  │                                                       │   │
│  │ Total: 3 | ✓ Completados: 1 | ⚙ Procesando: 1 | ✗ Errores: 1 │
│  │                                                       │   │
│  │ Nota: Usa "Iniciar Todo" para procesar todos los     │   │
│  │ workflows, o el botón "▶" en cada tarjeta para       │   │
│  │ procesar workflows individuales.                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Workflow List                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📄 Documento_Psicologia.pdf  ✓ Completado  [▶] 🗑   │   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │ │ 1 Content│ │ 2 Summary│ │3 Flashcrd│              │   │
│  │ │    ✓     │ │    ✓     │ │    ✓     │              │   │
│  │ │[Ver Det.]│ │[Ver][Cop]│ │[Ver][Exp]│              │   │
│  │ └──────────┘ └──────────┘ └──────────┘              │   │
│  │ Nota: Botón [▶] deshabilitado (ya completado)       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📄 Apuntes_Historia.docx   ⚙ Procesando... [⏸] 🗑  │   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │ │ 1 Content│ │ 2 Summary│ │3 Flashcrd│              │   │
│  │ │    ✓     │ │    ⚙     │ │    ⏳    │              │   │
│  │ │[Ver Det.]│ │ ▓▓▓▓░░░  │ │ [Espera] │              │   │
│  │ └──────────┘ └──────────┘ └──────────┘              │   │
│  │ Nota: Botón [⏸] para pausar este workflow           │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 📄 Presentacion_Marketing.pptx  ✗ Error  [▶] 🗑    │   │
│  │ ┌──────────┐ ┌──────────┐ ┌──────────┐              │   │
│  │ │ 1 Content│ │ 2 Summary│ │3 Flashcrd│              │   │
│  │ │    ✗     │ │    ⏳    │ │    ⏳    │              │   │
│  │ │[Ver Err.]│ │ [Espera] │ │ [Espera] │              │   │
│  │ │[Reinten.]│ │          │ │          │              │   │
│  │ └──────────┘ └──────────┘ └──────────┘              │   │
│  │ Nota: Botón [▶] habilitado para reintentar workflow │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Color Scheme (siguiendo el estilo actual)

- **Primary**: `#5D5FEF` (púrpura) - Botones principales, bordes activos
- **Success**: `#10B981` (verde) - Estados completados
- **Warning**: `#F59E0B` (amarillo) - Estados en procesamiento
- **Error**: `#EF4444` (rojo) - Estados de error
- **Muted**: `#6B7280` (gris) - Estados pendientes
- **Background Light**: `#F7F9FC`
- **Background Dark**: `#161823`

### Animations

1. **Stage Transitions**: Fade in/out al cambiar estados (200ms)
2. **Progress Bar**: Animación suave de llenado
3. **Spinner**: Rotación continua para estados de procesamiento
4. **Card Entry**: Slide in desde abajo al agregar workflows
5. **Card Exit**: Fade out al eliminar workflows


## Routing and Navigation

### New Route
- **Path**: `/[locale]/workflows`
- **Component**: `WorkflowsPage`
- **Access**: Desde el menú principal con un nuevo item "Workflows"

### Integration with Existing Routes
- Mantener las rutas existentes (`/upload`, `/summary`, `/flashcards`)
- El sistema de workflows es una alternativa, no un reemplazo
- Los usuarios pueden elegir entre:
  - Flujo simple (actual): Un documento a la vez
  - Flujo múltiple (nuevo): Varios documentos simultáneamente

## Performance Considerations

### Optimization Strategies

1. **Lazy Loading**
   - Cargar componentes de workflow solo cuando se accede a la ruta
   - Lazy load del ResultModal solo cuando se abre

2. **Memoization**
   - Memoizar WorkflowCards para evitar re-renders innecesarios
   - Usar `React.memo` en StageCards

3. **Virtual Scrolling**
   - Si hay más de 20 workflows, usar virtual scrolling
   - Renderizar solo los workflows visibles en viewport

4. **Debouncing**
   - Debounce de actualizaciones de progreso (100ms)
   - Throttle de actualizaciones de UI durante procesamiento

5. **Web Workers** (Fase 2)
   - Mover procesamiento pesado a Web Workers
   - Mantener UI responsive durante procesamiento

### Memory Management

1. **Cleanup de Files**
   - Revocar URLs de objetos cuando se eliminan workflows
   - Limpiar archivos temporales del API

2. **LocalStorage Limits**
   - Monitorear tamaño de datos persistidos
   - Implementar límite de workflows guardados (máximo 50)
   - Ofrecer opción de limpiar workflows completados antiguos


## Internationalization (i18n)

### New Translation Keys

```json
{
  "workflows": {
    "title": "Flujo de Trabajo: Documentos a Flashcards",
    "description": "Transforma múltiples documentos en tarjetas de estudio",
    "addFiles": "Añadir Archivos",
    "addSingle": "Nuevo workflow (archivo único)",
    "addMultiple": "Nuevo workflow (múltiples archivos)",
    "startAll": "Iniciar Todo",
    "pause": "Pausar",
    "resume": "Reanudar",
    "summary": {
      "total": "Total",
      "completed": "Completados",
      "processing": "Procesando",
      "errors": "Errores",
      "pending": "Pendientes"
    },
    "stages": {
      "content": "Contenido",
      "summary": "Resumen",
      "flashcards": "Flashcards"
    },
    "status": {
      "pending": "Pendiente",
      "processing": "Procesando...",
      "completed": "Completado",
      "error": "Error",
      "paused": "Pausado"
    },
    "actions": {
      "viewDetails": "Ver Detalles",
      "viewSummary": "Ver Resumen",
      "viewFlashcards": "Ver Flashcards",
      "copy": "Copiar",
      "export": "Exportar",
      "retry": "Reintentar",
      "delete": "Eliminar",
      "viewError": "Ver Error"
    },
    "messages": {
      "noWorkflows": "No hay workflows. Añade archivos para comenzar.",
      "processingComplete": "Todos los workflows completados",
      "workflowAdded": "Workflow añadido exitosamente",
      "workflowRemoved": "Workflow eliminado",
      "copied": "Copiado al portapapeles",
      "exported": "Exportado exitosamente"
    }
  }
}
```

## Security Considerations

1. **API Key Protection**
   - Nunca exponer API keys en logs del cliente
   - Validar API key antes de iniciar procesamiento

2. **File Validation**
   - Validar tipos de archivo en cliente y servidor
   - Limitar tamaño de archivos (20MB)
   - Sanitizar nombres de archivos

3. **XSS Prevention**
   - Sanitizar contenido markdown antes de renderizar
   - Usar DOMPurify para limpiar HTML generado

4. **Rate Limiting**
   - Implementar rate limiting en el cliente
   - Respetar límites del API de Gemini

## Accessibility

1. **Keyboard Navigation**
   - Todos los botones accesibles por teclado
   - Tab order lógico
   - Shortcuts: Space para pausar/reanudar, Delete para eliminar

2. **Screen Readers**
   - ARIA labels en todos los elementos interactivos
   - Anuncios de cambios de estado
   - Descripciones de progreso

3. **Visual Indicators**
   - No depender solo del color para estados
   - Usar iconos además de colores
   - Alto contraste en modo oscuro

4. **Focus Management**
   - Focus visible en todos los elementos
   - Trap focus en modales
   - Restaurar focus al cerrar modales


## Migration Strategy

### Phase 1: Core Implementation
1. Crear store de workflows
2. Implementar componentes básicos
3. Integrar con API existente
4. Agregar ruta y navegación

### Phase 2: Enhanced Features
1. Exportación masiva
2. Notificaciones del sistema
3. Web Workers para procesamiento
4. Virtual scrolling

### Phase 3: Polish
1. Animaciones avanzadas
2. Optimizaciones de rendimiento
3. Tests E2E completos
4. Documentación de usuario

### Backward Compatibility
- El flujo existente (upload → summary → flashcards) permanece intacto
- Los usuarios pueden elegir qué flujo usar
- Los datos existentes en localStorage no se afectan
- Migración gradual sin breaking changes

## Future Enhancements

1. **Batch Operations**
   - Seleccionar múltiples workflows para acciones masivas
   - Exportar selección de workflows

2. **Templates**
   - Guardar configuraciones de procesamiento
   - Aplicar templates a nuevos workflows

3. **Scheduling**
   - Programar procesamiento para horarios específicos
   - Procesamiento nocturno automático

4. **Cloud Sync**
   - Sincronizar workflows entre dispositivos
   - Backup automático en la nube

5. **Collaboration**
   - Compartir workflows con otros usuarios
   - Comentarios y anotaciones

6. **Analytics**
   - Dashboard de uso
   - Estadísticas de procesamiento
   - Reportes de eficiencia

## Dependencies

### New Dependencies
- Ninguna nueva dependencia requerida
- Usar bibliotecas existentes:
  - `zustand` para state management
  - `framer-motion` para animaciones
  - `lucide-react` para iconos
  - `sonner` para notificaciones

### API Changes
- **Nuevo endpoint**: `POST /api/content/extract` para extracción de contenido
- Endpoints existentes permanecen sin cambios

## Deployment Considerations

1. **Feature Flag**
   - Implementar feature flag para habilitar/deshabilitar workflows
   - Permitir rollback rápido si hay problemas

2. **Monitoring**
   - Agregar logging para eventos de workflow
   - Monitorear tasas de error por etapa
   - Tracking de tiempos de procesamiento

3. **Rollout Strategy**
   - Beta testing con usuarios seleccionados
   - Gradual rollout al 100% de usuarios
   - Monitoreo continuo de métricas


## Control de Workflows: Individual vs Masivo

### Controles Globales (en WorkflowManager)

1. **Botón "Añadir Archivos"** (Dropdown)
   - Opción 1: "Nuevo workflow (archivo único)" - Abre selector de un archivo
   - Opción 2: "Nuevo workflow (múltiples archivos)" - Abre selector múltiple
   - Agrega workflows a la cola en estado 'pending'

2. **Botón "Iniciar Todo"**
   - **Visible**: Siempre
   - **Habilitado**: Cuando hay al menos un workflow pendiente
   - **Deshabilitado**: Cuando no hay workflows pendientes o todos están completados
   - **Acción**: Inicia el procesamiento secuencial de TODOS los workflows pendientes
   - **Comportamiento**: Procesa un workflow a la vez hasta completar todos

3. **Botón "Pausar"**
   - **Visible**: Solo cuando hay procesamiento activo
   - **Acción**: Pausa el procesamiento después de completar la etapa actual
   - **Efecto**: Cambia a botón "Reanudar"

4. **Botón "Reanudar"**
   - **Visible**: Solo cuando el procesamiento está pausado
   - **Acción**: Continúa el procesamiento desde donde se pausó
   - **Efecto**: Cambia a botón "Pausar"

### Controles Individuales (en cada WorkflowCard)

1. **Botón "▶ Iniciar"** (en la cabecera de cada card)
   - **Visible**: Siempre
   - **Habilitado**: Cuando el workflow está en estado 'pending' o 'error'
   - **Deshabilitado**: Cuando está 'processing' o 'completed'
   - **Acción**: Inicia el procesamiento de SOLO este workflow específico
   - **Comportamiento**: Procesa las 3 etapas de este workflow y se detiene
   - **Posición**: Entre el nombre del archivo y el botón de eliminar

2. **Botón "🗑 Eliminar"** (en la cabecera de cada card)
   - **Visible**: Siempre
   - **Acción**: Elimina el workflow de la cola
   - **Confirmación**: Muestra diálogo de confirmación si el workflow está en procesamiento
   - **Efecto**: Si está procesando, cancela el procesamiento antes de eliminar

3. **Botones de Acción por Etapa** (en cada StageCard)
   - **Ver Detalles / Ver Resumen / Ver Flashcards**: Abre modal con el resultado
   - **Copiar**: Copia el resultado al portapapeles
   - **Exportar**: Descarga el resultado como archivo
   - **Reintentar**: Reintenta una etapa que falló
   - **Ver Error**: Muestra detalles del error en un modal

### Casos de Uso

#### Caso 1: Usuario quiere procesar todos los documentos
```
1. Usuario sube 5 archivos usando "Añadir Archivos" → "múltiples archivos"
2. Se crean 5 workflows en estado 'pending'
3. Usuario hace clic en "Iniciar Todo"
4. Los workflows se procesan uno por uno secuencialmente
5. Usuario puede pausar en cualquier momento
6. Al completar todos, el botón "Iniciar Todo" se deshabilita
```

#### Caso 2: Usuario quiere procesar solo un documento específico
```
1. Usuario sube 3 archivos
2. Se crean 3 workflows en estado 'pending'
3. Usuario hace clic en "▶" del segundo workflow
4. Solo el segundo workflow se procesa
5. Los otros 2 permanecen en 'pending'
6. Usuario puede iniciar otros workflows individualmente cuando quiera
```

#### Caso 3: Usuario mezcla procesamiento individual y masivo
```
1. Usuario sube 5 archivos
2. Usuario hace clic en "▶" del primer workflow (se procesa individualmente)
3. Mientras el primero procesa, usuario hace clic en "Iniciar Todo"
4. El sistema espera a que termine el primero
5. Luego procesa los 4 restantes secuencialmente
```

#### Caso 4: Usuario pausa y reanuda
```
1. Usuario inicia "Iniciar Todo" con 10 workflows
2. Después de 3 workflows completados, hace clic en "Pausar"
3. El workflow actual termina su etapa y se pausa
4. Usuario revisa los resultados
5. Usuario hace clic en "Reanudar"
6. El procesamiento continúa con los 7 workflows restantes
```

### Reglas de Negocio

1. **Procesamiento Secuencial**: Solo un workflow se procesa a la vez para evitar sobrecarga del API
2. **Prioridad**: Los workflows iniciados individualmente tienen prioridad sobre el procesamiento masivo
3. **Pausa Respeta Etapa**: Al pausar, se completa la etapa actual antes de detenerse
4. **Estado Persistente**: El estado de pausa se guarda en localStorage
5. **Reinicio Inteligente**: Al recargar la página, workflows en 'processing' se marcan como 'pending' para reinicio manual

