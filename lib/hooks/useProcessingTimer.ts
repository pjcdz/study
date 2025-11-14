import { useState, useEffect, useCallback } from 'react'
import { useUploadStore } from '@/store/use-upload-store'

/**
 * Custom hook for managing processing timer across page navigation
 * This provides a consistent timer experience for processing operations
 */
export function useProcessingTimer() {
  // Get values and functions from the global store
  const { 
    isLoading,
    processingStartTime,
    elapsedTimeMs,
    startProcessing,
    stopProcessing,
    updateElapsedTime,
    setIsLoading
  } = useUploadStore()

  // Local state to hold the display time string
  const [displayTime, setDisplayTime] = useState<string>('0ms')
  
  // Format time in ms to a display string
  const formatElapsedTime = useCallback((ms: number): string => {
    if (ms < 1000) {
      return `${ms}ms`
    } else {
      const seconds = Math.floor(ms / 1000)
      const milliseconds = ms % 1000
      return `${seconds}.${milliseconds.toString().padStart(3, '0')}s`
    }
  }, [])

  // Update timer at regular intervals when loading
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null
    
    if (isLoading) {
      // Use existing start time or create new one
      if (!processingStartTime) {
        startProcessing()
      }
      
      // Update every 10ms
      timerId = setInterval(() => {
        updateElapsedTime()
      }, 10)
    } else if (timerId) {
      clearInterval(timerId)
    }
    
    // Format the display time whenever elapsedTimeMs changes
    setDisplayTime(formatElapsedTime(elapsedTimeMs))
    
    return () => {
      if (timerId) clearInterval(timerId)
    }
  }, [isLoading, processingStartTime, elapsedTimeMs, startProcessing, updateElapsedTime, formatElapsedTime])

  return {
    isLoading,
    displayTime,
    startProcessing,
    stopProcessing,
    setIsLoading
  }
}