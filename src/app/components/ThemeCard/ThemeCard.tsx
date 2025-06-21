// src/app/components/ThemeCard/ThemeCard.tsx
'use client';
import { useState, useEffect, useRef } from 'react';
import type { Theme } from '../../lib/themes';
import styles from './ThemeCard.module.css';

interface ThemeCardProps {
  theme: Theme;
  isSelected: boolean;
  onClick: () => void;
}

export default function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const currentCardRef = cardRef.current; 

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      {
        rootMargin: '0px',
        threshold: 0.5 
      }
    );

    if (currentCardRef) {
      observer.observe(currentCardRef);
    }

    return () => {
      if (currentCardRef) {
        observer.unobserve(currentCardRef);
      }
    };
  }, []);

  const showVideoPreview = theme.type === 'animated' && isInView;

  return (
    <div
      ref={cardRef}
      className={`${styles.themeCard} ${isSelected ? styles.activeTheme : ''}`}
      onClick={onClick}
    >
      <div className={styles.previewContainer}>
        {showVideoPreview && theme.backgroundVideo ? (
          <video
            key={theme.backgroundVideo}
            src={theme.backgroundVideo}
            autoPlay
            loop
            muted
            playsInline
            className={styles.themePreviewVideo}
          />
        ) : (
          // Usamos la etiqueta <img> estándar
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={theme.previewImage}
            alt={theme.name}
            loading="lazy"
            className={styles.themePreviewImage}
          />
        )}
      </div>
      <span className={styles.themeName}>{theme.name}</span>
    </div>
  );
}
