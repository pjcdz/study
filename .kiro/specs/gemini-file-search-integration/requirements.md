# Documento de Requisitos

## Introducción

Esta especificación define la integración de File Search con Gemini 2.5 Flash en StudyApp. File Search es una funcionalidad de la API de Gemini que permite Retrieval Augmented Generation (RAG) mediante la importación, fragmentación e indexación automática de documentos para búsquedas semánticas. Esta integración mejorará significativamente la capacidad de la aplicación para analizar y recuperar información relevante de documentos cargados, permitiendo respuestas más precisas basadas en el contexto de múltiples archivos.

## Glosario

- **File Search**: Herramienta de la API de Gemini que permite búsquedas semánticas sobre documentos indexados
- **File Search Store**: Contenedor persistente que almacena los embeddings de documentos indexados
- **RAG (Retrieval Augmented Generation)**: Técnica que combina recuperación de información con generación de texto
- **Embedding**: Representación numérica vectorial que captura el significado semántico del texto
- **Semantic Search**: Búsqueda que comprende el significado y contexto de las consultas, no solo palabras clave
- **StudyApp**: La aplicación Next.js que procesa documentos para generar resúmenes y flashcards
- **Gemini API**: API de Google para modelos de inteligencia artificial generativa
- **File Search Document**: Documento individual importado y procesado dentro de un File Search Store
- **Chunking**: Proceso de dividir documentos en fragmentos más pequeños para indexación
- **Citation**: Referencia específica a las partes de documentos usadas para generar una respuesta
- **Grounding Metadata**: Metadatos que especifican qué fragmentos de documentos se usaron en la respuesta

## Requisitos

### Requisito 1

**User Story:** Como usuario de StudyApp, quiero poder crear y gestionar File Search Stores para organizar mis documentos por temas o proyectos, de manera que pueda mantener colecciones separadas de material de estudio.

#### Acceptance Criteria

1. WHEN el usuario accede a la sección de File Search, THE StudyApp SHALL mostrar una lista de todos los File Search Stores existentes con sus nombres y cantidad de documentos
2. WHEN el usuario solicita crear un nuevo File Search Store, THE StudyApp SHALL permitir ingresar un nombre descriptivo y crear el store mediante la API de Gemini
3. WHEN el usuario selecciona un File Search Store existente, THE StudyApp SHALL mostrar los detalles del store incluyendo documentos contenidos y metadatos
4. WHEN el usuario solicita eliminar un File Search Store, THE StudyApp SHALL solicitar confirmación y eliminar el store junto con todos sus documentos indexados
5. WHERE el usuario tiene múltiples File Search Stores, THE StudyApp SHALL permitir cambiar entre stores activos para operaciones de carga y búsqueda

### Requisito 2

**User Story:** Como usuario, quiero cargar documentos directamente a un File Search Store para que sean indexados automáticamente y estén disponibles para búsquedas semánticas.

#### Acceptance Criteria

1. WHEN el usuario selecciona archivos para cargar, THE StudyApp SHALL validar que los tipos de archivo sean compatibles con File Search antes de iniciar la carga
2. WHEN el usuario inicia la carga de documentos, THE StudyApp SHALL usar el método uploadToFileSearchStore para cargar e importar archivos simultáneamente al File Search Store activo
3. WHILE los documentos están siendo procesados, THE StudyApp SHALL mostrar el estado de procesamiento en tiempo real consultando el estado de las operaciones
4. WHEN la importación de un documento se completa exitosamente, THE StudyApp SHALL actualizar la interfaz para reflejar que el documento está disponible para búsquedas
5. IF la carga o importación de un documento falla, THEN THE StudyApp SHALL mostrar un mensaje de error específico y permitir reintentar la operación
6. WHERE el usuario desea control sobre la fragmentación, THE StudyApp SHALL permitir configurar parámetros de chunking como max_tokens_per_chunk y max_overlap_tokens

### Requisito 3

**User Story:** Como usuario, quiero realizar búsquedas semánticas sobre mis documentos indexados para obtener respuestas precisas basadas en el contenido de múltiples archivos.

#### Acceptance Criteria

