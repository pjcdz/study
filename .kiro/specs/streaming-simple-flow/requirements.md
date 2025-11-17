# Requirements Document

## Introduction

Este documento define los requisitos para implementar streaming en tiempo real con Google GenAI SDK en el flujo simple (no-workflow) de generación de resúmenes y flashcards. Actualmente, el streaming solo está implementado en el sistema de workflows, pero las páginas simples de upload/summary/flashcards aún usan llamadas API tradicionales sin streaming. El objetivo es proporcionar la misma experiencia de streaming en ambos flujos para consistencia y mejor UX.

## Glossary

- **Simple Flow**: Flujo de navegación tradicional upload → summary → flashcards sin usar el sistema de workflows
- **Workflow Flow**: Sistema de workflows múltiples con stages que ya tiene streaming implementado
- **GenAI SDK**: Google GenAI SDK (@google/genai) para interactuar con Gemini API
- **Streaming**: Proceso de recibir y mostrar datos progresivamente mientras se generan
- **Typewriter Effect**: Efecto visual que muestra texto carácter por carácter
- **apiClient**: Cliente API actual que usa llamadas tradicionales sin streaming
- **Gemini 2.5 Flash Lite**: Modelo de IA de Google utilizado para generación de contenido

## Requirements

### Requirement 1: Streaming en Generación de Resumen (Simple Flow)

**User Story:** Como usuario que usa el flujo simple, quiero ver el resumen generándose en tiempo real mientras Gemini lo produce, para tener feedback inmediato del progreso igual que en los workflows.

#### Acceptance Criteria

1. WHEN THE usuario sube un archivo en la página de upload, THE System SHALL generar el resumen usando streaming
2. WHILE THE System recibe chunks de texto del stream, THE System SHALL mostrar el texto progresivamente en la página de summary
3. WHEN THE streaming completa exitosamente, THE System SHALL guardar el resumen completo en el store
4. THE System SHALL calcular dinámicamente la velocidad de escritura basándose en la velocidad de llegada de chunks
5. THE System SHALL mantener compatibilidad con el modo demo existente

### Requirement 2: Streaming en Generación de Flashcards (Simple Flow)

**User Story:** Como usuario en la página de summary, quiero ver las flashcards generándose en tiempo real cuando hago clic en "Generate Flashcards", para tener feedback inmediato del progreso.

#### Acceptance Criteria

1. WHEN THE usuario hace clic en "Generate Flashcards" en la página de summary, THE System SHALL generar flashcards usando streaming
2. WHILE THE System recibe chunks de texto del stream, THE System SHALL mostrar el contenido TSV progresivamente
3. WHEN THE streaming completa exitosamente, THE System SHALL guardar las flashcards en el store y navegar a la página de flashcards
4. THE System SHALL mantener el formato TSV válido durante todo el proceso de streaming
5. THE System SHALL calcular dinámicamente la velocidad de escritura basándose en la velocidad de llegada de chunks

### Requirement 3: Streaming en Condensación de Resumen

**User Story:** Como usuario en la página de summary, quiero ver el resumen condensado generándose en tiempo real cuando hago clic en "Condense more", para tener feedback inmediato del progreso.

#### Acceptance Criteria

1. WHEN THE usuario hace clic en "Condense more" en la página de summary, THE System SHALL condensar el resumen usando streaming
2. WHILE THE System recibe chunks de texto del stream, THE System SHALL mostrar el texto condensado progresivamente
3. WHEN THE streaming completa exitosamente, THE System SHALL agregar el nuevo resumen condensado al array de summaries
4. THE System SHALL permitir hasta 3 versiones de resumen como máximo
5. THE System SHALL calcular dinámicamente la velocidad de escritura basándose en la velocidad de llegada de chunks

### Requirement 4: Integración con StreamingText Component

**User Story:** Como desarrollador, quiero reutilizar el componente StreamingText existente en las páginas simples, para mantener consistencia visual y de código con los workflows.

#### Acceptance Criteria

