"use client"

import { useState, useEffect, useCallback, useRef } from "react"

// Clave para almacenamiento local
const API_KEY_STORAGE_KEY = 'studyToolUserApiKey'

// Variable global para sincronización entre instancias del hook
let globalApiKeyState = {
  apiKey: null as string | null,
  isAvailable: false
};

// Función para actualizar listeners
const listeners: Array<() => void> = [];
const notifyListeners = () => {
  listeners.forEach(listener => listener());
};

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string | null>(globalApiKeyState.apiKey)
  const [isAvailable, setIsAvailable] = useState<boolean>(globalApiKeyState.isAvailable)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  
  // Ref para rastrear si el hook ya se montó
  const isMounted = useRef(false)

  // Registrar listener para actualizar este componente cuando cambie el estado global
  useEffect(() => {
    const updateFromGlobal = () => {
      setApiKey(globalApiKeyState.apiKey);
      setIsAvailable(globalApiKeyState.isAvailable);
    };
    
    listeners.push(updateFromGlobal);
    
    return () => {
      const index = listeners.indexOf(updateFromGlobal);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  // Cargar la API key del localStorage al iniciar
  useEffect(() => {
    const loadApiKey = async () => {
      setIsLoading(true)
      
      if (typeof window !== 'undefined') {
        try {
          // Obtener la clave de localStorage
          const savedKey = localStorage.getItem(API_KEY_STORAGE_KEY)
          
          // Actualizar estado local y global
          setApiKey(savedKey)
          setIsAvailable(!!savedKey)
          
          // Actualizar estado global
          globalApiKeyState.apiKey = savedKey;
          globalApiKeyState.isAvailable = !!savedKey;
        } catch (error) {
          console.error('Error loading API key from localStorage:', error)
        } finally {
          setIsLoading(false)
          isMounted.current = true
        }
      } else {
        setIsLoading(false)
      }
    }
    
    loadApiKey()
    
    // Este efecto solo se debe ejecutar una vez al montar el componente
  }, [])

  // Guardar la API key - ahora con manejo de estado global
  const saveApiKey = useCallback((key: string): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined' && key) {
        try {
          // Guardar en localStorage
          localStorage.setItem(API_KEY_STORAGE_KEY, key)
          
          // Actualizar estado local
          setApiKey(key)
          setIsAvailable(true)
          
          // Actualizar estado global para sincronizar todos los componentes
          globalApiKeyState.apiKey = key;
          globalApiKeyState.isAvailable = true;
          
          // Notificar a todos los componentes que usan este hook
          notifyListeners();
          
          // Resolver inmediatamente, no necesitamos esperar
          resolve(true)
        } catch (error) {
          console.error('Error saving API key to localStorage:', error)
          reject(error)
        }
      } else {
        reject(new Error('Cannot save API key: window is undefined or key is empty'))
      }
    })
  }, [])

  // Obtener la API key
  const getApiKey = useCallback(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(API_KEY_STORAGE_KEY)
    }
    return null
  }, [])

  // Limpiar la API key
  const clearApiKey = useCallback((): Promise<boolean> => {
    return new Promise((resolve, reject) => {
      if (typeof window !== 'undefined') {
        try {
          // Eliminar de localStorage
          localStorage.removeItem(API_KEY_STORAGE_KEY)
          
          // Actualizar estado local
          setApiKey(null)
          setIsAvailable(false)
          
          // Actualizar estado global
          globalApiKeyState.apiKey = null;
          globalApiKeyState.isAvailable = false;
          
          // Notificar a todos los componentes
          notifyListeners();
          
          resolve(true)
        } catch (error) {
          console.error('Error clearing API key from localStorage:', error)
          reject(error)
        }
      } else {
        reject(new Error('Cannot clear API key: window is undefined'))
      }
    })
  }, [])

  return { 
    apiKey,
    isAvailable,
    isLoading,
    isMounted: isMounted.current,
    saveApiKey,
    getApiKey,
    clearApiKey
  }
}