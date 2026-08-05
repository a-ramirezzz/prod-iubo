"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import styles from '@/app/LandingPage.module.css';
import { useEffect, useRef } from 'react';
import { useLocale } from '@/app/lib/i18n';

export function FeaturesSection() {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-triggered reveal, scoped to this section's [data-reveal] elements
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const els = container.querySelectorAll('[data-reveal]');
    els.forEach(el => el.classList.add(styles.reveal));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add(styles.revealed);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <section className={styles.section} id="caracteristicas">
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>{t('landing.features.title')}</h2>
        <div className={styles.featuresGrid} ref={containerRef}>
          {/* Feature 1: Immersive Personalization */}
          <div className={styles.featureCard} data-reveal>
            <div className={styles.featureIcon}>
              {/* Custom SVG icon for personalization */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
                <path d="M19 15L19.74 17.74L22.5 18.5L19.74 19.26L19 22L18.26 19.26L15.5 18.5L18.26 17.74L19 15Z" fill="currentColor"/>
                <path d="M5 6L5.5 7.5L7 8L5.5 8.5L5 10L4.5 8.5L3 8L4.5 7.5L5 6Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>{t('landing.features.cards.0.title')}</h3>
            <p className={styles.featureDescription}>
              {t('landing.features.cards.0.description')}
            </p>
          </div>

          {/* Feature 2: Ambient Sounds */}
          <div className={styles.featureCard} data-reveal>
            <div className={styles.featureIcon}>
              {/* Custom SVG icon for audio/sound */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 3V13.55C11.41 13.21 10.73 13 10 13C7.79 13 6 14.79 6 17C6 19.21 7.79 21 10 21C12.21 21 14 19.21 14 17V7H18V3H12Z" fill="currentColor"/>
                <path d="M10 19C8.9 19 8 18.1 8 17C8 15.9 8.9 15 10 15C11.1 15 12 15.9 12 17C12 18.1 11.1 19 10 19Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>{t('landing.features.cards.1.title')}</h3>
            <p className={styles.featureDescription}>
              {t('landing.features.cards.1.description')}
            </p>
          </div>

          {/* Feature 3: Total Flexibility */}
          <div className={styles.featureCard} data-reveal>
            <div className={styles.featureIcon}>
              {/* Custom SVG icon for list/tasks */}
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 3H5C3.89 3 3 3.89 3 5V19C3 20.11 3.89 21 5 21H19C20.11 21 21 20.11 21 19V5C21 3.89 20.11 3 19 3ZM19 19H5V5H19V19Z" fill="currentColor"/>
                <path d="M7 7H17V9H7V7Z" fill="currentColor"/>
                <path d="M7 11H17V13H7V11Z" fill="currentColor"/>
                <path d="M7 15H14V17H7V15Z" fill="currentColor"/>
              </svg>
            </div>
            <h3 className={styles.featureTitle}>{t('landing.features.cards.2.title')}</h3>
            <p className={styles.featureDescription}>
              {t('landing.features.cards.2.description')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturesSection;
