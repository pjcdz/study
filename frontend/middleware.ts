import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';

// Lista de los idiomas soportados
const LOCALES = ['en', 'es'];
const DEFAULT_LOCALE = 'es';

export default createMiddleware({
  // Una lista de todos los idiomas disponibles
  locales: LOCALES,
  
  // Idioma por defecto
  defaultLocale: DEFAULT_LOCALE,

  // Asegurar que el prefijo de locale siempre esté presente en las URLs
  localePrefix: 'always',

  // Activar la detección automática del idioma del navegador
  localeDetection: true
});
 
export const config = {
  // Matches all pathnames except for
  // - ... all files in /public (e.g. /favicon.ico, /images/...)
  // - ... any API routes (/api, /api/...)
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)']
};