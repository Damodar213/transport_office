import { useEffect, useCallback } from 'react'

export function useSessionRefresh(onSessionChange: () => void) {
  const refreshData = useCallback(() => {
    console.log('Session change detected, refreshing data...')
    onSessionChange()
  }, [onSessionChange])

  useEffect(() => {
    // Listen for storage changes (login/logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'session' || e.key === null) {
        refreshData()
      }
    }

    // Listen for visibility changes (tab switching)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshData()
      }
    }

    // Listen for focus changes (window switching)
    const handleFocus = () => {
      refreshData()
    }

    // Add event listeners
    window.addEventListener('storage', handleStorageChange)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)

    // Cleanup
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [refreshData])

  return refreshData
}

