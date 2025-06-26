// src/app/components/VideoBackground/VideoBackground.tsx
'use client'

import styles from '@/app/components/VideoBackground/VideoBackground.module.css'

/**
 * Defines the props for the VideoBackground component
 */
interface VideoBackgroundProps {
  // The source URL of the video to be played
  src: string
}

/**
 * A component that renders a looping, muted video as a full-screen background
 * It automatically re-renders and plays when the video source changes
 */
export default function VideoBackground({ src }: VideoBackgroundProps) {
  return (
    <div className={styles.videoContainer}>
      <video
        // Using the 'src' as a 'key' is a React pattern to force a re-mount
        // This ensures the new video loads and plays correctly when the src changes
        key={src}
        className={styles.videoBackground}
        autoPlay
        loop
        muted // Muting is often required for autoplay to work
        playsInline // Essential for video playback on iOS devices
        src={src} // Set the source directly
      >
        {/* Providing different sources for different formats can be done here */}
        {/* <source src={src} type="video/webm" /> */}
      </video>
    </div>
  )
}
