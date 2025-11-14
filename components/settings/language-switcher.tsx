"use client"

import { useRouter, usePathname } from "next/navigation"
import { useLocale, useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('settings.language')
  
  const handleLanguageChange = (newLocale: string) => {
    // Get the current pathname without the locale prefix
    const pathParts = pathname.split('/')
    const pathWithoutLocale = pathParts.slice(2).join('/')
    
    // Navigate to the same page but with the new locale
    router.push(`/${newLocale}/${pathWithoutLocale}`)
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          title={t('title')}
          className="transition-all hover:border-ring hover:border-2 hover:shadow-[0_0_8px_rgba(var(--color-ring)/0.4)]"
        >
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('es')}
          className={locale === 'es' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇪🇸</span>
          <span>{t('options.es')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={locale === 'en' ? 'bg-accent' : ''}
        >
          <span className="mr-2">🇺🇸</span>
          <span>{t('options.en')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}