# Documento de Requisitos

## Introducción

Esta especificación define la migración completa de Vercel AI SDK (`ai` y `@ai-sdk/google`) a la SDK nativa de Google GenAI (`@google/genai`). La migración permitirá aprovechar todas las capacidades nativas de la API de Gemini, incluyendo funcionalidades avanzadas como File Search, mejor manejo de archivos, y acceso directo a todas las características de la plataforma Google AI sin las limitaciones o abstracciones del SDK de Vercel.

## Glosario

- **Vercel AI SDK**: SDK de abstracción de Vercel que proporciona una interfaz unificada para múltiples proveedores de IA
- **Google GenAI SDK**: SDK oficial y nativo de Google para interactuar con la API de Gemini (`@google/genai`)
- **StudyApp**: La aplicación Next.js que procesa documentos para generar resúmenes y flashcards
- **Gemini API**: API de Google para modelos de inteligencia artificial generativa
- **Part**: Componente individual de contenido multimodal (texto, imagen, archivo) en la API de Gemini
- **GenerateContentResponse**: Respuesta de la API de Gemini que contiene el texto generado y metadatos
- **AbortSignal**: Mecanismo estándar de JavaScript para cancelar operaciones asíncronas
- **API Route**: Endpoint del servidor en Next.js que maneja solicitudes HTTP
- **geminiClient**: Servicio actual que abstrae las llamadas a la API de Gemini usando Vercel AI SDK
- **Files API**: API de Gemini para manejar archivos grandes mediante carga y referencia por URI
- **InlineData**: Método de envío de archivos pequeños directamente en la solicitud como base64

## Requisitos

### Requisito 1

**User Story:** Como desarrollador, quiero reemplazar completamente Vercel AI SDK con Google GenAI SDK en el servicio geminiClient para tener acceso directo a todas las funcionalidades nativas de Gemini.

#### Acceptance Criteria

1. WHEN se inicializa el cliente de Gemini, THE StudyApp SHALL usar GoogleGenAI de @google/genai en lugar de google de @ai-sdk/google
2. WHEN se realiza una llamada a generateContent, THE StudyApp SHALL usar el método nativo models.generateContent de Google GenAI SDK
3. WHEN se procesa contenido multimodal, THE StudyApp SHALL construir el array de Parts usando la estructura nativa de Google GenAI SDK
4. WHEN se configura el modelo, THE StudyApp SHALL usar gemini-2.5-flash como modelo predeterminado en lugar de gemini-2.5-flash-lite
5. WHERE se requiere cancelación de solicitudes, THE StudyApp SHALL implementar soporte para AbortSignal en todas las funciones de generación

### Requisito 2

**User Story:** Como desarrollador, quiero refactorizar la función generateMultimodalContent para usar exclusivamente Google GenAI SDK y eliminar la dependencia de Vercel AI SDK.

#### Acceptance Criteria

1. WHEN se llama a generateMultimodalContent, THE StudyApp SHALL usar GoogleGenAI.models.generateContent en lugar de generateText de Vercel AI SDK
2. WHEN se construyen los Parts para la solicitud, THE StudyApp SHALL usar la estructura { text: string } o { inlineData: { data: string, mimeType: string } } nativa de Google
3. WHEN se procesa la respuesta, THE StudyApp SHALL extraer el texto usando response.text() del objeto GenerateContentResponse
4. WHEN se extraen métricas de uso, THE StudyApp SHALL acceder a response.usageMetadata con las propiedades promptTokenCount, candidatesTokenCount y totalTokenCount
5. IF ocurre un error durante la generación, THEN THE StudyApp SHALL mapear los errores nativos de Google GenAI SDK a los tipos de error existentes (QUOTA_EXCEEDED, INVALID_API_KEY, etc.)

### Requisito 3

**User Story:** Como desarrollador, quiero actualizar el manejo de archivos para usar exclusivamente la Files API nativa de Google GenAI SDK sin abstracciones de Vercel.

#### Acceptance Criteria

1. WHEN se procesa un archivo pequeño (menor a 20MB), THE StudyApp SHALL usar inlineData con el contenido en base64 directamente
2. WHEN se procesa un archivo grande (mayor a 20MB), THE StudyApp SHALL usar ai.files.upload del Google GenAI SDK para cargar el archivo
3. WHEN se espera el procesamiento de un archivo, THE StudyApp SHALL usar ai.files.get para verificar el estado del archivo hasta que sea PROCESSED
4. WHEN se construye un Part con archivo cargado, THE StudyApp SHALL usar la estructura { fileData: { fileUri: string, mimeType: string } }
5. WHEN se limpia un archivo después del procesamiento, THE StudyApp SHALL usar ai.files.delete para eliminar el archivo de la Files API

### Requisito 4

**User Story:** Como desarrollador, quiero actualizar las API routes de summary y flashcards para usar las nuevas funciones refactorizadas con Google GenAI SDK.

#### Acceptance Criteria

1. WHEN se recibe una solicitud en /api/summary, THE StudyApp SHALL llamar a las funciones refactorizadas que usan Google GenAI SDK exclusivamente
2. WHEN se recibe una solicitud en /api/flashcards, THE StudyApp SHALL llamar a las funciones refactorizadas que usan Google GenAI SDK exclusivamente
3. WHEN se procesa una respuesta exitosa, THE StudyApp SHALL retornar el mismo formato de respuesta JSON que antes para mantener compatibilidad con el frontend
4. WHEN se extraen estadísticas de uso, THE StudyApp SHALL mapear usageMetadata de Google GenAI SDK al formato stats existente (promptTokens, candidatesTokens, totalTokens)
5. WHERE se manejan errores, THE StudyApp SHALL mantener los mismos tipos de error y códigos de estado HTTP para compatibilidad con el frontend

