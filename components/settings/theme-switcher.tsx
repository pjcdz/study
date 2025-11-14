"use client"

import { useState, useEffect } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from 'next-intl'
import { Button } from "@/components/ui/button"
import { Sun, Moon, Laptop } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu"

export function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()
  const t = useTranslations('settings.theme')
  
  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }
  
  // Determinar qué icono mostrar según el tema actual
  const ThemeIcon = theme === 'dark' ? Moon : theme === 'light' ? Sun : Laptop
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          title={t('title')} 
          className="transition-all hover:border-ring hover:border-2 hover:shadow-[0_0_8px_rgba(var(--color-ring)/0.4)]"
        >
          <ThemeIcon className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme('light')}>
          <Sun className="h-4 w-4 mr-2" />
          <span>{t('options.light')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')}>
          <Moon className="h-4 w-4 mr-2" />
          <span>{t('options.dark')}</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')}>
          <Laptop className="h-4 w-4 mr-2" />
          <span>{t('options.system')}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}