1. WHEN el usuario ingresa una consulta de búsqueda, THE StudyApp SHALL enviar la consulta a Gemini 2.5 Flash con el File Search Store activo como herramienta
2. WHEN Gemini genera una respuesta, THE StudyApp SHALL mostrar el texto de respuesta junto con las citaciones que indican qué documentos se usaron
3. WHERE el usuario tiene metadatos personalizados en documentos, THE StudyApp SHALL permitir filtrar búsquedas usando metadata_filter para buscar en subconjuntos específicos
4. WHEN se recibe una respuesta con grounding_metadata, THE StudyApp SHALL mostrar las citaciones de manera clara indicando el documento fuente y fragmento relevante
5. WHILE se procesa una búsqueda, THE StudyApp SHALL mostrar un indicador de carga y permitir cancelar la operación si es necesario

### Requisito 4

**User Story:** Como usuario, quiero agregar metadatos personalizados a mis documentos para poder filtrar y organizar mejor mi material de estudio.

#### Acceptance Criteria

1. WHEN el usuario carga un documento, THE StudyApp SHALL permitir agregar metadatos personalizados como pares clave-valor antes de la importación
2. WHEN el usuario define metadatos, THE StudyApp SHALL validar que las claves sean únicas y los valores sean del tipo correcto (string o numeric)
3. WHERE el usuario realiza una búsqueda, THE StudyApp SHALL permitir aplicar filtros basados en metadatos usando sintaxis de filtro compatible con AIP-160
4. WHEN el usuario visualiza documentos en un File Search Store, THE StudyApp SHALL mostrar los metadatos asociados a cada documento
5. WHEN el usuario edita metadatos de un documento existente, THE StudyApp SHALL actualizar los metadatos sin necesidad de re-indexar el documento completo

### Requisito 5

**User Story:** Como usuario, quiero integrar File Search con las funcionalidades existentes de resúmenes y flashcards para mejorar la calidad de los contenidos generados.

#### Acceptance Criteria

1. WHEN el usuario genera un resumen, THE StudyApp SHALL ofrecer la opción de usar File Search como contexto adicional para enriquecer el resumen
2. WHEN File Search está habilitado para resúmenes, THE StudyApp SHALL incluir el File Search Store activo como herramienta en la llamada a generateContent
3. WHEN el usuario genera flashcards, THE StudyApp SHALL permitir usar File Search para crear tarjetas basadas en múltiples documentos relacionados
4. WHERE File Search proporciona contexto adicional, THE StudyApp SHALL indicar visualmente que la respuesta está fundamentada en documentos indexados
5. WHEN se generan contenidos con File Search, THE StudyApp SHALL incluir citaciones que permitan al usuario verificar las fuentes de información

### Requisito 6

**User Story:** Como usuario, quiero gestionar el almacenamiento y los límites de mi cuenta para evitar exceder las cuotas de File Search.

#### Acceptance Criteria

1. WHEN el usuario accede a la sección de configuración, THE StudyApp SHALL mostrar el uso actual de almacenamiento en File Search Stores
2. WHEN el usuario está cerca de alcanzar los límites de almacenamiento, THE StudyApp SHALL mostrar una advertencia indicando el porcentaje de uso
3. IF el usuario intenta cargar un documento que excedería los límites, THEN THE StudyApp SHALL prevenir la carga y mostrar un mensaje explicativo
4. WHEN el usuario visualiza sus File Search Stores, THE StudyApp SHALL mostrar el tamaño aproximado de cada store
5. WHERE un File Search Store excede 20 GB, THE StudyApp SHALL mostrar una recomendación para dividir el contenido en múltiples stores para optimizar latencia

### Requisito 7

**User Story:** Como usuario, quiero que la aplicación maneje errores de manera clara cuando hay problemas con File Search para entender qué salió mal y cómo solucionarlo.

#### Acceptance Criteria

1. IF la API de Gemini retorna un error de cuota excedida, THEN THE StudyApp SHALL mostrar un mensaje específico indicando que se alcanzó el límite de almacenamiento
2. IF un documento no puede ser procesado por File Search, THEN THE StudyApp SHALL mostrar el motivo del fallo y sugerir acciones correctivas
3. WHEN ocurre un error de red durante operaciones de File Search, THE StudyApp SHALL reintentar automáticamente hasta 2 veces antes de mostrar error al usuario
4. IF la API Key del usuario no tiene permisos para File Search, THEN THE StudyApp SHALL mostrar un mensaje claro indicando que debe habilitar File Search en su cuenta de Google Cloud
5. WHEN hay errores durante la indexación, THE StudyApp SHALL registrar detalles del error en logs para facilitar debugging sin exponer información sensible al usuario
