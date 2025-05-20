'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Cuando cambia la ruta, actualizamos el contexto de Sentry
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Actualizamos el contexto de Sentry con información de página
    // Usando setTag directamente en vez de configureScope
    Sentry.setTag('page_location', url);
    Sentry.setTag('page_path', pathname);

    // También podríamos rastrear cambios de página en Google Analytics aquí
    // si necesitamos más control que el proporcionado en layout.tsx
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null; // Este componente no renderiza nada
}