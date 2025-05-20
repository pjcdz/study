# Backend de Study Tool

Este documento proporciona una visión detallada del backend de la aplicación Study Tool, incluyendo su arquitectura, componentes principales, flujo de datos y guía de configuración.

## Arquitectura General

El backend de Study Tool está construido utilizando Node.js y Express, siguiendo una arquitectura MVC (Modelo-Vista-Controlador) adaptada, donde:

- **Controladores**: Manejan las solicitudes HTTP y coordinan la lógica de negocio
- **Servicios**: Encapsulan la lógica de integración con APIs externas (Gemini AI)
- **Configuración**: Almacena prompts y parámetros para las interacciones con la IA

```
backend/
  ├── src/                    # Código fuente
  │   ├── app.js              # Punto de entrada - configuración de Express
  │   ├── config/             # Configuraciones y prompts para la IA
  │   │   └── prompts.js      # Instrucciones específicas para Gemini AI
  │   ├── controllers/        # Controladores de las rutas
  │   │   ├── summaryController.js    # Generación de resúmenes en formato Notion
  │   │   └── flashcardsController.js # Generación de tarjetas de estudio
  │   └── services/
  │       └── geminiClient.js  # Cliente para la API de Google Gemini
  ├── Dockerfile              # Configuración para contenerización
  └── package.json            # Dependencias y scripts
```

## Flujo de Datos

1. El cliente envía solicitudes HTTP POST a uno de los endpoints:
   - `/summary`: Para transformar texto en formato markdown de Notion
   - `/flashcards`: Para generar tarjetas de estudio en formato TSV

2. Los controladores reciben las solicitudes, procesan los datos de entrada y preparan el contexto para la IA

3. Los servicios envían solicitudes a la API de Google Gemini utilizando el prompt adecuado

4. La respuesta de la IA es procesada y devuelta al frontend en formato JSON

## Endpoints API

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