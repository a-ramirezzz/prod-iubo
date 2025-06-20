// src/app/components/VideoBackground/VideoBackground.tsx
'use client';

import { useEffect, useRef } from 'react';
import styles from './VideoBackground.module.css';

interface VideoBackgroundProps {
  src: string;
}

export default function VideoBackground({ src }: VideoBackgroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // Este efecto se asegura de que el video se cargue y reproduzca
  // cuando la fuente (src) cambia.
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.src = src;
      videoRef.current.load();
      videoRef.current.play().catch(error => {
        // El autoplay puede fallar si el navegador lo bloquea,
        // pero al estar en 'muted', usualmente funciona.
        console.error("Video play failed:", error);
      });
    }
  }, [src]);

  return (
    <div className={styles.videoContainer}>
      <video
        ref={videoRef}
        className={styles.videoBackground}
        autoPlay
        loop
        muted // Requisito: sin sonido
        playsInline // Esencial para compatibilidad en iOS
      >
        {/* La fuente se establece dinámicamente con el useEffect */}
      </video>
    </div>
  );
}
