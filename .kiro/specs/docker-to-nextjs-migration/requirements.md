# Requirements Document

## Introduction

Esta especificación define los requisitos para migrar la aplicación Study App de una arquitectura basada en Docker con backend (Express) y frontend (Next.js) separados, a una aplicación Next.js integral que funcione completamente en el root del proyecto sin Docker. La migración debe mantener toda la funcionalidad existente mientras consolida la estructura del proyecto.

## Glossary

- **Study App**: La aplicación completa que incluye funcionalidades de resumen de documentos y generación de flashcards usando IA
- **Backend Express**: El servidor Express.js actual ubicado en la carpeta `backend/` que maneja las API routes
- **Frontend Next.js**: La aplicación Next.js actual ubicada en la carpeta `frontend/`
- **Next.js API Routes**: Rutas de API nativas de Next.js que reemplazan el servidor Express
- **Root Project**: El directorio raíz del proyecto donde se consolidará toda la aplicación
- **Docker Configuration**: Los archivos docker-compose.yaml, Dockerfile y configuraciones relacionadas
- **Gemini AI**: El servicio de IA de Google usado para generar resúmenes y flashcards
- **File Upload Handler**: Componente que maneja la carga de archivos PDF e imágenes

## Requirements

### Requirement 1

**User Story:** Como desarrollador, quiero consolidar la estructura del proyecto moviendo todo el código del frontend al root, para que la aplicación sea más simple de mantener y desplegar

#### Acceptance Criteria

1. THE Study App SHALL mover todos los archivos de configuración de Next.js desde `frontend/` al directorio raíz del proyecto
2. THE Study App SHALL mover todas las carpetas `app/`, `components/`, `lib/`, `public/`, `store/`, `i18n/`, y `messages/` desde `frontend/` al directorio raíz
3. THE Study App SHALL consolidar las dependencias del `frontend/package.json` en el `package.json` raíz
4. THE Study App SHALL actualizar todos los imports y referencias de rutas para reflejar la nueva estructura
5. THE Study App SHALL mantener la funcionalidad de internacionalización (i18n) existente

### Requirement 2

**User Story:** Como desarrollador, quiero migrar todas las API routes del backend Express a Next.js API Routes, para que toda la lógica del servidor esté integrada en Next.js

#### Acceptance Criteria

1. THE Study App SHALL convertir el endpoint POST `/summary` del Backend Express a una Next.js API Route en `app/api/summary/route.ts`
2. THE Study App SHALL convertir el endpoint POST `/summary/condense` del Backend Express a una Next.js API Route en `app/api/summary/condense/route.ts`
3. THE Study App SHALL convertir el endpoint POST `/flashcards` del Backend Express a una Next.js API Route en `app/api/flashcards/route.ts`
4. THE Study App SHALL convertir el endpoint GET `/files/status` del Backend Express a una Next.js API Route en `app/api/files/status/route.ts`
5. THE Study App SHALL mantener toda la lógica de negocio de los controladores existentes (summaryController, flashcardsController, pdfController)
6. THE Study App SHALL implementar el manejo de file uploads usando FormData en las Next.js API Routes
7. THE Study App SHALL mantener la validación de API Key (x-user-api-key header) en todas las rutas protegidas

### Requirement 3

**User Story:** Como desarrollador, quiero migrar todos los servicios y utilidades del backend a la estructura de Next.js, para que toda la lógica de integración con Gemini AI esté disponible en el proyecto consolidado

#### Acceptance Criteria

1. THE Study App SHALL mover los servicios del backend desde `backend/src/services/` a `lib/services/` en el root
2. THE Study App SHALL mover las configuraciones del backend desde `backend/src/config/` a `lib/config/` en el root
3. THE Study App SHALL adaptar los imports de ES modules para que funcionen correctamente en el contexto de Next.js
4. THE Study App SHALL mantener toda la funcionalidad de integración con Gemini AI
5. THE Study App SHALL preservar la lógica de procesamiento de archivos PDF e imágenes

### Requirement 4

**User Story:** Como desarrollador, quiero actualizar los scripts de npm para que reflejen la nueva arquitectura sin Docker, para que el desarrollo y deployment sean más directos

#### Acceptance Criteria

