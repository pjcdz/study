# Requirements Document

## Introduction

Este documento define los requisitos para eliminar completamente la integración de Sentry de la aplicación Next.js. Sentry es una herramienta de monitoreo de errores que actualmente está integrada en el cliente, servidor y edge runtime de la aplicación. La eliminación incluye la desinstalación del paquete, la eliminación de archivos de configuración, y la limpieza de referencias en el código y documentación.

## Glossary

- **Sistema**: La aplicación Next.js Study App
- **Sentry**: Servicio de monitoreo de errores y performance actualmente integrado
- **Archivos de Configuración de Sentry**: sentry.server.config.ts, sentry.edge.config.ts, instrumentation.ts, instrumentation-client.ts
- **Paquete Sentry**: Dependencia npm @sentry/nextjs
- **Next.config.js**: Archivo de configuración de Next.js que incluye withSentryConfig
- **Package.json**: Archivo de dependencias del proyecto

## Requirements

### Requirement 1

**User Story:** Como desarrollador, quiero eliminar todos los archivos de configuración de Sentry, para que no queden rastros de la integración en el código fuente

#### Acceptance Criteria

1. WHEN el proceso de eliminación se complete, THE Sistema SHALL no contener el archivo sentry.server.config.ts
2. WHEN el proceso de eliminación se complete, THE Sistema SHALL no contener el archivo sentry.edge.config.ts
3. WHEN el proceso de eliminación se complete, THE Sistema SHALL no contener el archivo instrumentation.ts
4. WHEN el proceso de eliminación se complete, THE Sistema SHALL no contener el archivo instrumentation-client.ts

### Requirement 2

**User Story:** Como desarrollador, quiero desinstalar el paquete de Sentry de las dependencias, para reducir el tamaño del bundle y eliminar código innecesario

#### Acceptance Criteria

1. WHEN el proceso de desinstalación se complete, THE Package.json SHALL no contener la dependencia @sentry/nextjs
2. WHEN se ejecute npm install después de la eliminación, THE Sistema SHALL no instalar ningún paquete relacionado con Sentry
3. WHEN se construya la aplicación, THE Sistema SHALL compilar exitosamente sin errores relacionados con Sentry

### Requirement 3

**User Story:** Como desarrollador, quiero eliminar la configuración de Sentry del archivo next.config.js, para que la aplicación no intente inicializar Sentry durante el build

#### Acceptance Criteria

1. WHEN se actualice next.config.js, THE Sistema SHALL no importar withSentryConfig desde @sentry/nextjs
2. WHEN se actualice next.config.js, THE Sistema SHALL no aplicar withSentryConfig a la configuración de Next.js
3. WHEN se actualice next.config.js, THE Sistema SHALL no contener opciones de configuración específicas de Sentry
4. WHEN se construya la aplicación, THE Sistema SHALL usar únicamente withNextIntl sin wrapper de Sentry

### Requirement 4

**User Story:** Como desarrollador, quiero actualizar la documentación del proyecto, para que no mencione Sentry como una característica o dependencia

#### Acceptance Criteria

1. WHEN se actualice el README.md, THE Sistema SHALL no mencionar Sentry en la sección de características
2. WHEN se actualice el README.md, THE Sistema SHALL no mencionar Sentry en la sección de tecnologías
3. WHEN se actualice el README.md, THE Sistema SHALL no incluir instrucciones de configuración de variables de entorno de Sentry
4. WHEN se revise la documentación, THE Sistema SHALL no contener referencias a SENTRY_DSN o SENTRY_AUTH_TOKEN

### Requirement 5

**User Story:** Como desarrollador, quiero limpiar referencias a Sentry en otros archivos del proyecto, para asegurar una eliminación completa

#### Acceptance Criteria

1. WHEN se revise el spec de migración docker-to-nextjs, THE Sistema SHALL actualizar las referencias que mencionan archivos de Sentry
2. WHEN se busquen referencias a Sentry en el código, THE Sistema SHALL no encontrar imports o llamadas a funciones de Sentry
3. WHEN se complete la limpieza, THE Sistema SHALL no contener comentarios o documentación inline que mencione Sentry
