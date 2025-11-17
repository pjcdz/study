# Requirements Document

## Introduction

Este documento define los requisitos para implementar streaming en tiempo real con Google GenAI SDK en el flujo de generación de resúmenes y flashcards. El objetivo es mejorar la experiencia del usuario mostrando el contenido generado progresivamente mientras se produce, en lugar de esperar a que se complete toda la generación.

## Glossary

- **System**: La aplicación web de herramientas de estudio
- **GenAI SDK**: Google GenAI SDK (@google/genai) para interactuar con Gemini API
- **Streaming**: Proceso de recibir y mostrar datos progresivamente mientras se generan
- **Typewriter Effect**: Efecto visual que muestra texto carácter por carácter
- **Workflow**: Proceso de transformación de documentos a flashcards
- **Stage**: Etapa individual dentro de un workflow (content, summary, flashcards)
- **Gemini 2.5 Flash Lite**: Modelo de IA de Google utilizado para generación de contenido

## Requirements

### Requirement 1: Streaming de Generación de Resumen

**User Story:** Como usuario, quiero ver el resumen generándose en tiempo real mientras Gemini lo produce, para tener feedback inmediato del progreso y poder empezar a leer antes de que termine.

#### Acceptance Criteria

1. WHEN THE System genera un resumen, THE System SHALL mostrar el texto progresivamente mientras se recibe del API
2. WHILE THE System recibe chunks de texto del stream, THE System SHALL actualizar la UI sin bloquear la interacción del usuario
3. WHEN THE streaming completa exitosamente, THE System SHALL marcar la etapa como completada con el texto final
4. IF THE streaming falla o se interrumpe, THEN THE System SHALL mostrar un mensaje de error y permitir reintentar
5. THE System SHALL calcular dinámicamente la velocidad de escritura basándose en la velocidad de llegada de chunks

### Requirement 2: Streaming de Generación de Flashcards

**User Story:** Como usuario, quiero ver las flashcards generándose en tiempo real mientras Gemini las produce, para tener feedback inmediato del progreso.

#### Acceptance Criteria

1. WHEN THE System genera flashcards, THE System SHALL mostrar el contenido TSV progresivamente mientras se recibe del API
2. WHILE THE System recibe chunks de texto del stream, THE System SHALL actualizar la UI sin bloquear la interacción del usuario
3. WHEN THE streaming completa exitosamente, THE System SHALL marcar la etapa como completada con el contenido TSV final
4. THE System SHALL mantener el formato TSV válido durante todo el proceso de streaming
5. THE System SHALL calcular dinámicamente la velocidad de escritura basándose en la velocidad de llegada de chunks

### Requirement 3: Integración con Workflow System

**User Story:** Como usuario, quiero que el streaming funcione tanto en el flujo simple (upload → summary → flashcards) como en el sistema de workflows múltiples, para tener una experiencia consistente.

#### Acceptance Criteria

1. WHEN THE System procesa un workflow, THE System SHALL usar streaming para las etapas de summary y flashcards
2. WHILE THE System procesa múltiples workflows simultáneamente, THE System SHALL mantener streams independientes para cada uno
3. THE System SHALL permitir pausar y reanudar workflows sin perder el progreso del streaming
4. THE System SHALL persistir el resultado final del streaming en localStorage después de completar
5. WHEN THE usuario recarga la página durante streaming, THE System SHALL mostrar el último estado guardado

### Requirement 4: Efecto Typewriter Adaptativo

**User Story:** Como usuario, quiero que el texto aparezca de forma fluida y natural, adaptándose a la velocidad de generación del modelo, para una mejor experiencia visual.

#### Acceptance Criteria

1. THE System SHALL implementar un efecto typewriter usando requestAnimationFrame para animación fluida
2. THE System SHALL calcular el delay entre caracteres basándose en la velocidad de llegada de chunks del stream
3. THE System SHALL aplicar smoothing exponencial al delay calculado para evitar cambios bruscos de velocidad
4. THE System SHALL mantener un delay mínimo de 0.1ms para prevenir errores de división por cero
5. WHEN THE texto nuevo no comienza con el texto actual, THE System SHALL resetear el índice de escritura

