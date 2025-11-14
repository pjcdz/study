# Requirements Document

## Introduction

Este documento define los requisitos para un sistema de workflows múltiples que permite a los usuarios procesar varios documentos simultáneamente a través de un pipeline de tres etapas: extracción de contenido, generación de resumen y creación de flashcards. El sistema debe proporcionar visibilidad en tiempo real del estado de cada documento y cada etapa del procesamiento.

## Glossary

- **Workflow System**: El sistema completo que gestiona el procesamiento de múltiples documentos
- **Document Workflow**: Una instancia de procesamiento para un documento específico
- **Pipeline Stage**: Una de las tres etapas del procesamiento (Contenido, Resumen, Flashcards)
- **Workflow Manager**: El componente que coordina y rastrea el estado de todos los workflows activos
- **Processing Queue**: La cola que gestiona el orden de procesamiento de documentos
- **Stage Status**: El estado actual de una etapa específica (pending, processing, completed, error)

## Requirements

### Requirement 1

**User Story:** Como usuario, quiero subir múltiples documentos a la vez para procesarlos simultáneamente, de modo que pueda ahorrar tiempo al trabajar con varios materiales de estudio.

#### Acceptance Criteria

1. WHEN el usuario selecciona la opción "Nuevo workflow (múltiples archivos)", THE Workflow System SHALL mostrar una interfaz de selección de archivos múltiples
2. WHEN el usuario arrastra y suelta múltiples archivos en la zona de carga, THE Workflow System SHALL aceptar todos los archivos válidos simultáneamente
3. THE Workflow System SHALL validar que cada archivo cumpla con los tipos permitidos (PDF, imágenes)
4. THE Workflow System SHALL validar que cada archivo no exceda el límite de tamaño de 20MB
5. WHEN un archivo no cumple con las validaciones, THE Workflow System SHALL mostrar un mensaje de error específico para ese archivo sin bloquear los demás


### Requirement 2

**User Story:** Como usuario, quiero ver el progreso de cada documento en tiempo real a través de las tres etapas del pipeline, para saber exactamente en qué punto está cada procesamiento.

#### Acceptance Criteria

1. WHEN un documento inicia su procesamiento, THE Workflow System SHALL mostrar una tarjeta visual con el nombre del documento y tres etapas claramente identificadas
2. WHILE una etapa está en procesamiento, THE Workflow System SHALL mostrar un indicador visual de progreso (spinner o barra de progreso)
3. WHEN una etapa se completa exitosamente, THE Workflow System SHALL actualizar el indicador visual a un estado de completado (check icon)
4. WHEN una etapa falla, THE Workflow System SHALL mostrar un indicador de error con un mensaje descriptivo
5. THE Workflow System SHALL actualizar el estado visual de cada etapa sin requerir recarga de página

### Requirement 3

**User Story:** Como usuario, quiero poder iniciar todos los workflows pendientes con un solo clic, para comenzar el procesamiento masivo de manera eficiente.

#### Acceptance Criteria

1. WHEN hay documentos en la cola sin procesar, THE Workflow System SHALL mostrar un botón "Iniciar Todo" habilitado
2. WHEN el usuario hace clic en "Iniciar Todo", THE Workflow System SHALL iniciar el procesamiento de todos los documentos pendientes
3. THE Workflow System SHALL procesar los documentos de manera secuencial para evitar sobrecarga del API
4. WHILE los workflows están procesándose, THE Workflow System SHALL deshabilitar el botón "Iniciar Todo"
5. WHEN todos los workflows completan o fallan, THE Workflow System SHALL habilitar nuevamente el botón

### Requirement 4

**User Story:** Como usuario, quiero poder ver y acceder a los resultados de cada etapa completada, para revisar el contenido extraído, el resumen generado o las flashcards creadas.

#### Acceptance Criteria

1. WHEN una etapa de Contenido se completa, THE Workflow System SHALL habilitar un botón "Ver Detalles" para esa etapa
2. WHEN una etapa de Resumen se completa, THE Workflow System SHALL habilitar botones "Ver Resumen" y "Copiar"
3. WHEN una etapa de Flashcards se completa, THE Workflow System SHALL habilitar botones "Ver Flashcards" y "Exportar"
4. WHEN el usuario hace clic en "Ver Detalles", THE Workflow System SHALL mostrar el contenido extraído en un modal o panel expandible
5. WHEN el usuario hace clic en "Copiar", THE Workflow System SHALL copiar el contenido al portapapeles y mostrar una confirmación


### Requirement 5

**User Story:** Como usuario, quiero poder eliminar documentos individuales de la cola de workflows, para remover archivos que subí por error o que ya no necesito procesar.

#### Acceptance Criteria

1. WHEN un documento está en la cola, THE Workflow System SHALL mostrar un botón de eliminar junto al nombre del documento
2. WHEN el usuario hace clic en el botón de eliminar, THE Workflow System SHALL remover el documento de la cola inmediatamente
3. IF el documento está siendo procesado actualmente, THE Workflow System SHALL cancelar el procesamiento antes de eliminarlo
4. THE Workflow System SHALL mostrar una confirmación visual cuando un documento es eliminado
5. WHEN un documento es eliminado, THE Workflow System SHALL liberar los recursos asociados (archivos temporales, estados en memoria)

