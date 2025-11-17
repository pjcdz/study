# Procesamiento Simultáneo de Workflows

## Cambios Implementados

### 1. Nuevo Método en WorkflowProcessor

Se agregó el método `processAllSimultaneously()` que permite procesar múltiples workflows en paralelo:

```typescript
async processAllSimultaneously(): Promise<void> {
  // Obtiene todos los workflows pendientes
  const pendingWorkflows = this.store.workflows.filter(
    (w: any) => w.overallStatus === 'pending'
  );

  // Procesa todos en paralelo usando Promise.all
  const processingPromises = pendingWorkflows.map((workflow: any) => 
    this.processWorkflow(workflow.id).catch(error => {
      console.error(`Workflow ${workflow.id} failed:`, error);
      // No lanza error, permite que otros workflows continúen
    })
  );

  await Promise.all(processingPromises);
}
```

### 2. Actualización del Botón "Start All"

El botón "Iniciar Todo" ahora usa el nuevo método de procesamiento simultáneo:

**Antes:**
```typescript
await processor.processNext(); // Procesamiento secuencial
```

**Después:**
```typescript
await processor.processAllSimultaneously(); // Procesamiento simultáneo
```

### 3. Indicador Visual

Se agregó un indicador que muestra cuántos workflows se están procesando simultáneamente:

```typescript
{isProcessing && summary.processing > 1 && (
  <p className="mt-2 text-primary font-medium">
    ⚡ Procesando {summary.processing} workflows simultáneamente
  </p>
)}
```

### 4. Traducciones Actualizadas

**Español:**
- "Iniciando procesamiento simultáneo de todos los workflows"
- "Usa 'Iniciar Todo' para procesar todos los workflows simultáneamente..."

**English:**
- "Starting simultaneous processing of all workflows"
- "Use 'Start All' to process all workflows simultaneously..."

## Ventajas del Procesamiento Simultáneo

### ⚡ Velocidad
- **Antes:** Si tenías 5 archivos de 30 segundos cada uno = 2.5 minutos total
- **Ahora:** Los 5 archivos se procesan en ~30 segundos (el tiempo del más lento)

### 🔄 Mejor Uso de Recursos
- Aprovecha la capacidad de la API para manejar múltiples solicitudes
- No hay tiempo de espera entre workflows
- Procesamiento más eficiente

### 📊 Feedback Visual
- Puedes ver todos los workflows procesándose al mismo tiempo
- Indicador de cuántos están en proceso simultáneo
- Mejor experiencia de usuario

## Comportamiento

### Procesamiento Individual
- El botón "▶" en cada tarjeta sigue procesando workflows individuales
- Útil cuando solo quieres procesar un archivo específico

### Procesamiento por Lotes (Start All)
- Procesa TODOS los workflows pendientes simultáneamente
- Cada workflow pasa por sus 3 etapas: Content → Summary → Flashcards
- Si un workflow falla, los demás continúan procesándose

### Manejo de Errores
- Los errores en un workflow no afectan a los demás
- Cada workflow tiene su propio manejo de errores y reintentos
- Los workflows fallidos se marcan como "error" y pueden reintentarse

## Ejemplo de Uso

1. **Subir múltiples archivos:**
   - Haz clic en "Añadir Archivos" → "Nuevo workflow (múltiples archivos)"
   - Selecciona 5-10 archivos PDF o imágenes

2. **Iniciar procesamiento simultáneo:**
   - Haz clic en "Iniciar Todo"
   - Verás todos los workflows comenzar a procesarse al mismo tiempo
   - El indicador mostrará: "⚡ Procesando 5 workflows simultáneamente"

3. **Monitorear progreso:**
   - Cada tarjeta muestra el progreso de sus 3 etapas
   - Las estadísticas en la parte superior se actualizan en tiempo real
   - Puedes ver cuántos están completados, procesando o con errores

## Notas Técnicas

- Usa `Promise.all()` para ejecutar todos los workflows en paralelo
- Cada workflow es independiente y tiene su propio ciclo de vida
- El procesamiento simultáneo respeta los límites de la API de Gemini
- Si la API tiene límites de tasa, algunos workflows pueden fallar y reintentarse automáticamente
