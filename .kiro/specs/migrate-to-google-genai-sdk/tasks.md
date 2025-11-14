# Plan de Implementación

- [x] 1. Preparar el entorno y actualizar dependencias


  - Remover dependencias de Vercel AI SDK de package.json (ai, @ai-sdk/google)
  - Verificar que @google/genai esté instalado y actualizado
  - Ejecutar npm install para actualizar node_modules
  - Verificar que no haya errores de compilación TypeScript
  - _Requirements: 1.1, 1.2, 6.1, 6.4_

- [x] 2. Crear función makeApiCall con soporte para AbortSignal


  - Crear nueva función makeApiCall en geminiClient.ts que acepte Promise y AbortSignal
  - Implementar verificación de signal.aborted antes de iniciar
  - Implementar listener para evento abort que rechace la promesa
  - Usar Promise.race para competir entre API call y abort
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [x] 3. Refactorizar función generateText


  - Reemplazar import de generateText from 'ai' con GoogleGenAI
  - Actualizar inicialización para usar new GoogleGenAI({ apiKey })
  - Cambiar llamada a usar ai.models.generateContent con contents: prompt
  - Agregar parámetro signal: AbortSignal opcional
  - Integrar makeApiCall para soporte de cancelación
  - Actualizar extracción de respuesta para usar response.text
  - Implementar manejo de errores con handleGeminiError
  - _Requirements: 1.1, 1.2, 1.3, 5.1, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 4. Crear función generateSummaryFromParts


  - Crear nueva función que acepte parts: Part[], signal: AbortSignal, apiKey: string
  - Inicializar GoogleGenAI con apiKey del usuario
  - Construir llamada a ai.models.generateContent con contents: { parts }
  - Integrar makeApiCall para soporte de cancelación
  - Extraer y validar texto de respuesta
  - Implementar manejo de errores
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 5. Refactorizar función generateMultimodalContent


  - Eliminar todo el código relacionado con Vercel AI SDK
  - Eliminar función de fallback generateMultimodalContentFallback
  - Reemplazar con implementación usando GoogleGenAI nativo
  - Construir contentParts incluyendo systemInstruction si existe
  - Usar ai.models.generateContent con config nativo (temperature, maxOutputTokens, topP, topK)
  - Agregar soporte opcional para AbortSignal
  - Actualizar extracción de usageMetadata usando promptTokenCount, candidatesTokenCount, totalTokenCount
  - Mantener mismo formato de retorno GenerationResult
  - Implementar manejo de errores con handleGeminiError
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1_

- [x] 6. Refactorizar función processFileForGemini


  - Actualizar lógica para archivos pequeños usando inlineData con base64
  - Para archivos grandes, usar ai.files.upload nativo de GoogleGenAI
  - Actualizar polling de estado usando ai.files.get
  - Mantener integración con sessionManager para tracking
  - Retornar Part con estructura { fileData: { fileUri, mimeType } } para archivos grandes
  - Retornar Part con estructura { inlineData: { data, mimeType } } para archivos pequeños
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 7. Refactorizar función cleanupFile


  - Actualizar para usar ai.files.delete de GoogleGenAI
  - Mantener integración con sessionManager.removeFileTracking
  - Mantener manejo de errores existente
  - _Requirements: 3.5_

- [x] 8. Crear función handleGeminiError para mapeo de errores

  - Crear función que mapee errores nativos de Google GenAI SDK a ERROR_TYPES
  - Detectar y mapear errores de API key inválida (INVALID_API_KEY)
  - Detectar y mapear errores de cuota excedida (QUOTA_EXCEEDED)
  - Detectar y mapear errores de red (NETWORK_ERROR)
  - Detectar y mapear errores de abort (mensaje 'Aborted')
  - Agregar caso default para errores desconocidos (UNKNOWN_ERROR)
  - Incluir códigos de estado HTTP apropiados en cada error
  - _Requirements: 2.5, 7.3_

- [x] 9. Actualizar API route /api/summary


  - Verificar que usa las funciones refactorizadas de geminiClient
  - Confirmar que mantiene el mismo formato de respuesta { notionMarkdown, stats }
  - Verificar que stats incluye generationTimeMs, promptTokens, candidatesTokens, totalTokens
  - Confirmar que manejo de errores retorna mismo formato { error, errorType }
  - Verificar que acepta mismo formato de FormData del frontend
  - _Requirements: 4.1, 4.3, 4.4, 4.5, 7.1, 7.4, 7.5_

- [x] 10. Actualizar API route /api/flashcards


  - Verificar que usa las funciones refactorizadas de geminiClient
  - Confirmar que mantiene el mismo formato de respuesta { flashcards, stats }
  - Verificar que stats incluye las mismas propiedades que antes
  - Confirmar que manejo de errores retorna mismo formato { error, errorType }
  - Verificar que acepta mismo formato de FormData del frontend
  - _Requirements: 4.2, 4.3, 4.4, 4.5, 7.2, 7.4, 7.5_

- [x] 11. Actualizar tipos TypeScript en lib/types/gemini.ts


  - Importar tipos nativos Part, GenerateContentResponse de @google/genai
  - Eliminar definiciones duplicadas de tipos que ya existen en @google/genai
  - Actualizar GeminiPart para usar o extender Part nativo
  - Actualizar GeminiResponse para usar tipos nativos en stats
  - Mantener tipos personalizados solo donde sea necesario (FileStatus, etc)
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 12. Eliminar imports y código obsoleto de Vercel AI SDK

  - Remover import { generateText } from 'ai' de geminiClient.ts
  - Remover import { google } from '@ai-sdk/google' de geminiClient.ts
  - Eliminar cualquier referencia a process.env.GOOGLE_GENERATIVE_AI_API_KEY
  - Eliminar código de fallback y funciones obsoletas
  - Limpiar comentarios que referencien Vercel AI SDK
  - _Requirements: 6.3_

- [x] 13. Actualizar constante MODEL_NAME

  - Cambiar MODEL_NAME de 'gemini-2.5-flash-lite' a 'gemini-2.5-flash'
  - Verificar que todas las referencias usen la constante actualizada
  - _Requirements: 1.4_

- [x] 14. Verificar compilación y ejecutar build


  - Ejecutar npm run build para verificar que no hay errores de TypeScript
  - Corregir cualquier error de tipos relacionado con la migración
  - Verificar que no quedan referencias a tipos de Vercel AI SDK
  - _Requirements: 6.5_

- [x] 15. Pruebas manuales de funcionalidad


  - Probar carga de texto simple y generación de resumen
  - Probar carga de archivo pequeño (< 20MB) y verificar uso de inlineData
  - Probar carga de archivo grande (> 20MB) y verificar uso de Files API
  - Probar generación de flashcards con texto
  - Probar generación de flashcards con archivo
  - Verificar que el frontend muestra correctamente las respuestas
  - Verificar que los errores se muestran correctamente en el frontend
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 16. Verificar compatibilidad con frontend


  - Confirmar que apiClient.processSummary retorna formato esperado
  - Confirmar que apiClient.processFlashcards retorna formato esperado
  - Verificar que errores mantienen mismo formato y tipos
  - Probar flujo completo desde frontend hasta respuesta
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
