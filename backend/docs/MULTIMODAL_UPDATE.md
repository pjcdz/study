# Actualización Multimodal para Study Tool

[![Google Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-blue)](https://ai.google.dev/models/gemini)

## Descripción de la Actualización

Esta actualización importante migra la aplicación Study Tool para utilizar el modelo **gemini-1.5-pro** de Google, permitiendo el procesamiento multimodal nativo (texto, PDF, imágenes). El backend ahora actúa como un proxy inteligente, recibiendo el contenido del usuario y su API Key personal de Google AI Studio para realizar las solicitudes a la API de Gemini.

### Características Principales

- **Procesamiento Multimodal**: Capacidad para analizar PDFs e imágenes junto con texto
- **API Key de Usuario**: Cada usuario proporciona su propia API Key de Google AI Studio
- **Mayor Contexto**: Aprovecha la capacidad de Gemini 1.5 Pro para manejar hasta 2 millones de tokens
- **Compatibilidad con Archivos**: Soporte para PDF, JPEG, PNG, WEBP, HEIC y HEIF

## Cambios en la Arquitectura

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

## Cómo Usar

### Requisitos para el Usuario

1. Obtener una API Key de [Google AI Studio](https://aistudio.google.com/)
2. Proporcionar esta API Key a través de la interfaz de usuario
3. No es necesario realizar cambios en la configuración del backend

### Endpoints Actualizados

Todas las solicitudes a los endpoints de IA ahora deben incluir:

- Cabecera `X-User-API-Key`: La API Key personal del usuario
- Para endpoints que aceptan archivos:
  - `file`: (Opcional) Archivo PDF o imagen en formato multipart/form-data
  - `textPrompt`: (Opcional) Texto adicional o prompt principal

## Integración con Google Gemini 1.5 Pro

### Capacidades Multimodales

- **Procesamiento de Texto**: Análisis semántico mejorado
- **Procesamiento de PDF**: Extracción y comprensión del contenido completo
- **Procesamiento de Imágenes**: Análisis visual y extracción de texto

### Límites y Consideraciones

- **Tamaño Máximo de Solicitud**: 20MB (incluyendo archivos y texto)
- **Formatos Soportados**:
  - PDF: application/pdf
  - Imágenes: image/png, image/jpeg, image/webp, image/heic, image/heif

## Cambios en la API

### Formato de Solicitud para /summary

```http
POST /summary
Content-Type: multipart/form-data
X-User-API-Key: TU_API_KEY_DE_GOOGLE_AI_STUDIO

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="documento.pdf"
Content-Type: application/pdf

[CONTENIDO_BINARIO_DEL_PDF]
------WebKitFormBoundary
Content-Disposition: form-data; name="textPrompt"

Genera un resumen detallado de este documento sobre física cuántica.
------WebKitFormBoundary--
```

### Formato de Solicitud para /flashcards

```http
POST /flashcards
Content-Type: multipart/form-data
X-User-API-Key: TU_API_KEY_DE_GOOGLE_AI_STUDIO

------WebKitFormBoundary
Content-Disposition: form-data; name="file"; filename="diagrama.jpg"
Content-Type: image/jpeg

[CONTENIDO_BINARIO_DE_LA_IMAGEN]
------WebKitFormBoundary
Content-Disposition: form-data; name="textPrompt"

Genera tarjetas de estudio basadas en este diagrama de célula.
------WebKitFormBoundary--
```

### Formato de Solicitud para /summary/condense

```http
POST /summary/condense
Content-Type: application/json
X-User-API-Key: TU_API_KEY_DE_GOOGLE_AI_STUDIO

{
  "markdownContent": "# Contenido markdown existente...",
  "condensationType": "shorter"  // Opciones: "shorter", "clarity", "examples"
}
```

## Resolución de Problemas

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| Error 401 | API Key incorrecta o sin permisos | Verificar API Key en Google AI Studio |
| Error 429 | Límite de uso de la API Key alcanzado | Revisar cuotas en Google Cloud Console |
| Error 400 | Tipo de archivo no soportado | Verificar tipo de archivo (PDF/JPEG/PNG/WEBP/HEIC/HEIF) |
| Error 500 | Problema de red o error interno | Revisar logs del backend |

## Integración Frontend

Para integrar estas funcionalidades en el frontend, consulte la [Guía de Integración Frontend](./FRONTEND_INTEGRATION.md).

---

Desarrollado con ❤️ para potenciar el aprendizaje de los estudiantes
