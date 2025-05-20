# Backend de Study Tool

[![Node.js](https://img.shields.io/badge/Node.js-v22.15-green)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-lightgrey)](https://expressjs.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Gemini%201.5%20Pro-blue)](https://ai.google.dev/models/gemini)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)

Este documento proporciona una visión detallada del backend de la aplicación Study Tool, incluyendo su arquitectura, componentes principales, flujo de datos y guía de configuración. Esta versión utiliza el modelo gemini-1.5-pro de Google, permitiendo el procesamiento multimodal nativo (texto, PDF, imágenes) y requiere que cada usuario proporcione su propia API Key de Google AI Studio para las operaciones de IA. Para más detalles sobre esta actualización, consulta [MULTIMODAL_UPDATE.md](./MULTIMODAL_UPDATE.md).

## 📝 Índice

- [Arquitectura General](#arquitectura-general)
- [Estructura de Directorios](#estructura-de-directorios)
- [Flujo de Datos](#flujo-de-datos)
- [Endpoints API](#endpoints-api)
- [Integración con Google Gemini](#integración-con-google-gemini)
- [Configuración de Desarrollo](#configuración-de-desarrollo)
- [Despliegue](#despliegue)
- [Variables de Entorno](#variables-de-entorno)
- [Escalabilidad y Rendimiento](#escalabilidad-y-rendimiento)
- [Seguridad](#seguridad)

## 🏗️ Arquitectura General

El backend de Study Tool está construido utilizando Node.js y Express, siguiendo una arquitectura MVC (Modelo-Vista-Controlador) adaptada, donde:

- **Controladores**: Manejan las solicitudes HTTP y coordinan la lógica de negocio
- **Servicios**: Encapsulan la lógica de integración con APIs externas (Gemini AI)
- **Configuración**: Almacena prompts y parámetros para las interacciones con la IA

### Diagrama de Componentes

```
┌────────────────────┐         ┌────────────────────┐
│                    │         │                    │
│    Express App     │────────►│    Controllers     │
│                    │         │                    │
└────────────────────┘         └─────────┬──────────┘
                                         │
                                         ▼
┌────────────────────┐         ┌────────────────────┐
│                    │◄────────┤                    │
│   Gemini Client    │         │     Services       │
│                    │         │                    │
└────────────────────┘         └────────────────────┘
```

## 📂 Estructura de Directorios

```
backend/
  ├── src/                    # Código fuente principal
  │   ├── app.js              # Punto de entrada - configuración de Express
  │   ├── config/             # Configuraciones y prompts para la IA
  │   │   └── prompts.js      # Instrucciones específicas para Gemini AI
  │   ├── controllers/        # Controladores de las rutas
  │   │   ├── summaryController.js    # Generación de resúmenes en formato Notion
  │   │   └── flashcardsController.js # Generación de tarjetas de estudio
  │   └── services/
  │       ├── geminiClient.js  # Cliente para la API de Google Gemini
  │       └── sessionManager.js # Gestión de sesiones para el procesamiento
  ├── docs/                   # Documentación adicional
  ├── Dockerfile              # Configuración para contenedores de producción
  ├── Dockerfile.dev          # Configuración para contenedores de desarrollo
  └── package.json            # Dependencias y scripts
```

## 🔄 Flujo de Datos

1. El cliente envía solicitudes HTTP POST a uno de los endpoints:
   - `/summary`: Para transformar texto en formato markdown de Notion
   - `/flashcards`: Para generar tarjetas de estudio en formato TSV

2. Los controladores reciben las solicitudes, procesan los datos de entrada y preparan el contexto para la IA

3. Los servicios envían solicitudes a la API de Google Gemini utilizando el prompt adecuado

4. La respuesta de la IA es procesada y devuelta al frontend en formato JSON

### Diagrama de Secuencia

```
┌──────────┐               ┌──────────┐          ┌───────────┐              ┌──────────┐
│          │               │          │          │           │              │          │
│ Frontend │───Request────►│Controller│──Data───►│  Service  │──API Call───►│ Gemini   │
│          │               │          │          │           │              │    AI    │
│          │◄──Response────│          │◄─Data────│           │◄──Response───│          │
└──────────┘               └──────────┘          └───────────┘              └──────────┘
```

## 🔌 Endpoints API

### POST /summary

Transforma texto en un resumen estructurado con formato Markdown para Notion.

**Request:**
```json
{
  "filesText": "Contenido del documento o texto a procesar"
}
```

**Response:**
```json
{
  "notionMarkdown": "# Título del resumen generado\n\n## Sección 1\n...",
  "stats": {
    "generationTimeMs": 3245,
    "promptTokens": 1520,
    "completionTokens": 2340,
    "totalTokens": 3860
  }
}
```

### POST /summary/condense

Permite condensar o refinar un resumen existente.

**Request:**
```json
{
  "markdownContent": "# Contenido markdown existente",
  "condensationType": "shorter" // Opciones: "shorter", "clarity", "examples"
}
```

**Response:**
```json
{
  "notionMarkdown": "# Resumen condensado\n\n...",
  "stats": {
    "generationTimeMs": 2140,
    "promptTokens": 1820,
    "completionTokens": 1240,
    "totalTokens": 3060
  }
}
```

### POST /flashcards

Genera tarjetas de estudio en formato TSV compatible con Quizlet.

**Request:**
```json
{
  "markdownContent": "# Contenido en formato markdown\n\n## Temas principales\n..."
}
```

**Response:**
```json
{
  "flashcards": "Pregunta 1\tRespuesta 1\nPregunta 2\tRespuesta 2",
  "stats": {
    "generationTimeMs": 2145,
    "promptTokens": 1320,
    "completionTokens": 1140,
    "totalTokens": 2460
  }
}
```

### GET /health

Endpoint para verificar el estado del servidor.

**Response:**
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

## 🤖 Integración con Google Gemini 1.5 Pro

### Configuración del Cliente Multimodal

El servicio `geminiClient.js` encapsula toda la comunicación con la API de Google Gemini, utilizando la API Key proporcionada por el usuario:

```javascript
// Ejemplo simplificado del cliente multimodal de Gemini
import { GoogleGenerativeAI } from "@google/generative-ai";

// Convierte un buffer de archivo en una parte para la API
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType,
    },
  };
}

// Genera contenido multimodal usando la API Key del usuario
async function generateMultimodalContent(userApiKey, parts, systemInstructionText) {
  try {
    const genAI = new GoogleGenerativeAI(userApiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-pro-latest",
      systemInstruction: systemInstructionText ? { parts: [{ text: systemInstructionText }] } : undefined,
      generationConfig: {
        temperature: 0.3,
        topP: 0.8,
        topK: 40
      }
    });

    const contentsForApi = [{ role: 'user', parts }];
    const result = await model.generateContent({ contents: contentsForApi });
    const response = result.response;
    
    // Procesar y devolver respuesta
    // ...
  } catch (error) {
    // Manejar errores específicos (API Key inválida, cuota excedida, etc.)
    // ...
  }
}
```

### Capacidades Multimodales

El backend ahora puede procesar:

- **Texto**: Análisis semántico avanzado
- **PDFs**: Extracción y comprensión del contenido completo
- **Imágenes**: Análisis visual y extracción de información

Gemini 1.5 Pro soporta un gran contexto (hasta 2 millones de tokens), permitiendo analizar documentos extensos y múltiples imágenes en una sola solicitud.

### Prompts y Configuración

Los prompts para la IA están centralizados en el archivo `prompts.js`, optimizados para contenido multimodal:

- Instrucciones detalladas para formatear resúmenes en estilo Notion, incluyendo análisis de contenido visual
- Plantillas para la creación de tarjetas de estudio basadas en cualquier tipo de contenido
- Ajustes de configuración para optimizar la calidad de las respuestas

## ⚙️ Configuración de Desarrollo

### Requisitos Previos

- Node.js v22.15.0 o superior
- Clave de API de Google Gemini
- Docker (opcional)

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/study.git
cd study/backend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tu API key de Google Gemini

# Iniciar en modo desarrollo
npm run dev
```

### Desarrollo con Docker

```bash
# Construir y ejecutar con Docker
docker build -t study-tool-backend -f Dockerfile.dev .
docker run -p 4000:4000 -v $(pwd):/app --env-file .env study-tool-backend
```

## 🚀 Despliegue

### Con Docker Swarm

```bash
# Crear secretos necesarios
echo "tu_gemini_api_key" | docker secret create gemini_api_key -

# Desplegar el stack completo
docker stack deploy --with-registry-auth -c docker-stack.yml study-tool
```

### Despliegue Manual

```bash
# Construir para producción
docker build -t study-tool-backend:latest .

# Ejecutar en producción
docker run -d -p 4000:4000 --name study-backend \
  --env GEMINI_API_KEY=tu_api_key \
  --env NODE_ENV=production \
  study-tool-backend:latest
```

## 🔐 Variables de Entorno

| Variable | Descripción | Valores por Defecto |
|----------|-------------|---------------------|
| `PORT` | Puerto en que se ejecutará el servidor | `4000` |
| `HOST` | Interfaz de red a utilizar | `0.0.0.0` |
| `NODE_ENV` | Entorno de ejecución | `development` |
| `GEMINI_API_KEY` | (Opcional) Clave de API para Google Gemini para compatibilidad con versiones anteriores | No requerida |

> **Importante:** A partir de esta actualización, la variable de entorno `GEMINI_API_KEY` ya no es necesaria para la operación normal. Cada usuario proporciona su propia API Key a través del frontend. La variable puede mantenerse para compatibilidad con código existente.

## 📈 Escalabilidad y Rendimiento

- **Contenedores**: La arquitectura basada en Docker permite escalar horizontalmente según la demanda
- **Caché**: Implementación de estrategias de caché para prompts frecuentes
- **Rate Limiting**: Control de tasa de solicitudes para proteger contra sobrecarga
- **Timeout Handling**: Gestión adecuada de tiempos de espera en solicitudes a la API de Gemini

## 🔒 Seguridad

- **API Key del Usuario**: Las claves API nunca se almacenan en el backend; se usan sólo para la petición inmediata
- **Validación de Entrada**: Todos los datos de entrada son validados rigurosamente
- **CORS Configurado**: Protección contra solicitudes no autorizadas
- **Sin Almacenamiento**: No se almacenan datos de usuario permanentemente
- **Límites de Tamaño**: Restricciones en el tamaño máximo de solicitudes (20MB para archivos)
- **Validación de Tipos de Archivo**: Solo se permiten PDFs e imágenes en formatos específicos

---

## 📚 Referencias y Recursos Adicionales

- [Documentación de la API de Gemini](https://ai.google.dev/docs)
- [Mejores prácticas para prompts de IA](https://ai.google.dev/docs/prompting)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [Documentación de Docker Swarm](https://docs.docker.com/engine/swarm/)

---

Desarrollado con ❤️ para potenciar el aprendizaje de los estudiantes

## Integración con Google Gemini AI

El backend utiliza la API de Google Gemini para procesar documentos y generar contenido estructurado. Esta integración se realiza a través del módulo `geminiClient.js`.

### Estrategia de Prompts

Los prompts son cruciales para obtener resultados de alta calidad. El archivo `prompts.js` contiene instrucciones detalladas para:

1. **Generación de resúmenes**: Instrucciones para formatear el contenido siguiendo el estilo de Notion con:
   - Secciones jerárquicas con emojis
   - Formato Cornell Notes para facilitar el estudio
   - Destacado de conceptos clave
   - Bloques Toggle para contenido expandible
   - División del contenido en partes para mejor gestión

2. **Generación de flashcards**: Instrucciones para crear tarjetas de estudio efectivas:
   - Detección automática de idioma para mantener consistencia
   - Formato Quizlet-compatible (TSV)
   - Estructura pregunta-respuesta optimizada para memorización
   - Resaltado de términos importantes

## Gestión de Errores

El backend implementa un sistema de manejo de errores en múltiples niveles:

1. **Validación de entrada**: Verifica que se proporcione el contenido necesario
2. **Manejo de límites**: Control del tamaño de texto enviado a la API de Gemini
3. **Captura de errores API**: Manejo específico de errores en la comunicación con Gemini
4. **Middleware global**: Captura errores no manejados y evita interrupciones del servicio

## Configuración y Despliegue

### Variables de Entorno

El backend requiere las siguientes variables de entorno:

| Variable | Descripción | Valor por defecto |
|----------|-------------|-------------------|
| `PORT` | Puerto donde se ejecuta el servidor | 4000 |
| `GEMINI_API_KEY` | Clave de API para Google Gemini | - |
| `NODE_ENV` | Entorno de ejecución | development |

### Desarrollo Local

1. Instalar dependencias:
```bash
npm install
```

2. Crear archivo `.env` con la clave de API:
```
GEMINI_API_KEY=your_key_here
PORT=4000
```

3. Iniciar el servidor en modo desarrollo:
```bash
npm run dev
```

### Despliegue con Docker

El backend incluye un Dockerfile optimizado para producción:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Configurar variables de entorno
ENV NODE_ENV=production
ENV PORT=4000

# Exponer puerto
EXPOSE 4000

# Iniciar aplicación
CMD ["node", "src/app.js"]
```

## Métricas y Monitoreo

El backend proporciona métricas de uso sobre las solicitudes a la API de Gemini:

- Tiempo de generación de contenido
- Recuento de tokens (prompt, respuesta y total)
- Estado de la API (a través del endpoint `/health`)

## Escalabilidad y Optimización

El backend está diseñado considerando:

1. **Gestión de carga**: Manejo de documentos grandes mediante truncamiento inteligente
2. **Eficiencia de tokens**: Prompts optimizados para reducir costos de API
3. **Middleware ligero**: Configuración minimalista para reducir overhead

## Consideraciones de Seguridad

1. **CORS**: Configuración adecuada para permitir solicitudes desde el frontend
2. **Validación de entrada**: Prevención de inyección de contenido malicioso
3. **Variables de entorno**: Gestión segura de claves API
4. **Limitación de tamaño**: Control en la recepción de datos (`limit: '50mb'`)

## Instrucciones para Desarrolladores

### Añadir Nuevos Endpoints

1. Crear un nuevo controlador en `/src/controllers/`
2. Implementar la lógica de procesamiento
3. Configurar la ruta en `app.js`

### Modificar Prompts

Los prompts pueden ajustarse en `/src/config/prompts.js` para mejorar la calidad del contenido generado:

1. Mantener las instrucciones de formato claramente definidas
2. Utilizar ejemplos específicos para guiar a la IA
3. Estructurar las instrucciones en secciones lógicas

## Resolución de Problemas

| Problema | Posible causa | Solución |
|----------|---------------|----------|
| Error 500 en generación de contenido | Fallo en API de Gemini | Verificar clave API y estado del servicio |
| Respuestas incompletas | Contenido de entrada demasiado extenso | Reducir texto o implementar procesamiento por partes |
| Formatos incorrectos | Instrucciones de prompt insuficientes | Ajustar prompts para mayor especificidad |

## Próximos Pasos y Mejoras

1. **Caché de respuestas**: Implementar almacenamiento para respuestas frecuentes
2. **Procesamiento por lotes**: Dividir documentos extensos para procesamiento paralelo
3. **APIs alternativas**: Soporte para múltiples proveedores de IA
4. **Autenticación**: Añadir capa de seguridad para control de acceso
5. **WebSockets**: Implementar actualizaciones en tiempo real durante procesamiento

---

Para más información sobre la arquitectura general del proyecto, consultar el [README principal](../README.md).