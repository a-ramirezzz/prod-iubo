// src/app/components/AmbientSoundPlayer/AmbientSoundPlayer.tsx
'use client'

import { useEffect } from 'react'
import { useSettings } from '@/context/SettingsContext'
import { useAudio } from '@/hooks/useAudio'

/**
 * A component that plays ambient sounds in the background based on user settings
 * It automatically handles play, pause, volume changes, and sound selection
 */
export default function AmbientSoundPlayer() {
  // Get settings from the application's context
  const { settings } = useSettings()

  const { startAmbient, stopAmbient, setVolume } = useAudio({ volume: settings.volume })

  // Start/switch/stop the ambient track when the selected sound changes.
  useEffect(() => {
    if (settings.background_sound === 'none') {
      stopAmbient()
    } else {
      startAmbient(settings.background_sound)
    }
  }, [settings.background_sound, startAmbient, stopAmbient])

  // Apply volume changes independently, without restarting the track.
  useEffect(() => {
    setVolume(settings.volume)
  }, [settings.volume, setVolume])

  // No DOM output — playback is handled entirely by the Web Audio graph.
  return null
}
