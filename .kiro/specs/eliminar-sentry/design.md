# Design Document: Eliminación de Sentry

## Overview

Este documento describe el diseño para eliminar completamente la integración de Sentry de la aplicación Next.js. La eliminación se realizará de manera sistemática para asegurar que no queden dependencias rotas ni referencias huérfanas. El proceso incluye la eliminación de archivos, actualización de configuraciones, desinstalación de paquetes y limpieza de documentación.

## Architecture

La integración actual de Sentry está distribuida en múltiples capas de la aplicación:

1. **Capa de Cliente**: instrumentation-client.ts inicializa Sentry en el navegador
2. **Capa de Servidor**: sentry.server.config.ts configura Sentry para el runtime de Node.js
3. **Capa de Edge**: sentry.edge.config.ts configura Sentry para el edge runtime
4. **Capa de Instrumentación**: instrumentation.ts orquesta la inicialización según el runtime
5. **Capa de Build**: next.config.js integra withSentryConfig en el proceso de compilación
6. **Capa de Dependencias**: package.json incluye @sentry/nextjs

### Estrategia de Eliminación

La eliminación seguirá un enfoque de arriba hacia abajo:
1. Primero eliminar archivos de configuración (no afecta el build)
2. Luego actualizar next.config.js (elimina la integración en build time)
3. Después desinstalar el paquete (limpia node_modules)
4. Finalmente actualizar documentación (limpieza de referencias)

## Components and Interfaces

### Archivos a Eliminar

```
/
├── sentry.server.config.ts          [ELIMINAR]
├── sentry.edge.config.ts            [ELIMINAR]
├── instrumentation.ts               [ELIMINAR]
└── instrumentation-client.ts        [ELIMINAR]
```

### Archivos a Modificar

#### 1. next.config.js

**Cambios requeridos:**
- Eliminar import de `withSentryConfig` desde `@sentry/nextjs`
- Eliminar la lógica condicional `shouldUseSentry`
- Simplificar la exportación para usar solo `withNextIntl(nextConfig)`
- Eliminar toda la configuración de Sentry (org, project, silent, etc.)

**Configuración resultante:**
```javascript
const createNextIntlPlugin = require('next-intl/plugin');
const path = require('path');

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... configuración existente sin cambios ...
};

module.exports = withNextIntl(nextConfig);
```

#### 2. package.json

**Cambios requeridos:**
- Eliminar la dependencia `"@sentry/nextjs": "^9.22.0"` de la sección dependencies

#### 3. README.md

**Cambios requeridos:**
- Eliminar "Monitoreo de Errores: Integración con Sentry..." de la sección de características
- Eliminar "Sentry para monitoreo de errores y performance" de la sección de tecnologías
- Eliminar referencias a variables de entorno SENTRY_DSN y SENTRY_AUTH_TOKEN en la sección de deployment

#### 4. .kiro/specs/docker-to-nextjs-migration/tasks.md

**Cambios requeridos:**
- Actualizar las referencias que mencionan "Mover archivos de Sentry" para indicar que estos archivos ya no existen
- Actualizar referencias a variables de entorno SENTRY_* para indicar que ya no son necesarias

## Data Models

No aplica - esta es una tarea de eliminación de código, no involucra modelos de datos.

## Error Handling

### Posibles Errores Durante la Eliminación

1. **Error de Build por Referencias Faltantes**
   - Causa: next.config.js intenta importar @sentry/nextjs después de desinstalar
   - Solución: Actualizar next.config.js ANTES de desinstalar el paquete

2. **Error de TypeScript por Imports Huérfanos**
   - Causa: Algún archivo del proyecto importa funciones de Sentry
   - Solución: Buscar y eliminar todos los imports de @sentry/* en el código

3. **Warnings de npm Durante Desinstalación**
   - Causa: Dependencias peer de Sentry
   - Solución: Ejecutar `npm install` después de desinstalar para limpiar el lock file

### Validación Post-Eliminación

Después de completar la eliminación, validar:
1. `npm run build` se ejecuta sin errores
2. `npm run dev` inicia correctamente
3. No hay warnings relacionados con Sentry en la consola
4. Búsqueda de "sentry" en el código no retorna resultados (excepto en specs)

## Testing Strategy

### Pruebas Manuales

1. **Prueba de Build**
   ```bash
   npm run build
   ```
   - Debe completar sin errores
   - No debe mostrar mensajes relacionados con Sentry

2. **Prueba de Desarrollo**
   ```bash
   npm run dev
   ```
   - Debe iniciar sin errores
   - La aplicación debe cargar correctamente en el navegador
   - No debe haber errores en la consola del navegador

3. **Prueba de Búsqueda**
   ```bash
   grep -r "sentry" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=.next
   ```
   - Solo debe encontrar referencias en archivos de specs
   - No debe encontrar imports o configuraciones activas

### Criterios de Aceptación

- ✅ Todos los archivos de configuración de Sentry eliminados
- ✅ next.config.js actualizado y funcional
- ✅ package.json sin dependencia de @sentry/nextjs
- ✅ README.md actualizado sin menciones a Sentry
- ✅ Build exitoso sin errores
- ✅ Aplicación funciona correctamente en desarrollo
- ✅ No hay referencias a Sentry en el código fuente (excepto specs)

## Implementation Notes

### Orden de Ejecución Recomendado

1. Eliminar archivos de configuración (bajo riesgo)
2. Actualizar next.config.js (crítico - debe hacerse antes de desinstalar)
3. Actualizar package.json y ejecutar npm install
4. Actualizar documentación
5. Validar con build y dev
6. Búsqueda final de referencias

### Consideraciones Especiales

- La variable de entorno `NEXT_DISABLE_SENTRY` en instrumentation.ts sugiere que ya había una forma de deshabilitar Sentry, pero ahora lo eliminaremos completamente
- El archivo next.config.js tiene lógica condicional para aplicar Sentry solo en producción, lo cual simplifica la eliminación
- No hay componentes de React que usen Sentry directamente (como ErrorBoundary de Sentry), solo configuración a nivel de framework