1. THE System SHALL usar el componente StreamingText existente de `components/streaming/streaming-text.tsx`
2. THE System SHALL mostrar el cursor de streaming mientras el contenido se genera
3. THE System SHALL aplicar el efecto typewriter adaptativo con requestAnimationFrame
4. THE System SHALL mantener las mismas propiedades de accesibilidad (aria-live, aria-label)
5. THE System SHALL limpiar recursos correctamente al desmontar el componente

### Requirement 5: Refactorización de apiClient para Streaming

**User Story:** Como desarrollador, quiero que apiClient soporte tanto llamadas tradicionales como streaming, para mantener compatibilidad con código existente mientras agrego streaming.

#### Acceptance Criteria

1. THE System SHALL agregar métodos de streaming a apiClient: `processSummaryStream()`, `processFlashcardsStream()`, `condenseSummaryStream()`
2. THE System SHALL mantener los métodos existentes sin streaming para compatibilidad hacia atrás
3. THE System SHALL usar callbacks (onChunk, onComplete, onError) para comunicar el progreso del streaming
4. THE System SHALL calcular y retornar charDelay adaptativo en cada chunk
5. THE System SHALL extraer y retornar usageMetadata al completar el streaming

### Requirement 6: Manejo de Estado de Streaming en Upload Store

**User Story:** Como desarrollador, quiero que el store maneje el estado de streaming para las páginas simples, para coordinar la UI durante la generación.

#### Acceptance Criteria

1. THE System SHALL agregar campos de streaming al store: `isStreamingSummary`, `isStreamingFlashcards`, `isStreamingCondense`
2. THE System SHALL agregar campos para texto temporal: `streamingSummaryText`, `streamingFlashcardsText`
3. THE System SHALL agregar campo para charDelay: `currentCharDelay`
4. THE System SHALL actualizar estos campos durante el streaming
5. THE System SHALL limpiar los campos de streaming al completar o fallar

### Requirement 7: Visualización de Streaming en Summary Page

**User Story:** Como usuario en la página de summary, quiero ver el resumen aparecer progresivamente con efecto typewriter, para una mejor experiencia visual.

#### Acceptance Criteria

1. WHEN THE resumen se está generando, THE System SHALL mostrar StreamingText component en lugar del ScrollArea estático
2. THE System SHALL mostrar un cursor parpadeante al final del texto mientras se genera
3. WHEN THE streaming completa, THE System SHALL cambiar a la vista estática normal con ScrollArea
4. THE System SHALL deshabilitar los botones "Condense more" y "Generate Flashcards" durante el streaming
5. THE System SHALL mostrar el tiempo transcurrido durante la generación

### Requirement 8: Visualización de Streaming en Upload Page

**User Story:** Como usuario que acaba de subir un archivo, quiero ver el progreso de generación del resumen en tiempo real, para saber que el sistema está trabajando.

#### Acceptance Criteria

1. WHEN THE usuario sube un archivo, THE System SHALL navegar a la página de summary inmediatamente
2. THE System SHALL iniciar el streaming del resumen en la página de summary
3. THE System SHALL mostrar un indicador de "Generating..." mientras el streaming está activo
4. WHEN THE streaming completa, THE System SHALL ocultar el indicador y mostrar los botones de acción
5. THE System SHALL manejar errores de streaming y mostrar mensajes apropiados

### Requirement 9: Cancelación de Streaming

**User Story:** Como usuario, quiero poder cancelar una generación en progreso en el flujo simple, para no desperdiciar tiempo si cometí un error.

#### Acceptance Criteria

1. THE System SHALL proporcionar un botón de cancelar visible durante el streaming en summary page
2. WHEN THE usuario cancela el streaming, THE System SHALL abortar la solicitud al API inmediatamente
3. WHEN THE streaming se cancela, THE System SHALL mostrar un mensaje "Cancelado por el usuario"
4. THE System SHALL limpiar el estado de streaming en el store
5. THE System SHALL permitir reiniciar la generación después de cancelar

