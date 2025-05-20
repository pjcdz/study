# Preparación para Pull Request y Despliegue a Producción

[![Google Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-blue)](https://ai.google.dev/models/gemini)
[![Sentry](https://img.shields.io/badge/Monitoring-Sentry-purple)](https://sentry.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

## 📋 Resumen de Cambios

La actualización introduce soporte completo para Gemini 1.5 Pro con capacidades multimodales y el nuevo modelo de API Key del usuario:

### Backend
- Implementación de procesamiento multimodal para texto, PDFs e imágenes
- Cambio al modelo de API Key proporcionada por el usuario
- Actualización de endpoints para soportar formato multipart/form-data
- Nueva configuración de multer para manejo de archivos

### Frontend  
- Nuevo componente MultimodalUploader para subir archivos y texto
- Implementación del sistema de gestión y almacenamiento de API Keys
- Actualización de los clientes API para soportar envío multimodal
- Mejoras en el manejo de errores específicos
- Integración de Sentry para monitorización de errores

## ✅ Pre-deployment Checklist

### Docker
- [ ] **Actualizar Dockerfiles de producción** con los cambios aplicados a los Dockerfiles de desarrollo:
  - [ ] Nuevas dependencias como `multer` y versión actualizada de `@google/generative-ai`
  - [ ] Configuración para manejo de archivos multimodales
  - [ ] Ajustes en volúmenes para almacenamiento temporal de archivos
  - [ ] Eliminar `GEMINI_API_KEY` de las variables de entorno requeridas

### Backend
- [ ] Verificar que `@google/generative-ai` esté actualizado a la versión ^0.2.1
- [ ] Confirmar que `multer` esté correctamente configurado
- [ ] Asegurar que app.js tenga los middlewares de CORS para `X-User-API-Key`
- [ ] Verificar que la variable `GEMINI_API_KEY` no sea obligatoria
- [ ] Confirmar pruebas de endpoints con archivos y sin archivos

### Frontend
- [ ] Revisar la implementación del hook `useApiKey`
- [ ] Verificar el componente MultimodalUploader
- [ ] Confirmar que las rutas API (summary, flashcards) pasen correctamente la API Key
- [ ] Asegurar que el manejo de errores de API incluya casos para API Key inválida
- [ ] Verificar la configuración correcta de Sentry en todos los entornos (client, server, edge)

## 🚀 Instrucciones de Despliegue

### Configuración de Secretos en GitHub

1. Configura los siguientes secretos en GitHub:
   - `VPS_HOST`: Hostname del servidor
   - `VPS_USER`: Usuario SSH
   - `DEPLOY_SSH_PRIVATE_KEY`: Clave SSH privada
   - `SENTRY_AUTH_TOKEN`: Token de autenticación de Sentry para carga de source maps

2. **Importante**: Ya no es necesario incluir `GEMINI_API_KEY` como secreto de GitHub

### Backend
1. Actualizar los Dockerfiles de producción desde los de desarrollo:
   ```bash
   # Ejemplo para revisar diferencias
   diff backend/Dockerfile.dev backend/Dockerfile
   ```

2. Ejecutar el script de actualización según el sistema:
   ```bash
   # Linux/Mac
   ./backend/scripts/update-multimodal.sh
   
   # Windows
   backend\scripts\update-multimodal.cmd
   ```
   
3. Actualizar las configuraciones de Docker:
   ```yaml
   # docker-compose.yaml y docker-stack.yml
   # - Eliminar GEMINI_API_KEY como variable de entorno
   # - Asegurar que los volúmenes para archivos temporales estén configurados
   ```

4. Hacer el deploy con Docker Swarm:
   ```bash
   docker stack deploy --with-registry-auth -c docker-stack.yml study-tool
   ```

### Frontend
1. Construir la aplicación:
   ```bash
   cd frontend
   npm run build
   ```

2. Desplegar utilizando el flujo CI/CD configurado:
   ```bash
   git push origin main
   ```

## 🔍 Verificación Post-despliegue

1. Verificar que la página `/api` solicite correctamente la API Key al usuario
2. Probar la subida de archivos PDF y de imágenes junto con texto
3. Verificar el procesamiento completo del flujo hasta la generación de flashcards
4. Comprobar que los errores de API Key inválida se muestren correctamente al usuario
5. Confirmar que las métricas de Sentry estén capturando correctamente los errores

## 📝 Notas Adicionales

- Los usuarios necesitarán configurar su propia API Key de Google AI Studio
- La documentación actualizada está disponible en:
  - [MULTIMODAL_UPDATE.md](./backend/docs/MULTIMODAL_UPDATE.md)
  - [FRONTEND_INTEGRATION.md](./backend/docs/FRONTEND_INTEGRATION.md)
- El token de Sentry es necesario para que los source maps se suban correctamente y facilitar el diagnóstico de errores en producción

## 📊 Configuración de Sentry

La configuración de Sentry en el proyecto está preparada para la carga de source maps durante el despliegue, con optimizaciones para entornos de producción:

- Tasa de muestreo reducida en producción (10% de trazas)
- Grabación de sesiones optimizada (1% en sesiones normales, 50% en sesiones con errores)
- Configuración adecuada del entorno y release para una mejor agrupación de errores

## 📓 Cambios Principales en la Arquitectura

### Diagrama de Flujo de Datos Actualizado

```
Frontend con API Key de Usuario
        │
        ▼
   HTTP Request 
(archivo/texto + API Key en Header)
        │
        ▼
    Express App
        │
        ▼
   Controladores
        │
        ▼
Servicios (Construye payload multimodal)
        │
        ▼
Google Gemini 1.5 Pro API
        │
        ▼
   HTTP Response
```

---

Desarrollado con ❤️ para potenciar el aprendizaje de los estudiantes