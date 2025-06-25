// src/app/components/AmbientSoundPlayer/AmbientSoundPlayer.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useSettings } from '../../context/SettingsContext'
import { sounds, noSound } from '../../lib/sounds'

/**
 * A component that plays ambient sounds in the background based on user settings
 * It automatically handles play, pause, volume changes, and sound selection
 */
export default function AmbientSoundPlayer() {
  // Get settings from the application's context
  const { settings } = useSettings()

  // Create a ref to hold the HTMLAudioElement for direct manipulation
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    // Get the audio element from the ref
    const audio = audioRef.current

    // Abort if the audio element is not yet rendered
    if (!audio) {
      return
    }

    // Find the sound object that matches the current setting
    const selectedSound = sounds.find(s => s.id === settings.backgroundSound) || noSound

    // Always apply the volume from settings, as it can change independently
    audio.volume = settings.volume

    // --- Audio Playback Logic ---

    // Case 1: The user has selected "None"
    // Pause the audio and clear the source to stop playback
    if (selectedSound.id === 'none') {
      audio.pause()
      audio.src = ''
      return
    }

    // Case 2: A new sound has been selected
    // We check if the current source is different from the selected one
    const isNewSoundSource = !audio.currentSrc.includes(selectedSound.src)
    if (isNewSoundSource) {
      audio.src = selectedSound.src
      audio.load() // Load the new audio source
    }

    // Case 3: Play the audio
    // This will play the new sound or resume the current one if it was paused
    const playPromise = audio.play()

    // The play() method returns a promise; we must handle potential rejections
    // This often happens if the user has not interacted with the page first
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.error("Audio playback failed, possibly due to browser policy:", error)
      })
    }

    // --- Effect Cleanup ---
    // This function runs when the component unmounts or dependencies change
    return () => {
      // We pause the audio to prevent memory leaks or sound playing on other pages
      audio.pause()
    }
  }, [settings.backgroundSound, settings.volume])

  // The audio element is rendered but controlled entirely via the useEffect hook
  return <audio ref={audioRef} loop />
}
