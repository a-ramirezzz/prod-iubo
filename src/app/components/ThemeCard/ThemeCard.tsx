// src/app/components/ThemeCard/ThemeCard.tsx
'use client'
import { useState, useEffect, useRef } from 'react'
import type { Theme } from '@/app/lib/themes'
import styles from '@/app/components/ThemeCard/ThemeCard.module.css'

/**
 * Defines the props for the ThemeCard component
 */
interface ThemeCardProps {
  theme: Theme
  isSelected: boolean
  onClick: () => void
}

// Configuration options for the IntersectionObserver
const observerOptions = {
  rootMargin: '0px',
  threshold: 0.5 // Trigger when 50% of the card is visible
}

/**
 * A card component that allows users to select a visual theme
 * It lazy-loads video previews for animated themes when they scroll into view
 */
export default function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  // A ref for the card element to attach the IntersectionObserver
  const cardRef = useRef<HTMLButtonElement>(null)
  // State to track if the card is currently visible in the viewport
  const [isInView, setIsInView] = useState(false)

  useEffect(() => {
    // Keep a reference to the current element to use in the cleanup function
    const currentCardElement = cardRef.current

    // The observer calls setIsInView when the card's visibility changes
    const observer = new IntersectionObserver(([entry]) => {
      setIsInView(entry.isIntersecting)
    }, observerOptions)

    // Start observing the card element if it exists
    if (currentCardElement) {
      observer.observe(currentCardElement)
    }

    // Cleanup function to stop observing when the component unmounts
    return () => {
      if (currentCardElement) {
        observer.unobserve(currentCardElement)
      }
    }
  }, [])

  // Determine if the video preview should be played
  const shouldPlayVideo = theme.type === 'animated' && isInView

  return (
    <button
      ref={cardRef}
      className={`${styles.themeCard} ${isSelected ? styles.activeTheme : ''}`}
      onClick={onClick}
      aria-pressed={isSelected} // Semantically indicates if the theme is selected
      aria-label={`Select theme: ${theme.name}`} // Provides a clear action for screen readers
    >
      <div className={styles.previewContainer}>
        {shouldPlayVideo && theme.backgroundVideo ? (
          <video
            key={theme.backgroundVideo} // Re-renders video if src changes
            src={theme.backgroundVideo}
            autoPlay
            loop
            muted
            playsInline // Essential for autoplay on mobile browsers
            className={styles.themePreviewVideo}
          />
        ) : (
          // This comment disables a Next.js-specific linting rule
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={theme.previewImage}
            alt={`Preview of ${theme.name} theme`} // More descriptive alt text
            loading="lazy"
            className={styles.themePreviewImage}
          />
        )}
      </div>
      <span className={styles.themeName}>{theme.name}</span>
    </button>
  )
}
