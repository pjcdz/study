# Frontend de StudyApp

[![Next.js](https://img.shields.io/badge/Next.js-15.3-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38b2ac)](https://tailwindcss.com/)
[![ShadCN UI](https://img.shields.io/badge/ShadCN-UI-gray)](https://ui.shadcn.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)](https://www.typescriptlang.org/)

Esta documentación detalla la interfaz de usuario de StudyApp, una aplicación para transformar documentos en notas estructuradas y tarjetas de estudio.

## 📝 Índice

- [Visión General](#visión-general)
- [Arquitectura](#arquitectura)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Flujo de la Aplicación](#flujo-de-la-aplicación)
- [Componentes Clave](#componentes-clave)
- [Gestión del Estado](#gestión-del-estado)
- [Internacionalización](#internacionalización)
- [Estilos y Diseño](#estilos-y-diseño)
- [Configuración de Desarrollo](#configuración-de-desarrollo)
- [Construcción y Despliegue](#construcción-y-despliegue)
- [Optimizaciones](#optimizaciones)
- [Pruebas](#pruebas)

## 🔍 Visión General

El frontend de StudyApp es una aplicación moderna basada en Next.js 14 y React 19, diseñada para ofrecer una experiencia de usuario fluida e intuitiva para:

1. Subir y procesar documentos de estudio
2. Transformar el contenido en notas estructuradas para Notion
3. Generar tarjetas de estudio para Quizlet

La aplicación implementa una **Arquitectura Gritante** (Screaming Architecture) donde cada carpeta representa claramente un dominio de negocio, facilitando así la navegación y mantenimiento del código.

## 🏗️ Arquitectura

### Diagrama de Componentes

```
┌──────────────────────────────────┐
│           App Router             │
└───────────────┬──────────────────┘
                │
        ┌───────▼────────┐
        │    Layouts     │
        └───────┬────────┘
                │
     ┌──────────▼───────────┐
     │                      │
┌────▼─────┐  ┌──────▼─────┐  ┌────▼─────┐
│  Upload   │  │  Summary  │  │ Flashcards│
└──────┬────┘  └─────┬─────┘  └─────┬─────┘
       │             │              │
       └─────────────┼──────────────┘
                     │
                ┌────▼───────┐
                │ API Client │
                └────┬───────┘
                     │
                ┌────▼────┐
                │ Backend │
                └─────────┘
```

### Patrones de Diseño

- **Componentes Funcionales**: Uso exclusivo de React Hooks y componentes funcionales
- **Composición sobre Herencia**: Implementación de componentes pequeños y reutilizables
- **Custom Hooks**: Encapsulamiento de lógica reutilizable en hooks personalizados
- **Estado Global**: Gestión de estado centralizada con Zustand para datos de sesión
- **Renderizado del Lado del Servidor**: Aprovecha las capacidades de SSR y SSG de Next.js

## 📂 Estructura del Proyecto

```
frontend/
  ├── app/                    # Next.js App Router
  │   ├── [locale]/           # Estructura para internacionalización
  │   │   ├── upload/         # Página para subir documentos
  │   │   ├── summary/        # Página para visualizar y editar resúmenes
  │   │   └── flashcards/     # Página para generar tarjetas de estudio
  │   ├── api/                # Rutas de API del lado del servidor
  │   └── page.tsx            # Página principal (redirección)
  ├── components/             # Componentes React reutilizables
  │   ├── markdown/           # Componentes para visualización de markdown
  │   ├── navigation/         # Componentes de navegación
  │   ├── settings/           # Componentes de configuración
  │   ├── upload/             # Componentes para subida de archivos
  │   └── ui/                 # Componentes de interfaz de usuario
  ├── i18n/                   # Configuración de internacionalización
  ├── lib/                    # Utilidades y servicios
  │   ├── api-client.ts       # Cliente para comunicación con backend
  │   ├── hooks/              # Hooks personalizados
  │   └── utils.ts            # Funciones utilitarias
  ├── messages/               # Traducciones para internacionalización
  ├── public/                 # Activos estáticos
  ├── store/                  # Estado global con Zustand
  └── styles/                 # Estilos y animaciones globales
```

## 🔄 Flujo de la Aplicación

La experiencia de usuario sigue un flujo lineal de tres pasos, diseñado para ser intuitivo:

### 1. Página de Upload

```
┌─────────────────────────────┐
│     Componente Principal    │
│                             │
│  ┌─────────────────────┐    │
│  │  FileDropzone       │    │
│  │                     │    │
│  │  Arrastra o pega    │    │
│  │  texto aquí         │    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │  FileList           │    │
│  │  (Lista de archivos)│    │
│  └─────────────────────┘    │
│                             │
│  ┌─────────────────────┐    │
│  │      Botón de       │    │
│  │    Procesamiento    │──────┐
│  └─────────────────────┘    │ │
│                             │ │
└─────────────────────────────┘ │
                                │
               ┌────────────────▼─┐
               │ API: /process-files │
               └──────────┬─────────┘
                          │
                          ▼
                    Página de Summary
```

### 2. Página de Summary

Visualización y edición del contenido transformado en formato markdown para Notion:

- Vista previa con sintaxis resaltada
- Opción para condensar o expandir secciones
- Botón de copia con un solo clic para usar en Notion

### 3. Página de Flashcards

Generación de tarjetas de estudio en formato TSV:

- Vista previa de las tarjetas generadas
- Opción de edición manual
- Botón para copiar al portapapeles en formato compatible con Quizlet

## 🧩 Componentes Clave

### Componentes de Navegación

- **TabNav**: Componente de navegación principal que guía al usuario a través del flujo de trabajo
- **AppContainer**: Estructura principal de la aplicación con estilos y configuración base

### Componentes de Internacionalización

- **LanguageSwitcher**: Permite cambiar entre los idiomas disponibles
- **i18n Configuration**: Integración con next-intl para múltiples idiomas

### Componentes de Interfaz

- **MarkdownPreview**: Visualizador de markdown con sintaxis resaltada
- **FileDropzone**: Zona para arrastrar y soltar texto o pegarlo
- **ThemeSwitcher**: Alternador entre modos claro y oscuro

## 📦 Gestión del Estado

### Zustand Store

El estado global se gestiona con Zustand, una biblioteca ligera y eficiente:

```typescript
// Ejemplo simplificado del store
export const useUploadStore = create<UploadState>((set) => ({
  // Estado de documentos subidos
  filesText: "",
  isProcessing: false,
  processingComplete: false,
  
  // Estado de resúmenes
  summaries: [],
  selectedSummaryIndex: 0,
  
  // Estado de tarjetas
  flashcards: null,
  
  // Seguimiento del paso actual
  currentStep: "upload",
  
  // Acciones
  setFilesText: (filesText) => set({ filesText }),
  setProcessingStatus: (isProcessing) => set({ isProcessing }),
  setSummaries: (summaries) => set({ summaries, processingComplete: true }),
  setFlashcards: (flashcards) => set({ flashcards }),
  reset: () => set({ 
    filesText: "",
    isProcessing: false,
    processingComplete: false,
    summaries: [],
    flashcards: null,
    currentStep: "upload"
  })
}));
```

### Custom Hooks

Hooks personalizados para encapsular lógica de negocio:

- **useProcessingTimer**: Muestra el tiempo transcurrido durante el procesamiento
- **useApiClient**: Abstracción para interactuar con el backend

## 🌐 Internacionalización

La aplicación implementa soporte completo para múltiples idiomas utilizando next-intl:

- Estructura basada en rutas con prefijo de idioma (`/es/`, `/en/`)
- Archivos de mensajes separados por idioma
- Detección automática del idioma preferido del navegador

## 🎨 Estilos y Diseño

### Tailwind CSS

La aplicación utiliza Tailwind CSS para un diseño consistente y responsive:

- Sistema de diseño basado en utilidades
- Tema personalizado con variables CSS
- Integración con ShadCN UI para componentes avanzados

### Modo Oscuro y Claro

Implementación completa de temas claro y oscuro:

- Persistencia de preferencia de tema
- Transiciones suaves entre temas
- Detección automática de preferencia del sistema

### Animaciones y Transiciones

La aplicación utiliza `framer-motion` para animaciones complejas y transiciones de página, complementado con utilidades de transición de Tailwind CSS para efectos más simples.

## ⚙️ Configuración de Desarrollo

### Requisitos Previos

- Node.js v22.15.0 o superior
- npm o yarn

### Instalación Local

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/study.git
cd study/frontend

# Instalar dependencias
npm install
# o
yarn install

# Iniciar en modo desarrollo
npm run dev
# o 
yarn dev
```

La aplicación estará disponible en http://localhost:3000.

### Desarrollo con Docker

CLI para construir y ejecutar la imagen Docker del frontend en modo de desarrollo:

```bash
# Construir la imagen de desarrollo
docker build -t studyapp-frontend -f Dockerfile.dev .

# Ejecutar el contenedor de desarrollo
docker run -p 3000:3000 -v $(pwd):/app studyapp-frontend
```

### Despliegue con Docker Swarm

El despliegue se gestiona centralmente a través del archivo `docker-stack.yml` en la raíz del proyecto y el workflow de GitHub Actions. Asegúrate de que el servicio del frontend en `docker-stack.yml` utiliza la imagen correcta.

### Construcción para Producción

```bash
# Construir la imagen de producción
docker build -t studyapp-frontend:latest .
```
Esta imagen puede ser pusheada a un registro de contenedores y referenciada en `docker-stack.yml`.

Ejemplo de ejecución local de la imagen de producción (si no se usa Swarm):
```bash
docker run -d -p 3000:3000 --name studyapp-frontend studyapp-frontend:latest
```

**Nota sobre Nombres de Imágenes en `deploy.yml`:**
El workflow `deploy.yml` actual define `IMAGE_NAME_FRONTEND: ${{ github.repository_owner }}/study_frontend`. Si este nombre de imagen en el registro no cambia a `studyapp_frontend`, entonces los comandos `docker build -t studyapp-frontend...` son para construcción local y la imagen que Swarm usaría seguiría siendo `study_frontend`.

## 🚀 Construcción y Despliegue

### Construcción para Producción

```bash
# Construir la aplicación
npm run build
# o con Docker
npm run build:docker
```

### Despliegue con Docker

```bash
# Construir imagen de producción
docker build -t study-tool-frontend:latest .

# Ejecutar en producción
docker run -d -p 3000:3000 --name study-frontend study-tool-frontend:latest
```

## ⚡ Optimizaciones

- **Code Splitting**: Carga dinámica de componentes para reducir el tamaño inicial
- **Image Optimization**: Procesamiento automático de imágenes con Next.js Image
- **Componentes Lazy**: Carga diferida para componentes pesados
- **Caching de API**: Implementación de estrategias de caché para llamadas a API
- **Prefetching**: Precarga de datos para mejorar la experiencia de navegación

## 🧪 Pruebas

El proyecto está preparado para implementar pruebas unitarias y de integración:

```bash
# Ejecutar pruebas (cuando estén implementadas)
npm run test
```

## 🔗 Enlaces y Recursos

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Tailwind CSS](https://tailwindcss.com/docs)
- [Documentación de ShadcnUI](https://ui.shadcn.com/)
- [Documentación de Zustand](https://github.com/pmndrs/zustand)
- [Documentación de next-intl](https://next-intl-docs.vercel.app/)

---

Desarrollado con ❤️ para transformar la forma de estudiar y aprender