### Requirement 5: Manejo de Errores en Streaming

**User Story:** Como usuario, quiero recibir mensajes claros cuando el streaming falla, para entender qué salió mal y poder tomar acción.

#### Acceptance Criteria

1. WHEN THE streaming falla por error de red, THE System SHALL mostrar mensaje "Error de red. Verifica tu conexión."
2. WHEN THE streaming falla por API key inválida, THE System SHALL mostrar mensaje "API Key inválida. Configura tu API Key."
3. WHEN THE streaming falla por cuota excedida, THE System SHALL mostrar mensaje "Cuota excedida. Intenta más tarde."
4. THE System SHALL proporcionar un botón de reintentar para errores recuperables
5. THE System SHALL registrar errores detallados en la consola para debugging

### Requirement 6: Métricas de Uso con Streaming

**User Story:** Como usuario, quiero ver las estadísticas de tokens utilizados después de que el streaming complete, para monitorear mi uso del API.

#### Acceptance Criteria

1. WHEN THE streaming completa, THE System SHALL extraer y mostrar usageMetadata del último chunk
2. THE System SHALL mostrar promptTokens, candidatesTokens y totalTokens en la UI
3. THE System SHALL calcular y mostrar el tiempo total de generación en milisegundos
4. THE System SHALL incluir estas métricas en los logs de la consola
5. THE System SHALL persistir las métricas junto con el resultado generado

### Requirement 7: Cancelación de Streaming

**User Story:** Como usuario, quiero poder cancelar una generación en progreso si tarda demasiado o si cometí un error, para no desperdiciar tiempo y recursos.

#### Acceptance Criteria

1. THE System SHALL proporcionar un botón de cancelar visible durante el streaming
2. WHEN THE usuario cancela el streaming, THE System SHALL abortar la solicitud al API inmediatamente
3. WHEN THE streaming se cancela, THE System SHALL marcar la etapa como error con mensaje "Cancelado por el usuario"
4. THE System SHALL limpiar recursos y listeners al cancelar el streaming
5. THE System SHALL permitir reiniciar la generación después de cancelar

### Requirement 8: Optimización de Performance

**User Story:** Como desarrollador, quiero que el streaming sea eficiente y no cause problemas de rendimiento, para mantener la aplicación responsive.

#### Acceptance Criteria

1. THE System SHALL usar requestAnimationFrame en lugar de setTimeout para animaciones
2. THE System SHALL acumular tiempo entre frames para renderizar múltiples caracteres cuando sea necesario
3. THE System SHALL evitar re-renders innecesarios usando React.memo y useCallback
4. THE System SHALL limpiar timers y listeners en el cleanup de useEffect
5. THE System SHALL mantener referencias estables usando useRef para valores que cambian frecuentemente

### Requirement 9: Compatibilidad con Modo Demo

**User Story:** Como usuario en modo demo, quiero que el streaming funcione con datos mock, para probar la funcionalidad sin usar mi API key.

#### Acceptance Criteria

1. WHEN THE System está en modo demo, THE System SHALL simular streaming con datos mock
2. THE System SHALL generar chunks artificiales de los datos mock para simular streaming realista
3. THE System SHALL aplicar delays realistas entre chunks en modo demo
4. THE System SHALL mostrar las mismas métricas de uso en modo demo
5. THE System SHALL mantener la misma UI y comportamiento en modo demo y modo real

### Requirement 10: Accesibilidad del Streaming

**User Story:** Como usuario con necesidades de accesibilidad, quiero que el contenido en streaming sea accesible para lectores de pantalla, para poder usar la aplicación efectivamente.

#### Acceptance Criteria

1. THE System SHALL usar aria-live="polite" para anunciar actualizaciones de streaming a lectores de pantalla
2. THE System SHALL proporcionar aria-label descriptivos para el estado de streaming
3. THE System SHALL mantener el contenido en streaming navegable por teclado
4. THE System SHALL anunciar cuando el streaming completa o falla
5. THE System SHALL proporcionar alternativas textuales para indicadores visuales de progreso
