# Implementation Plan: Docker to Next.js Migration

- [x] 1. Consolidar dependencias en package.json root


  - Copiar todas las dependencias de `frontend/package.json` al `package.json` root (merge sin duplicados)
  - Copiar todas las dependencias de `backend/package.json` al `package.json` root (merge sin duplicados)
  - Actualizar scripts en `package.json` root: `dev`, `build`, `start`, `lint` para usar Next.js directamente
  - Eliminar scripts relacionados con Docker: `dev:turbo`, `dev:performance`, `dev:clean`, `stop`, `clean`, `logs`, `restart`
  - Ejecutar `npm install` para instalar todas las dependencias consolidadas
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 2. Mover archivos de configuración del frontend al root


  - Mover `frontend/next.config.js` al root (merge con existente si hay conflictos)
  - Mover `frontend/tailwind.config.ts` al root (merge con existente si hay conflictos)
  - Mover `frontend/tsconfig.json` al root (merge con existente si hay conflictos)
  - Mover `frontend/postcss.config.mjs` al root
  - Mover `frontend/.eslintrc.js` al root (merge con existente si hay conflictos)
  - Mover `frontend/components.json` al root si existe
  - Actualizar `next.config.js` para configurar `api.bodyParser.sizeLimit: '20mb'` para file uploads
  - _Requirements: 1.1, 8.1, 8.2_

- [x] 3. Mover estructura de carpetas del frontend al root


  - Mover contenido de `frontend/app/` a `app/` en el root (merge con existente)
  - Mover contenido de `frontend/components/` a `components/` en el root (merge con existente)
  - Mover contenido de `frontend/lib/` a `lib/` en el root (merge con existente)
  - Mover contenido de `frontend/public/` a `public/` en el root (merge con existente)
  - Mover contenido de `frontend/i18n/` a `i18n/` en el root (merge con existente)
  - Mover contenido de `frontend/messages/` a `messages/` en el root (merge con existente)
  - Mover contenido de `frontend/store/` a `store/` en el root (merge con existente)
  - Mover archivos de instrumentación: `frontend/instrumentation.ts`, `frontend/instrumentation-client.ts` al root
  - ~~Mover archivos de Sentry: `frontend/sentry.*.config.ts` al root~~ (Sentry ha sido eliminado del proyecto)
  - _Requirements: 1.2, 1.5_

- [x] 4. Migrar servicios del backend a lib/services/


  - Crear carpeta `lib/services/` si no existe
  - Migrar `backend/src/services/geminiClient.js` a `lib/services/geminiClient.ts` (convertir a TypeScript)
  - Migrar `backend/src/services/sessionManager.js` a `lib/services/sessionManager.ts` (convertir a TypeScript)
  - Migrar `backend/src/services/gemini-pdf-client.js` a `lib/services/gemini-pdf-client.ts` (convertir a TypeScript)
  - Adaptar imports de ES modules para que funcionen en Next.js
  - Mantener toda la lógica de negocio intacta (processFileForGemini, generateMultimodalContent, cleanupFile, etc.)
  - Exportar funciones y constantes necesarias (ERROR_TYPES, MAX_INLINE_FILE_SIZE, etc.)
  - _Requirements: 3.1, 3.3, 3.4_

- [x] 5. Migrar configuración del backend a lib/config/


  - Crear carpeta `lib/config/` si no existe
  - Migrar `backend/src/config/prompts.js` a `lib/config/prompts.ts` (convertir a TypeScript)
  - Mantener los prompts exactamente como están (notionPrompt y flashcardPrompt)
  - Exportar como constantes tipadas
  - _Requirements: 3.2_

- [x] 6. Crear tipos TypeScript para la aplicación


  - Crear `lib/types/api.ts` con interfaces: SummaryRequest, SummaryResponse, CondenseRequest, FlashcardsRequest, FlashcardsResponse, GenerationStats, ApiError, ErrorType
  - Crear `lib/types/gemini.ts` con interfaces: GeminiPart, FileProcessingResult, GeminiResponse, FileStatus
  - Crear `lib/config/limits.ts` con constantes: FILE_LIMITS (MAX_FILE_SIZE, MAX_INLINE_FILE_SIZE, ALLOWED_MIME_TYPES)
  - _Requirements: 8.3, 8.5_

- [x] 7. Actualizar API Route de summary para implementación directa


  - Modificar `app/api/summary/route.ts` para eliminar el proxy al backend
  - Importar servicios migrados: `geminiClient`, `prompts`
  - Implementar lógica directa: extraer FormData, validar API key, procesar archivos a buffers
  - Llamar a `generateMultimodalContent` con los parts y systemInstruction
  - Implementar cleanup de archivos subidos en caso de error
  - Mantener el mismo formato de respuesta: `{ notionMarkdown, stats }`
  - Mantener el mismo manejo de errores con errorType
  - Eliminar referencias a BACKEND_URL y USE_DEMO_CONTENT
  - _Requirements: 2.1, 2.5, 2.6, 2.7_

