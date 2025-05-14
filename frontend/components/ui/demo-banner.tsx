'use client'

import { useEffect, useState } from 'react'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useTranslations } from 'next-intl'

export function DemoBanner() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const t = useTranslations()
  
  useEffect(() => {
    // Check if we're in demo mode
    const demoMode = process.env.USE_DEMO_CONTENT === 'true' || 
                    window.localStorage.getItem('USE_DEMO_CONTENT') === 'true'
    setIsDemoMode(demoMode)
  }, [])

  // Only render the banner if in demo mode
  if (!isDemoMode) return null
  
  return (
    <Alert variant="default" className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center bg-yellow-100 border-yellow-400 text-yellow-800 py-2">
      <AlertCircle className="h-4 w-4 mr-2" />
      <AlertDescription>
        🧪 {t('common.demoBanner') || 'Demo Mode: Using fixed content for testing'}
      </AlertDescription>
    </Alert>
  )
}