### Requirement 6

**User Story:** Como usuario, quiero poder reintentar el procesamiento de un documento que falló, para recuperarme de errores temporales sin tener que subir el archivo nuevamente.

#### Acceptance Criteria

1. WHEN una etapa falla, THE Workflow System SHALL mostrar un botón "Reintentar" junto al mensaje de error
2. WHEN el usuario hace clic en "Reintentar", THE Workflow System SHALL reiniciar el procesamiento desde la etapa que falló
3. THE Workflow System SHALL mantener los resultados de las etapas anteriores exitosas
4. THE Workflow System SHALL limpiar el estado de error antes de reintentar
5. IF el reintento falla nuevamente, THE Workflow System SHALL mostrar el nuevo mensaje de error

### Requirement 7

**User Story:** Como usuario, quiero ver un resumen del estado general de todos mis workflows, para tener una visión rápida de cuántos están completados, en proceso o con errores.

#### Acceptance Criteria

1. THE Workflow System SHALL mostrar un contador de workflows totales en la interfaz
2. THE Workflow System SHALL mostrar cuántos workflows están completados exitosamente
3. THE Workflow System SHALL mostrar cuántos workflows están actualmente en procesamiento
4. THE Workflow System SHALL mostrar cuántos workflows tienen errores
5. THE Workflow System SHALL actualizar estos contadores en tiempo real conforme cambian los estados

### Requirement 8

**User Story:** Como usuario, quiero que el sistema maneje archivos grandes (>20MB) de manera transparente, para no tener que preocuparme por los detalles técnicos del procesamiento.

#### Acceptance Criteria

1. WHEN un archivo excede 20MB, THE Workflow System SHALL usar automáticamente la Files API de Gemini
2. WHILE un archivo grande está siendo procesado, THE Workflow System SHALL mostrar un mensaje informativo sobre el tiempo adicional requerido
3. THE Workflow System SHALL mostrar una barra de progreso específica para la carga de archivos grandes
4. WHEN la carga de un archivo grande se completa, THE Workflow System SHALL continuar con el procesamiento normal
5. IF la carga de un archivo grande falla, THE Workflow System SHALL mostrar un mensaje de error específico con opciones de reintento


### Requirement 9

**User Story:** Como usuario, quiero que mis workflows persistan entre sesiones del navegador, para poder cerrar la aplicación y volver más tarde sin perder mi progreso.

#### Acceptance Criteria

1. WHEN un workflow está en progreso, THE Workflow System SHALL guardar su estado en el almacenamiento local del navegador
2. WHEN el usuario cierra y reabre la aplicación, THE Workflow System SHALL restaurar todos los workflows guardados
3. THE Workflow System SHALL restaurar el estado exacto de cada etapa (completada, en proceso, error)
4. THE Workflow System SHALL restaurar los resultados de las etapas completadas
5. IF un workflow estaba en procesamiento al cerrar, THE Workflow System SHALL marcarlo como interrumpido y permitir reinicio

### Requirement 10

**User Story:** Como usuario, quiero poder exportar los resultados de múltiples workflows a la vez, para descargar todas mis flashcards o resúmenes en un solo archivo.

#### Acceptance Criteria

1. WHEN hay workflows completados, THE Workflow System SHALL mostrar una opción de exportación masiva
2. WHEN el usuario selecciona exportar, THE Workflow System SHALL permitir elegir qué etapas exportar (resúmenes, flashcards, o ambos)
3. THE Workflow System SHALL generar un archivo consolidado con todos los resultados seleccionados
4. THE Workflow System SHALL incluir metadatos como nombre del documento original y fecha de procesamiento
5. THE Workflow System SHALL permitir elegir el formato de exportación (JSON, Markdown, CSV para flashcards)

### Requirement 11

**User Story:** Como usuario, quiero recibir notificaciones cuando un workflow largo se complete, para no tener que estar monitoreando constantemente la interfaz.

#### Acceptance Criteria

1. WHEN un workflow completa todas sus etapas exitosamente, THE Workflow System SHALL mostrar una notificación toast
2. WHEN un workflow falla en alguna etapa, THE Workflow System SHALL mostrar una notificación de error
3. WHERE el navegador soporta notificaciones del sistema, THE Workflow System SHALL solicitar permiso para enviar notificaciones
4. WHERE el usuario ha otorgado permisos, THE Workflow System SHALL enviar notificaciones del sistema para workflows completados
5. THE Workflow System SHALL incluir el nombre del documento en cada notificación

### Requirement 12

**User Story:** Como usuario, quiero poder pausar y reanudar el procesamiento de workflows, para controlar el uso de mi cuota de API según mis necesidades.

#### Acceptance Criteria

1. WHEN hay workflows en procesamiento, THE Workflow System SHALL mostrar un botón "Pausar"
2. WHEN el usuario hace clic en "Pausar", THE Workflow System SHALL detener el procesamiento después de completar la etapa actual
3. WHILE el procesamiento está pausado, THE Workflow System SHALL mostrar un botón "Reanudar"
4. WHEN el usuario hace clic en "Reanudar", THE Workflow System SHALL continuar el procesamiento desde donde se detuvo
5. THE Workflow System SHALL mantener el estado de todos los workflows durante la pausa