1. THE Study App SHALL reemplazar el script `dev` en package.json para ejecutar `next dev` en lugar de docker-compose
2. THE Study App SHALL reemplazar el script `build` para ejecutar `next build`
3. THE Study App SHALL reemplazar el script `start` para ejecutar `next start`
4. THE Study App SHALL eliminar todos los scripts relacionados con Docker (dev:turbo, dev:performance, dev:clean, stop, clean, logs, restart)
5. THE Study App SHALL mantener el script `lint` para ejecutar `next lint`

### Requirement 5

**User Story:** Como desarrollador, quiero eliminar todos los archivos y configuraciones relacionados con Docker, para que el proyecto esté limpio y solo contenga lo necesario para Next.js

#### Acceptance Criteria

1. THE Study App SHALL eliminar el archivo `docker-compose.yaml` del root
2. THE Study App SHALL eliminar el archivo `docker-stack.yml` del root
3. THE Study App SHALL eliminar los archivos `Dockerfile` y `Dockerfile.dev` de las carpetas `frontend/` y `backend/`
4. THE Study App SHALL eliminar los archivos `.dockerignore` de las carpetas `frontend/` y `backend/`
5. THE Study App SHALL eliminar el script `optimize-docker.sh`
6. THE Study App SHALL eliminar las carpetas `frontend/` y `backend/` después de migrar todo su contenido

### Requirement 6

**User Story:** Como desarrollador, quiero que todas las variables de entorno estén consolidadas en un solo archivo .env, para que la configuración sea más simple

#### Acceptance Criteria

1. THE Study App SHALL consolidar las variables de entorno del backend y frontend en un archivo `.env.local` en el root
2. THE Study App SHALL mantener la variable `GEMINI_API_KEY` para la configuración del servidor
3. THE Study App SHALL mantener las variables de configuración de Sentry si existen
4. THE Study App SHALL actualizar las referencias a variables de entorno para usar el prefijo `NEXT_PUBLIC_` cuando sea necesario para el cliente
5. THE Study App SHALL documentar todas las variables de entorno requeridas

### Requirement 7

**User Story:** Como usuario final, quiero que todas las funcionalidades existentes sigan funcionando después de la migración, para que no haya pérdida de features

#### Acceptance Criteria

1. WHEN un usuario sube un archivo PDF o imagen, THE Study App SHALL procesar el archivo y generar un resumen usando Gemini AI
2. WHEN un usuario solicita condensar un resumen existente, THE Study App SHALL procesar la solicitud correctamente
3. WHEN un usuario solicita generar flashcards, THE Study App SHALL crear las flashcards basadas en el contenido proporcionado
4. WHEN un usuario verifica el estado de un archivo, THE Study App SHALL retornar el estado correcto
5. THE Study App SHALL mantener el soporte para múltiples idiomas (español e inglés)
6. THE Study App SHALL mantener el sistema de temas (dark/light mode)
7. THE Study App SHALL mantener todas las funcionalidades de UI existentes (upload, progress, error handling)

### Requirement 8

**User Story:** Como desarrollador, quiero que la configuración de TypeScript esté correctamente configurada para el proyecto consolidado, para que no haya errores de tipos

#### Acceptance Criteria

1. THE Study App SHALL consolidar la configuración de TypeScript del frontend en el `tsconfig.json` del root
2. THE Study App SHALL configurar los path aliases correctamente para la nueva estructura
3. THE Study App SHALL asegurar que todos los tipos e interfaces estén correctamente importados
4. THE Study App SHALL mantener la configuración de ESLint para Next.js
5. THE Study App SHALL resolver cualquier conflicto de tipos entre el código del backend y frontend

### Requirement 9

**User Story:** Como desarrollador, quiero que toda la documentación esté actualizada para reflejar la nueva arquitectura sin Docker, para que otros desarrolladores puedan entender y trabajar con el proyecto fácilmente

#### Acceptance Criteria

1. THE Study App SHALL actualizar el archivo README.md principal para eliminar referencias a Docker y documentar el nuevo proceso de desarrollo con Next.js
2. THE Study App SHALL actualizar cualquier documentación en `frontend/docs/` y `backend/docs/` y consolidarla en una carpeta `docs/` en el root
3. THE Study App SHALL documentar los nuevos comandos de npm (dev, build, start, lint) en el README
4. THE Study App SHALL documentar la estructura de carpetas del proyecto consolidado
5. THE Study App SHALL actualizar las instrucciones de configuración de variables de entorno
6. THE Study App SHALL documentar cómo funcionan las Next.js API Routes en lugar del servidor Express
7. THE Study App SHALL eliminar cualquier referencia a docker-compose, Dockerfile o contenedores en toda la documentación
