// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f54e946a2089bfff98525c4623d0a330@o4509353727033344.ingest.us.sentry.io/4509353728475136",

  // Integraciones para características adicionales
  integrations: [
    Sentry.replayIntegration(), // Habilita la reproducción de sesiones
    // Eliminamos BrowserTracing que no está disponible en esta versión
  ],

  // Reducimos el muestreo de trazas al 10% en producción para conservar la cuota
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Configuración optimizada para Replay
  // En producción, solo grabamos el 1% de las sesiones normales para ahorrar cuota
  replaysSessionSampleRate: process.env.NODE_ENV === 'production' ? 0.01 : 0.1,

  // Cuando hay errores, grabamos el 50% de las sesiones con errores en producción
  replaysOnErrorSampleRate: process.env.NODE_ENV === 'production' ? 0.5 : 1.0,

  // Debug solo en desarrollo
  debug: process.env.NODE_ENV !== 'production',
  
  // Configuramos datos de entorno
  environment: process.env.NODE_ENV || 'development',
  
  // Añadimos información de versión
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',

  // Configuración inicial del scope para agregar contexto útil
  initialScope: {
    tags: { 
      environment: process.env.NODE_ENV || 'development',
      service: 'client'
    },
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;