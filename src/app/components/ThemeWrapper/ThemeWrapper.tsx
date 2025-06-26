// src/app/components/ThemeWrapper.tsx
'use client'

import { useSettings } from '@/context/SettingsContext'
import { useEffect, useMemo, useRef } from 'react'
import { themes } from '@/app/lib/themes'
import VideoBackground from '@/app/components/VideoBackground/VideoBackground'

/**
 * A top-level component that wraps the entire application to apply
 * the selected theme (colors, background, etc.) dynamically
 */
export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  // Get settings from the context
  const { settings } = useSettings()
  // A ref to store the CSS properties applied by the previous theme for cleanup
  const appliedStyleKeys = useRef<string[]>([])

  // Effect to handle light/dark mode switching
  useEffect(() => {
    const root = document.documentElement
    // Determine the class to apply based on the theme mode setting
    const modeClass = settings.themeMode === 'light' ? 'light-mode' : 'dark-mode'
    
    // Clean up previous classes and apply the new one
    root.classList.remove('light-mode', 'dark-mode')
    root.classList.add(modeClass)
  }, [settings.themeMode])

  // Find the active theme object based on the selected ID
  // useMemo prevents re-calculating this on every render unless the ID changes
  const activeTheme = useMemo(() => {
    return themes.find(theme => theme.id === settings.selectedThemeId)
  }, [settings.selectedThemeId])

  // Effect to apply the specific theme's styles (colors, background, etc.)
  useEffect(() => {
    const root = document.documentElement

    // --- Cleanup Phase ---
    // Remove all CSS variables set by the previous theme
    appliedStyleKeys.current.forEach(key => {
      root.style.removeProperty(key)
    })
    appliedStyleKeys.current = [] // Reset the list of keys

    // --- Application Phase ---
    if (activeTheme) {
      // Apply new theme's styles as CSS custom properties
      for (const [key, value] of Object.entries(activeTheme.styles)) {
        if (value) {
          root.style.setProperty(key, value)
          // Keep track of the applied property key for the next cleanup
          appliedStyleKeys.current.push(key)
        }
      }

      // Handle the background image for static themes
      if (activeTheme.type === 'static' && activeTheme.styles['--bg-image']) {
        root.style.backgroundImage = activeTheme.styles['--bg-image']
      } else {
        root.style.backgroundImage = 'none' // Ensure no background image for animated themes
      }
    }
  }, [activeTheme]) // This effect runs only when the activeTheme object changes

  return (
    <>
      {/* Conditionally render the video background if the theme is animated */}
      {activeTheme?.type === 'animated' && activeTheme.backgroundVideo && (
        <VideoBackground src={activeTheme.backgroundVideo} />
      )}
      {children}
    </>
  )
}
