# Implementation Plan

- [x] 1. Eliminar archivos de configuración de Sentry


  - Eliminar sentry.server.config.ts del root del proyecto
  - Eliminar sentry.edge.config.ts del root del proyecto
  - Eliminar instrumentation.ts del root del proyecto
  - Eliminar instrumentation-client.ts del root del proyecto
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Actualizar next.config.js para remover integración de Sentry


  - Eliminar el import de withSentryConfig desde @sentry/nextjs
  - Eliminar la variable shouldUseSentry y su lógica condicional
  - Simplificar la exportación del módulo para usar solo withNextIntl(nextConfig)
  - Eliminar toda la configuración de Sentry (org, project, silent, widenClientFileUpload, tunnelRoute, disableLogger, automaticVercelMonitors)
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [x] 3. Desinstalar paquete de Sentry


  - Eliminar la dependencia @sentry/nextjs del package.json
  - Ejecutar npm install para actualizar node_modules y package-lock.json
  - Verificar que no queden paquetes relacionados con Sentry en node_modules
  - _Requirements: 2.1, 2.2_

- [x] 4. Actualizar documentación del proyecto


  - Eliminar la mención de "Monitoreo de Errores: Integración con Sentry..." de la sección de características en README.md
  - Eliminar "Sentry para monitoreo de errores y performance" de la lista de tecnologías en README.md
  - Eliminar referencias a variables de entorno SENTRY_DSN y SENTRY_AUTH_TOKEN de la sección de deployment en README.md
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [x] 5. Limpiar referencias en spec de migración


  - Actualizar .kiro/specs/docker-to-nextjs-migration/tasks.md para remover o actualizar referencias a archivos de Sentry
  - Actualizar referencias a variables de entorno SENTRY_* en el spec de migración
  - _Requirements: 5.1_

- [x] 6. Validar eliminación completa



  - Ejecutar npm run build para verificar que la aplicación compila sin errores
  - Ejecutar npm run dev para verificar que la aplicación inicia correctamente
  - Realizar búsqueda de referencias a "sentry" en el código (excluyendo node_modules, .git, .next)
  - Verificar que no hay imports de @sentry/* en ningún archivo del proyecto
  - _Requirements: 2.3, 5.2, 5.3_
