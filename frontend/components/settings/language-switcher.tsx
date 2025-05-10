"use client"

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Globe } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const t = useTranslations('settings.language');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Wait for component to mount to avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const switchLocale = (newLocale: string) => {
    // Conserva la ruta actual al cambiar de idioma
    // Elimina el prefijo de idioma actual para obtener la ruta base
    const basePathname = pathname.replace(/^\/[a-z]{2}/, '');
    
    // Construye la nueva ruta con el nuevo idioma
    const newPath = `/${newLocale}${basePathname}`;
    router.push(newPath);
  };

  // Get the current locale code in uppercase
  const localeCode = locale.toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 px-3">
          <Globe className="h-5 w-5" />
          <span className="font-medium text-xs">{localeCode}</span>
          <span className="sr-only">{t('label')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => switchLocale('es')}
          className={cn(
            "cursor-pointer",
            locale === 'es' ? 'bg-muted' : ''
          )}
        >
          {t('options.es')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => switchLocale('en')}
          className={cn(
            "cursor-pointer",
            locale === 'en' ? 'bg-muted' : ''
          )}
        >
          {t('options.en')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}