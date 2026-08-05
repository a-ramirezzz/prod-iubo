"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import Image from 'next/image';
import styles from '@/app/LandingPage.module.css';
import { useEffect, useRef } from 'react';
import { useLocale } from '@/app/lib/i18n';

export function GallerySection() {
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
    <section className={styles.section} id="galeria">
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>{t('landing.gallery.title')}</h2>
        <div className={styles.gallery} ref={containerRef}>
          {/* Static theme screenshot */}
          <div className={styles.galleryItem} data-reveal>
            <div className={styles.imageContainer}>
              <Image
                src="/captura-estatico.png"
                alt={t('landing.gallery.staticThemeAlt')}
                width={600}
                height={400}
                className={styles.galleryImage}
              />
              <div className={styles.imageOverlay}>
                <span>{t('landing.gallery.staticTheme')}</span>
              </div>
            </div>
          </div>

          {/* Animated theme video demo */}
          <div className={styles.galleryItem} data-reveal>
            <div className={styles.videoContainer}>
              <video
                autoPlay
                loop
                muted
                playsInline
                className={styles.galleryVideo}
              >
                {/* Multiple video formats for browser compatibility */}
                <source src="/captura-animado.mp4" type="video/mp4" />
                <source src="/captura-animado.webm" type="video/webm" />
                {t('landing.gallery.videoFallback')}
              </video>
              <div className={styles.videoOverlay}>
                <span className={styles.videoLabel}>{t('landing.gallery.animatedTheme')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GallerySection;
