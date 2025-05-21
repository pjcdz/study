'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';

export function Analytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Track page views in Google Analytics
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    
    // Google Analytics tracking
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'page_view', {
        page_path: url,
      });
    }
  }, [pathname, searchParams]);

  return null; // This component doesn't render anything
}