### Requirement 10: Manejo de Errores en Streaming

**User Story:** Como usuario, quiero recibir mensajes claros cuando el streaming falla en el flujo simple, para entender qué salió mal.

#### Acceptance Criteria

1. WHEN THE streaming falla por error de red, THE System SHALL mostrar mensaje "Error de red. Verifica tu conexión."
2. WHEN THE streaming falla por API key inválida, THE System SHALL mostrar mensaje "API Key inválida. Configura tu API Key."
3. WHEN THE streaming falla por cuota excedida, THE System SHALL mostrar mensaje "Cuota excedida. Intenta más tarde."
4. THE System SHALL proporcionar un botón de reintentar para errores recuperables
5. THE System SHALL registrar errores detallados en la consola para debugging

### Requirement 11: Métricas de Uso con Streaming

**User Story:** Como usuario, quiero ver las estadísticas de tokens utilizados después de que el streaming complete en el flujo simple, para monitorear mi uso del API.

#### Acceptance Criteria

1. WHEN THE streaming completa, THE System SHALL extraer y guardar usageMetadata
2. THE System SHALL mostrar promptTokens, candidatesTokens y totalTokens en la UI
3. THE System SHALL calcular y mostrar el tiempo total de generación
4. THE System SHALL incluir estas métricas en los logs de la consola
5. THE System SHALL persistir las métricas en localStorage junto con el resultado

### Requirement 12: Compatibilidad con Modo Demo

**User Story:** Como usuario en modo demo, quiero que el streaming funcione con datos mock en el flujo simple, para probar la funcionalidad sin usar mi API key.

#### Acceptance Criteria

1. WHEN THE System está en modo demo, THE System SHALL simular streaming con datos mock
2. THE System SHALL generar chunks artificiales de los datos mock para simular streaming realista
3. THE System SHALL aplicar delays realistas entre chunks en modo demo
4. THE System SHALL mostrar las mismas métricas de uso en modo demo
5. THE System SHALL mantener la misma UI y comportamiento en modo demo y modo real

### Requirement 13: Optimización de Performance

**User Story:** Como desarrollador, quiero que el streaming en el flujo simple sea eficiente, para mantener la aplicación responsive.

#### Acceptance Criteria

1. THE System SHALL usar requestAnimationFrame para animaciones fluidas
2. THE System SHALL evitar re-renders innecesarios usando React.memo y useCallback
3. THE System SHALL limpiar timers y listeners en el cleanup de useEffect
4. THE System SHALL mantener referencias estables usando useRef para valores que cambian frecuentemente
5. THE System SHALL throttle las actualizaciones del store a máximo 60fps

### Requirement 14: Accesibilidad del Streaming

**User Story:** Como usuario con necesidades de accesibilidad, quiero que el contenido en streaming sea accesible en el flujo simple, para poder usar la aplicación efectivamente.

#### Acceptance Criteria

1. THE System SHALL usar aria-live="polite" para anunciar actualizaciones de streaming
2. THE System SHALL proporcionar aria-label descriptivos para el estado de streaming
3. THE System SHALL mantener el contenido en streaming navegable por teclado
4. THE System SHALL anunciar cuando el streaming completa o falla
5. THE System SHALL proporcionar alternativas textuales para indicadores visuales de progreso

### Requirement 15: Persistencia de Estado Durante Navegación

**User Story:** Como usuario, quiero que el estado de streaming se mantenga si recargo la página, para no perder el progreso.

#### Acceptance Criteria

1. WHEN THE usuario recarga la página durante streaming, THE System SHALL mostrar el último estado guardado
2. THE System SHALL persistir el texto parcial en localStorage durante el streaming
3. THE System SHALL restaurar el estado de streaming desde localStorage al cargar la página
4. WHEN THE streaming se interrumpe por recarga, THE System SHALL permitir reintentar
5. THE System SHALL limpiar el estado de streaming de localStorage al completar exitosamente
