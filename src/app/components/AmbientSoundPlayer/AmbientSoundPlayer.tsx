// src/app/components/AmbientSoundPlayer/AmbientSoundPlayer.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { sounds, noSound } from '../../lib/sounds';

export default function AmbientSoundPlayer() {
  const { settings } = useSettings();
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Busca el sonido seleccionado en nuestra biblioteca
    const selectedSound = sounds.find(s => s.id === settings.backgroundSound) || noSound;

    // Actualiza el volumen
    audio.volume = settings.volume;

    // Si el sonido seleccionado es diferente al que se está reproduciendo
    if (audio.currentSrc.includes(selectedSound.src) && selectedSound.src !== '') {
      if (audio.paused) {
        audio.play().catch(console.error);
      }
      return;
    }
    
    // Si el sonido es "Ninguno", pausa y limpia el src
    if (selectedSound.id === 'none') {
      audio.pause();
      audio.src = '';
    } else {
      // Si es un sonido nuevo, actualiza el src, carga y reproduce
      audio.src = selectedSound.src;
      audio.load();
      audio.play().catch(error => {
        // El autoplay puede ser bloqueado, este log ayuda a depurar
        console.error("Audio play failed:", error);
      });
    }

  }, [settings.backgroundSound, settings.volume]);

  return <audio ref={audioRef} loop />;
}
