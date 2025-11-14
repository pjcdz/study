# StudyApp

Un sistema integral que transforma el contenido de documentos en notas estructuradas para Notion y tarjetas de estudio para Quizlet, impulsado por la inteligencia artificial de Google Gemini.

[![Nextjs](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Google Gemini](https://img.shields.io/badge/AI-gemini--2.5--flash--lite-orange)](https://ai.google.dev/)

## 📚 Características

- **Transformación Inteligente**: Convierte el contenido de documentos en markdown perfectamente formateado para Notion
- **Generación de Flashcards**: Crea tarjetas de estudio en formato TSV compatibles con Quizlet
- **Potenciado por IA**: Utiliza Google `gemini-1.5-flash` para un procesamiento de contenido inteligente
- **Flujo de Trabajo Simple**: Proceso de tres pasos - Subir → Markdown → Tarjetas
- **Copiar con Un Clic**: Copia fácilmente el contenido generado al portapapeles para su uso en Notion y Quizlet
- **Soporte Multiidioma**: Interfaz disponible en español e inglés
- **Diseño Adaptable**: Experiencia de usuario óptima en dispositivos móviles y de escritorio

## 🏗️ Arquitectura

La aplicación es una aplicación Next.js integral que incluye tanto el frontend como las API routes del backend en un solo proyecto.

### Diagrama de Arquitectura

```
┌────────────────────┐      ┌────────────────────────────────────┐
│                    │      │                                    │
│   Cliente (Web)    │◄────►│   Next.js Application              │
│                    │      │   ┌──────────────────────────┐     │
└────────────────────┘      │   │  Frontend (React)        │     │
                            │   └──────────────────────────┘     │
                            │   ┌──────────────────────────┐     │
                            │   │  API Routes              │     │
                            │   │  - /api/summary          │     │
                            │   │  - /api/flashcards       │     │
                            │   │  - /api/files/status     │     │
                            │   └──────────────────────────┘     │
                            │   ┌──────────────────────────┐     │
                            │   │  Services (Gemini AI)    │     │
                            │   └──────────────────────────┘     │
                            └────────────────────────────────────┘
                                            │
                                            ▼
                                  ┌────────────────────┐
                                  │                    │
                                  │   Google Gemini    │
                                  │        API         │
                                  │                    │
                                  └────────────────────┘
```

### Componentes Principales

| Componente                | Descripción                                                                                    |
|---------------------------|------------------------------------------------------------------------------------------------|
| **Frontend (Next.js)**    | Interfaz de usuario con App Router, i18n, estado global con Zustand y componentes de ShadCN UI |
| **API Routes (Next.js)**  | Endpoints de API integrados en Next.js que procesan solicitudes y se comunican con Gemini AI   |
| **Services Layer**        | Capa de servicios que maneja la integración con Google Gemini API                              |
| **CI/CD**                 | GitHub Actions para integración y despliegue continuo                                          |

## 🖥️ Tecnologías

### Frontend
- **Next.js 14** con React 19
- **Tailwind CSS** para estilos
- **ShadCN UI** para componentes de interfaz
- **Zustand** para gestión de estado
- **Framer Motion** para animaciones
- **Next-Intl** para internacionalización

### Backend (Next.js API Routes)
- **Next.js API Routes** para endpoints del servidor
- **Google Gemini AI API** (`gemini-2.5-flash-lite`) para procesamiento de texto
- **AI SDK** de Vercel para integración con Gemini
- **TypeScript** para type safety

### Infraestructura
- **GitHub Actions** para CI/CD
- **Node.js v22.15.0**

## ⚙️ Instalación y Configuración

### Requisitos Previos

- Node.js v22.15.0 o superior
- npm o yarn
- Cuenta de Google Cloud con acceso a la API de Gemini

### Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/pjcdz/study.git
cd study

# Instalar dependencias
npm install

# Configurar variables de entorno (opcional)
cp .env.example .env.local
# Editar .env.local con tus configuraciones

# Ejecutar en modo desarrollo
npm run dev
```

La aplicación estará disponible en http://localhost:3000

**Configuración de la API Key**: La aplicación no requiere configuración de variables de entorno para la API key. En su lugar, al acceder por primera vez, se te solicitará ingresar tu clave de Google Gemini a través de la interfaz de usuario (página de configuración). La clave se almacena de forma segura en el navegador y se envía con cada solicitud a las API routes.

### Comandos Disponibles

```bash
# Desarrollo
npm run dev          # Inicia el servidor de desarrollo

# Producción
npm run build        # Compila la aplicación para producción
npm run start        # Inicia el servidor de producción

# Linting
npm run lint         # Ejecuta el linter de Next.js
```

## 🚀 Despliegue en Producción

### Vercel (Recomendado)

La forma más sencilla de desplegar esta aplicación Next.js es usando Vercel:

1. Conecta tu repositorio de GitHub a Vercel
2. Vercel detectará automáticamente Next.js y configurará el build

**Nota**: No es necesario configurar `GEMINI_API_KEY` como variable de entorno ya que la aplicación permite que cada usuario ingrese su propia API key a través de la interfaz web.

### Otros Proveedores

La aplicación también puede desplegarse en:
- **Netlify**: Soporte completo para Next.js
- **Railway**: Deployment automático desde GitHub
- **VPS/Servidor Propio**: Usando `npm run build` y `npm run start`

Para deployment en servidor propio:

```bash
# Compilar la aplicación
npm run build

# Iniciar en modo producción
npm run start
```

## 📋 Flujo de Uso

Para una descripción detallada del flujo de trabajo de la aplicación, consulta la [documentación del flujo de trabajo](./frontend/docs/WORKFLOW.md).

### Resumen del flujo:

1. **Configuración inicial**: Al acceder por primera vez, configura tu API key de Google Gemini en la página de configuración
2. **Subida**: Sube documentos (PDF/imágenes) o pega texto directamente en el área de subida
3. **Resumen**: Visualiza y copia el resumen generado en formato markdown compatible con Notion
4. **Flashcards**: Genera y copia tarjetas de estudio en formato TSV para importar en Quizlet

## 📁 Estructura del Proyecto

```
study-app/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes (backend endpoints)
│   │   ├── summary/       # Endpoint de generación de resúmenes
│   │   ├── flashcards/    # Endpoint de generación de flashcards
│   │   └── files/         # Endpoint de estado de archivos
│   └── [locale]/          # Páginas con internacionalización
├── components/            # Componentes React reutilizables
├── lib/                   # Utilidades y servicios
│   ├── services/         # Servicios de integración (Gemini AI)
│   ├── config/           # Configuración (prompts, límites)
│   └── types/            # Tipos TypeScript
├── messages/             # Archivos de traducción (i18n)
├── public/               # Archivos estáticos
└── store/                # Estado global (Zustand)
```

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerir cambios o mejoras.

## 📜 Licencia

Este proyecto está licenciado bajo MIT License.

