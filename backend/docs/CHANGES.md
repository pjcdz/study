# Registro de Cambios - Actualización Multimodal

## Resumen de Cambios

Esta actualización migra Study Tool para utilizar gemini-1.5-pro-latest con capacidades multimodales y permite que cada usuario proporcione su propia API Key de Google AI Studio.

## 1. Archivos Modificados

### geminiClient.js
- Actualizado para usar el modelo "gemini-1.5-pro-latest"
- Implementado soporte para contenido multimodal (texto + archivos)
- Agregada función `fileToGenerativePart` para convertir archivos a formato base64
- Implementada nueva función principal `generateMultimodalContent` que acepta API Key del usuario
- Mantenida compatibilidad con `callGemini` para código existente

### app.js
- Agregado soporte para manejo de archivos con multer
- Configurado middleware de validación de API Key de usuario
- Actualizado CORS para permitir cabecera X-User-API-Key
- Modificado enrutamiento para incluir manejo de archivos en endpoints

### summaryController.js
- Modificado para procesar contenido multimodal (texto y/o archivos)
- Actualizado para usar la API Key del usuario
- Implementado manejo específico para diferentes tipos de archivos
- Mejorado el manejo de errores con códigos HTTP más precisos

### flashcardsController.js
- Reescrito para soportar contenido multimodal
- Actualizado para usar la API Key del usuario
- Agregado soporte para generar flashcards a partir de PDFs o imágenes

### prompts.js
- Adaptados los prompts para procesar contenido multimodal
- Mejoradas las instrucciones para el análisis de elementos visuales

### package.json
- Agregada dependencia "@google/generative-ai": "^0.2.1"

## 2. Archivos Nuevos

### docs/MULTIMODAL_UPDATE.md
- Documentación detallada sobre la actualización y sus características
- Guía para entender los cambios en la arquitectura y endpoints

### docs/FRONTEND_INTEGRATION.md
- Guía completa para integrar las nuevas funcionalidades en el frontend
- Ejemplos de código para gestión de API Keys y manejo de archivos

### scripts/update-multimodal.sh
- Script para Linux/Mac para instalar las nuevas dependencias

### scripts/update-multimodal.cmd
- Script para Windows para instalar las nuevas dependencias

## 3. Características Principales Añadidas

1. **Procesamiento Multimodal**:
   - Soporte para PDFs e imágenes junto con texto
   - Análisis visual inteligente y extracción de información

2. **API Key de Usuario**:
   - Cada usuario debe proporcionar su propia API Key
   - Mayor seguridad al no almacenar claves en el backend
   - Transparencia en el uso de recursos de IA

3. **Mejoras en los Endpoints**:
   - Soporte para subida de archivos en formato multipart/form-data
   - Validación mejorada de tipos de archivo
   - Opciones ampliadas para condensar resúmenes

4. **Seguridad Mejorada**:
   - Validación de archivos por tipo MIME
   - Límites de tamaño de archivo (20MB)
   - Manejo seguro de API Keys de usuarios

## 4. Cambios en la Configuración

- Eliminada dependencia de variable de entorno GEMINI_API_KEY
- Los usuarios ahora deben proporcionar su propia API Key
- Actualizada la cabecera CORS para permitir X-User-API-Key

## 5. Instrucciones de Despliegue

1. Ejecutar script de actualización:
   ```bash
   # Linux/Mac
   ./scripts/update-multimodal.sh
   
   # Windows
   scripts\update-multimodal.cmd
   ```

2. Asegurarse de que multer esté correctamente instalado

3. Reiniciar el servicio del backend

4. Actualizar el frontend para solicitar y gestionar API Keys de usuarios

## 6. Consideraciones de Migración

- El código mantiene compatibilidad con la función `callGemini` anterior
- Las solicitudes antiguas que no usen la cabecera X-User-API-Key seguirán utilizando la variable de entorno GEMINI_API_KEY si está disponible
- Para migración completa, se recomienda actualizar tanto el backend como el frontend