- [x] 8. Actualizar API Route de summary/condense para implementación directa


  - Modificar `app/api/summary/condense/route.ts` para eliminar el proxy al backend
  - Importar servicios migrados: `geminiClient`, `generateMultimodalContent`
  - Implementar lógica directa: extraer body JSON, validar API key, construir prompt según condensationType
  - Llamar a `generateMultimodalContent` con el prompt y contenido
  - Mantener el mismo formato de respuesta: `{ notionMarkdown, stats }`
  - Mantener el mismo manejo de errores
  - Eliminar referencias a BACKEND_URL y USE_DEMO_CONTENT
  - _Requirements: 2.2, 2.5_

- [x] 9. Actualizar API Route de flashcards para implementación directa


  - Modificar `app/api/flashcards/route.ts` para eliminar el proxy al backend
  - Importar servicios migrados: `geminiClient`, `prompts`
  - Implementar lógica directa: extraer FormData, validar API key, procesar archivo si existe
  - Llamar a `generateMultimodalContent` con flashcardPrompt
  - Mantener el mismo formato de respuesta: `{ flashcards, stats }`
  - Mantener el mismo manejo de errores
  - Eliminar referencias a BACKEND_URL y USE_DEMO_CONTENT
  - _Requirements: 2.3, 2.5, 2.6_

- [x] 10. Crear API Route de files/status


  - Crear carpeta `app/api/files/status/` si no existe
  - Crear `app/api/files/status/route.ts` con método GET
  - Importar `sessionManager` desde `lib/services/sessionManager`
  - Implementar validación de API key desde header 'X-User-API-Key'
  - Llamar a `sessionManager.getFileStatus(userApiKey)` y retornar el resultado
  - Mantener el formato de respuesta: `{ fileStatus }`
  - _Requirements: 2.4_

- [x] 11. Actualizar imports en toda la aplicación


  - Buscar y actualizar todos los imports que referencian `@/` para que apunten a las nuevas ubicaciones
  - Actualizar imports en componentes que referencian servicios o tipos
  - Actualizar imports en páginas que usan lib/ o services/
  - Verificar que no hay imports rotos ejecutando TypeScript compiler
  - _Requirements: 1.4, 8.2, 8.3_

- [x] 12. Consolidar variables de entorno


  - Crear archivo `.env.local` en el root si no existe
  - Copiar variables del backend (GEMINI_API_KEY, PORT, HOST, NODE_ENV)
  - Copiar variables del frontend (NEXT_PUBLIC_*, ~~SENTRY_*~~, BACKEND_URL)
  - Eliminar variable BACKEND_URL ya que no se necesita
  - ~~Variables SENTRY_* ya no son necesarias~~ (Sentry ha sido eliminado del proyecto)
  - Agregar prefijo NEXT_PUBLIC_ a variables que deben ser accesibles en el cliente
  - Crear `.env.example` con template de todas las variables necesarias
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 13. Eliminar archivos y carpetas de Docker


  - Eliminar `docker-compose.yaml` del root
  - Eliminar `docker-stack.yml` del root
  - Eliminar `optimize-docker.sh` del root
  - Eliminar carpeta `backend/` completa con todo su contenido
  - Eliminar carpeta `frontend/` completa con todo su contenido
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 14. Actualizar documentación principal


  - Actualizar `README.md` en el root para eliminar todas las referencias a Docker
  - Documentar nuevos comandos de desarrollo: `npm run dev`, `npm run build`, `npm run start`, `npm run lint`
  - Actualizar sección de "Getting Started" con instrucciones sin Docker
  - Documentar la estructura de carpetas consolidada del proyecto
  - Actualizar instrucciones de configuración de variables de entorno (.env.local)
  - Eliminar secciones sobre docker-compose, Dockerfile, contenedores
  - _Requirements: 9.1, 9.3, 9.4, 9.5, 9.7_

- [x] 15. Consolidar y actualizar documentación técnica

  - Mover contenido relevante de `frontend/docs/` a `docs/` en el root
  - Mover contenido relevante de `backend/docs/` a `docs/` en el root
  - Actualizar documentación para reflejar Next.js API Routes en lugar de Express
  - Eliminar referencias a arquitectura con Docker en toda la documentación
  - Documentar cómo funcionan las Next.js API Routes (en lugar del servidor Express)
  - Actualizar diagramas de arquitectura si existen
  - _Requirements: 9.2, 9.6, 9.7_

- [x] 16. Verificación final y validación



  - Ejecutar `npm install` para asegurar que todas las dependencias están instaladas
  - Ejecutar `npm run build` para verificar que la aplicación compila sin errores
  - Ejecutar `npm run dev` para verificar que la aplicación inicia correctamente
  - Verificar manualmente que la funcionalidad de upload de PDF funciona
  - Verificar manualmente que la funcionalidad de upload de imágenes funciona
  - Verificar manualmente que la generación de resúmenes funciona
  - Verificar manualmente que la condensación de resúmenes funciona
  - Verificar manualmente que la generación de flashcards funciona
  - Verificar manualmente que el cambio de idioma (i18n) funciona
  - Verificar manualmente que el cambio de tema (dark/light) funciona
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_