### Requisito 5

**User Story:** Como desarrollador, quiero implementar soporte para AbortSignal en todas las funciones de generación para permitir cancelación de solicitudes.

#### Acceptance Criteria

1. WHEN se define una función de generación, THE StudyApp SHALL aceptar un parámetro opcional signal de tipo AbortSignal
2. WHEN se inicia una solicitud a la API, THE StudyApp SHALL verificar si signal.aborted es true antes de proceder
3. WHEN se está esperando una respuesta, THE StudyApp SHALL escuchar el evento abort del signal y rechazar la promesa con Error('Aborted')
4. WHEN se cancela una solicitud, THE StudyApp SHALL limpiar cualquier recurso asociado como archivos cargados a la Files API
5. WHERE se usa Promise.race, THE StudyApp SHALL incluir una promesa que se rechaza cuando se dispara el evento abort del signal

### Requisito 6

**User Story:** Como desarrollador, quiero eliminar todas las dependencias de Vercel AI SDK del proyecto y actualizar package.json.

#### Acceptance Criteria

1. WHEN se actualiza package.json, THE StudyApp SHALL remover las dependencias ai y @ai-sdk/google
2. WHEN se verifica @google/genai, THE StudyApp SHALL asegurar que la versión instalada sea compatible con las funcionalidades requeridas
3. WHEN se eliminan imports, THE StudyApp SHALL remover todas las referencias a import { generateText } from 'ai' y import { google } from '@ai-sdk/google'
4. WHEN se ejecuta npm install, THE StudyApp SHALL instalar solo las dependencias necesarias sin paquetes de Vercel AI SDK
5. WHEN se compila el proyecto, THE StudyApp SHALL verificar que no existan errores de TypeScript relacionados con tipos de Vercel AI SDK

### Requisito 7

**User Story:** Como desarrollador, quiero mantener la compatibilidad con el frontend existente para que no se requieran cambios en los componentes de React.

#### Acceptance Criteria

1. WHEN el frontend llama a apiClient.processSummary, THE StudyApp SHALL retornar el mismo formato de respuesta { notionMarkdown, stats } que antes
2. WHEN el frontend llama a apiClient.processFlashcards, THE StudyApp SHALL retornar el mismo formato de respuesta { flashcards, stats } que antes
3. WHEN ocurre un error, THE StudyApp SHALL retornar el mismo formato de error { error, errorType } con los mismos tipos de error
4. WHEN se procesan archivos, THE StudyApp SHALL aceptar el mismo formato de FormData que el frontend envía actualmente
5. WHERE se incluyen estadísticas, THE StudyApp SHALL mantener los nombres de propiedades existentes (promptTokens, candidatesTokens, totalTokens, generationTimeMs)

### Requisito 8

**User Story:** Como desarrollador, quiero actualizar la función generateText helper para usar Google GenAI SDK y mantener la misma interfaz.

#### Acceptance Criteria

1. WHEN se llama a generateText con un prompt de texto, THE StudyApp SHALL usar ai.models.generateContent con contents: prompt
2. WHEN se configura la generación, THE StudyApp SHALL usar config con temperature, maxOutputTokens, topP y topK nativos de Google GenAI SDK
3. WHEN se recibe la respuesta, THE StudyApp SHALL extraer y retornar solo el texto usando response.text()
4. WHEN se pasa un AbortSignal, THE StudyApp SHALL implementar el mecanismo de cancelación usando Promise.race
5. IF el signal está aborted antes de iniciar, THEN THE StudyApp SHALL lanzar Error('Aborted') inmediatamente sin hacer la llamada a la API

### Requisito 9

**User Story:** Como desarrollador, quiero actualizar la función generateSummaryFromParts para usar Google GenAI SDK con soporte completo para multimodal.

#### Acceptance Criteria

1. WHEN se llama a generateSummaryFromParts con un array de Parts, THE StudyApp SHALL usar ai.models.generateContent con contents: { parts }
2. WHEN los Parts incluyen texto, THE StudyApp SHALL usar la estructura { text: string } nativa de Google GenAI SDK
3. WHEN los Parts incluyen archivos inline, THE StudyApp SHALL usar la estructura { inlineData: { data: string, mimeType: string } }
4. WHEN los Parts incluyen archivos cargados, THE StudyApp SHALL usar la estructura { fileData: { fileUri: string, mimeType: string } }
5. WHEN se recibe la respuesta, THE StudyApp SHALL extraer el texto usando response.text() y validar que no esté vacío

### Requisito 10

**User Story:** Como desarrollador, quiero actualizar los tipos TypeScript para reflejar las interfaces nativas de Google GenAI SDK.

#### Acceptance Criteria

1. WHEN se define el tipo Part, THE StudyApp SHALL usar los tipos nativos de @google/genai en lugar de tipos personalizados
2. WHEN se define el tipo GenerateContentResponse, THE StudyApp SHALL importar y usar el tipo nativo de @google/genai
3. WHEN se definen interfaces de configuración, THE StudyApp SHALL usar GenerateContentConfig de @google/genai
4. WHEN se trabaja con archivos, THE StudyApp SHALL usar los tipos File y FileMetadata de @google/genai
5. WHERE se requieren tipos personalizados, THE StudyApp SHALL extender los tipos nativos en lugar de redefinirlos completamente
