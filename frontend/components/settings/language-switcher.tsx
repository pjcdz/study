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

import { cn } from '@/lib/utils';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations('settings.language');

  const switchLocale = (newLocale: string) => {
    const newUrl = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(newUrl);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Eliminado el texto "Language:"/"Idioma:" */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="flex items-center gap-2 px-3">
            <Globe className="h-5 w-5" />
            <span className="font-medium text-xs">{locale.toUpperCase()}</span>
            <span className="sr-only">{t('label')}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => switchLocale('en')}
            className={cn(
              "cursor-pointer",
              locale === 'en' ? 'bg-muted' : ''
            )}
          >
            {t('options.en')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => switchLocale('es')}
            className={cn(
              "cursor-pointer",
              locale === 'es' ? 'bg-muted' : ''
            )}
          >
            {t('options.es')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}