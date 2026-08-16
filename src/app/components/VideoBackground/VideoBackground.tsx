// src/app/components/VideoBackground/VideoBackground.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import styles from '@/app/components/VideoBackground/VideoBackground.module.css'

/**
 * Defines the props for the VideoBackground component
 */
interface VideoBackgroundProps {
  // The source URL of the video to be played
  src: string
  // The poster frame shown instantly while the video buffers
  poster?: string
}

/**
 * A component that renders a looping, muted video as a full-screen background
 * A poster frame is shown immediately; the video is lazy-loaded (preload="none")
 * and crossfades in once it can play through without interruption
 */
export default function VideoBackground({ src, poster }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [videoReady, setVideoReady] = useState(false)

  useEffect(() => {
    // Reset the crossfade state whenever the source changes
    setVideoReady(false)

    const video = videoRef.current
    if (!video) return

    const handleCanPlayThrough = () => {
      video.play().catch(() => {
        // Autoplay can be rejected by the browser; the poster remains visible in that case
      })
      setVideoReady(true)
    }

    video.addEventListener('canplaythrough', handleCanPlayThrough)
    // Assigning the src explicitly (rather than via JSX) keeps preload="none"
    // from being overridden and lets us tear it down cleanly on cleanup
    video.src = src
    video.load()

    return () => {
      video.removeEventListener('canplaythrough', handleCanPlayThrough)
      // Stop any in-progress download and release the resource
      video.pause()
      video.removeAttribute('src')
      video.load()
    }
  }, [src])

  return (
    <div className={styles.videoContainer}>
      {poster && (
        <div
          className={styles.poster}
          style={{ backgroundImage: `url(${poster})`, opacity: videoReady ? 0 : 1 }}
        />
      )}
      <video
        ref={videoRef}
        className={styles.videoBackground}
        style={{ opacity: videoReady ? 1 : 0 }}
        autoPlay
        loop
        muted
        playsInline
        preload="none"
        poster={poster}
      />
    </div>
  )
}
