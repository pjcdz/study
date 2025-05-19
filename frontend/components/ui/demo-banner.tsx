'use client'

import { useEffect, useState } from 'react'
import { Beaker } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'

export function DemoBanner() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const t = useTranslations()
  
  useEffect(() => {
    // Check if we're in demo mode - prioritize env var if explicitly set to false
    let demoMode;
    
    if (process.env.USE_DEMO_CONTENT === 'false') {
      demoMode = false;
      // Clear localStorage if needed to maintain consistency
      if (window.localStorage.getItem('USE_DEMO_CONTENT') === 'true') {
        window.localStorage.removeItem('USE_DEMO_CONTENT');
      }
    } else {
      demoMode = process.env.USE_DEMO_CONTENT === 'true' || 
                window.localStorage.getItem('USE_DEMO_CONTENT') === 'true';
    }
    
    setIsDemoMode(demoMode);
  }, [])

  // Only render the banner if in demo mode
  if (!isDemoMode) return null
  
  return (
    <Badge 
      variant="outline" 
      className="fixed top-2 left-1/2 transform -translate-x-1/2 z-50 bg-yellow-50/70 hover:bg-yellow-50 text-yellow-700 border-yellow-200 py-1 px-2 text-xs font-normal shadow-sm"
    >
      <Beaker className="h-3 w-3 mr-1" />
      {t('common.demoBanner') || 'Demo Mode'}
    </Badge>
  )
}