# StudyApp

Un sistema integral que transforma el contenido de documentos en notas estructuradas para Notion y tarjetas de estudio para Quizlet, impulsado por la inteligencia artificial de Google Gemini.

[![Nextjs](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://reactjs.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green)](https://expressjs.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](https://www.docker.com/)
[![Google Gemini](https://img.shields.io/badge/AI-gemini--1.5--flash-orange)](https://ai.google.dev/)

## 📚 Características

- **Transformación Inteligente**: Convierte el contenido de documentos en markdown perfectamente formateado para Notion
- **Generación de Flashcards**: Crea tarjetas de estudio en formato TSV compatibles con Quizlet
- **Potenciado por IA**: Utiliza Google `gemini-1.5-flash` para un procesamiento de contenido inteligente
- **Flujo de Trabajo Simple**: Proceso de tres pasos - Subir → Markdown → Tarjetas
- **Copiar con Un Clic**: Copia fácilmente el contenido generado al portapapeles para su uso en Notion y Quizlet
- **Soporte Multiidioma**: Interfaz disponible en español e inglés
- **Diseño Adaptable**: Experiencia de usuario óptima en dispositivos móviles y de escritorio

## 🏗️ Arquitectura

El proyecto sigue una **Screaming Architecture** donde la estructura del código refleja el dominio de negocio, con una clara separación entre frontend y backend.

### Diagrama de Arquitectura

```
┌────────────────────┐      ┌────────────────────┐      ┌────────────────────┐
│                    │      │                    │      │                    │
│   Cliente (Web)    │◄────►│   Next.js Server   │◄────►│   Express Server   │
│                    │      │                    │      │                    │
└────────────────────┘      └────────────────────┘      └────────────────────┘
                                      │                          │
                                      │                          ▼
                              ┌───────▼──────────┐      ┌────────────────────┐
                              │                  │      │                    │
                              │  Zustand Store   │      │   Google Gemini    │
                              │                  │      │        API         │
                              └──────────────────┘      │                    │
                                                        └────────────────────┘
```

### Componentes Principales

| Componente             | Descripción                                                                                    |
|------------------------|------------------------------------------------------------------------------------------------|
| **Frontend (Next.js)** | Interfaz de usuario con App Router, i18n, estado global con Zustand y componentes de ShadCN UI |
| **Backend (Express)**  | API REST que integra con Google Gemini para procesamiento de texto                             |
| **Docker**             | Contenedores para desarrollo local y despliegue en producción                                  |
| **CI/CD**              | GitHub Actions para integración y despliegue continuo                                          |

## 🖥️ Tecnologías

### Frontend
- **Next.js 14** con React 19
- **Tailwind CSS** para estilos
- **ShadCN UI** para componentes de interfaz
- **Zustand** para gestión de estado
- **Framer Motion** para animaciones
- **Next-Intl** para internacionalización

### Backend
- **Node.js** con Express 4.18
- **Google Gemini AI API** para procesamiento de texto
- **CORS** para seguridad en comunicación cross-origin

### Infraestructura
- **Docker** para contenedores de desarrollo y producción
- **Docker Swarm** para orquestación
- **GitHub Actions** para CI/CD
- **Node.js v22.15.0**

## ⚙️ Instalación y Configuración

### Requisitos Previos

- Cuenta de Google Cloud con acceso a la API de Gemini
- `GEMINI_API_KEY` obtenida de Google AI Studio
- Docker y Docker Compose instalados

### Desarrollo Local

```bash
# Clonar el repositorio
git clone https://github.com/pjcdz/study.git
cd study

# Crear archivo .env con tu clave de API
echo "GEMINI_API_KEY=tu_clave_aqui" > .env

# Ejecutar la aplicación con Docker Compose
docker compose up --build
```

La aplicación estará disponible en:
- Frontend: http://localhost:3000
- API Backend: http://localhost:4000

### Configuración sin Docker

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 🚀 Despliegue en Producción

### Configuración de Secretos en GitHub

1. Configura los secretos necesarios en GitHub:
   - `VPS_HOST`: Hostname de tu servidor
   - `VPS_USER`: Usuario SSH
   - `DEPLOY_SSH_PRIVATE_KEY`: Clave SSH privada
   - `GEMINI_API_KEY`: Tu clave de API de Google Gemini

2. El despliegue se activa automáticamente al hacer push a la rama principal

```bash
git push origin main
```

### Gestión de Docker Swarm

Crear los secretos Docker necesarios:

```bash
echo "tu_clave_api_gemini" | docker secret create gemini_api_key -
```

Desplegar el stack:

```bash
docker stack deploy --with-registry-auth -c docker-stack.yml StudyApp
```

## 📋 Flujo de Uso

1. **Subida**: Pega el contenido del documento en el área de texto de subida
2. **Markdown**: Visualiza y copia el markdown generado compatible con Notion
3. **Tarjetas**: Genera y copia contenido TSV para importar en Quizlet

## 📄 Documentación

- [Documentación del Frontend](./frontend/README.md)
- [Documentación del Backend](./backend/docs/README.md)

## 🤝 Contribución

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request para sugerir cambios o mejoras.

## 📜 Licencia

Este proyecto está licenciado bajo MIT License.

