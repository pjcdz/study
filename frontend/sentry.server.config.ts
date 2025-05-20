// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f54e946a2089bfff98525c4623d0a330@o4509353727033344.ingest.us.sentry.io/4509353728475136",

  // Reducimos el muestreo al 10% en producción para evitar consumir la cuota rápidamente
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Habilitamos el debug solo en desarrollo
  debug: process.env.NODE_ENV !== 'production',
  
  // Configuramos datos de entorno
  environment: process.env.NODE_ENV || 'development',
  
  // Añadimos información de versión (útil para seguimiento de errores por versión)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA || 'development',
  
  // Añadimos tags útiles para segmentación de errores
  initialScope: {
    tags: { 
      environment: process.env.NODE_ENV || 'development',
      service: 'server'
    },
  },
});
