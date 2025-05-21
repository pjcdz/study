"use client"

import { useState, useEffect } from 'react'

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768) // Consideramos móvil si es menor a 768px
    }
    
    // Verificar al cargar
    checkIsMobile()
    
    // Verificar al cambiar el tamaño de la ventana
    window.addEventListener('resize', checkIsMobile)
    
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  return isMobile
}