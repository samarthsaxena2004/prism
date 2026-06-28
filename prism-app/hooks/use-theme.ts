'use client'

import { useTheme as useNextTheme } from 'next-themes'
import { useState, useEffect } from 'react'

export function useTheme() {
  const { theme, setTheme, systemTheme } = useNextTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Resolve the current theme (handles "system")
  const currentTheme = theme === 'system' ? systemTheme : theme

  const toggleTheme = () => {
    setTheme(currentTheme === 'light' ? 'dark' : 'light')
  }

  return { 
    theme: currentTheme, 
    toggleTheme, 
    mounted 
  }
}
