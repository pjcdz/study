import * as Sentry from '@sentry/nextjs';

export async function register() {
  // Skip instrumentation in development for faster startup
  if (process.env.NODE_ENV !== 'production' || process.env.NEXT_DISABLE_SENTRY === 'true') {
    return;
  }

  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('./sentry.edge.config');
  }
}

export const onRequestError = Sentry.captureRequestError;
