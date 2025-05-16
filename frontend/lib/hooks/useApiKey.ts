"use client"

import { useState, useEffect, useCallback } from "react"

// Clave para almacenamiento local
const API_KEY_STORAGE_KEY = 'studyToolUserApiKey'

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isAvailable, setIsAvailable] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Cargar la API key del localStorage al iniciar
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY)
      setApiKey(savedKey)
      setIsAvailable(!!savedKey)
      setIsLoading(false)
    }
  }, [])

  // Guardar la API key
  const saveApiKey = useCallback((key: string) => {
    if (typeof window !== 'undefined' && key) {
      localStorage.setItem(API_KEY_STORAGE_KEY, key)
      setApiKey(key)
      setIsAvailable(true)
    }
  }, [])

  // Obtener la API key
  const getApiKey = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE_KEY)
    }
    return null
  }, [])

  // Limpiar la API key
  const clearApiKey = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(API_KEY_STORAGE_KEY)
      setApiKey(null)
      setIsAvailable(false)
    }
  }, [])

  return { 
    apiKey,
    isAvailable,
    isLoading,
    saveApiKey,
    getApiKey,
    clearApiKey
  }
}