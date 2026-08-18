"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import Image from 'next/image';
import styles from '@/app/LandingPage.module.css';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocale } from '@/app/lib/i18n';

export function GallerySection() {
  const { t } = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(true);

  const slides = [
    {
      key: 'static',
      alt: t('landing.gallery.staticThemeAlt'),
      label: t('landing.gallery.staticTheme'),
    },
    {
      key: 'animated',
      alt: t('landing.gallery.animatedTheme'),
      label: t('landing.gallery.animatedTheme'),
    },
  ];

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

  // Track which slide is active and whether prev/next are available
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const updateEdges = () => {
      const maxScroll = track.scrollWidth - track.clientWidth;
      setCanScrollPrev(track.scrollLeft > 8);
      setCanScrollNext(track.scrollLeft < maxScroll - 8);
    };
    updateEdges();
    track.addEventListener('scroll', updateEdges, { passive: true });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const index = slideRefs.current.indexOf(entry.target as HTMLDivElement);
            if (index !== -1) setActiveIndex(index);
          }
        });
      },
      { root: track, threshold: 0.5 }
    );
    slideRefs.current.forEach(el => el && observer.observe(el));

    return () => {
      track.removeEventListener('scroll', updateEdges);
      observer.disconnect();
    };
  }, []);

  const scrollByOne = useCallback((direction: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const firstSlide = slideRefs.current[0];
    const itemWidth = firstSlide ? firstSlide.getBoundingClientRect().width + 16 : track.clientWidth;
    track.scrollBy({ left: direction * itemWidth, behavior: 'smooth' });
  }, []);

  const scrollToSlide = useCallback((index: number) => {
    slideRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, []);

  return (
    <section className={styles.section} id="galeria">
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>{t('landing.gallery.title')}</h2>
        <div className={styles.carouselWrapper} ref={containerRef}>
          {canScrollPrev && (
            <button
              type="button"
              className={`${styles.carouselNav} ${styles.carouselNavPrev}`}
              onClick={() => scrollByOne(-1)}
              aria-label={t('landing.gallery.prev')}
            >
              ‹
            </button>
          )}

          <div
            className={styles.carouselTrack}
            ref={trackRef}
            role="region"
            aria-label={t('landing.gallery.regionLabel')}
          >
            {/* Static theme screenshot */}
            <div
              className={`${styles.carouselSlide} ${styles.galleryItem}`}
              data-reveal
              ref={el => { slideRefs.current[0] = el; }}
              role="group"
              aria-label={`${t('landing.gallery.slideLabel')} 1 / ${slides.length}`}
            >
              <div className={styles.imageContainer}>
                <Image
                  src="/captura-estatico.png"
                  alt={slides[0].alt}
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
            <div
              className={`${styles.carouselSlide} ${styles.galleryItem}`}
              data-reveal
              ref={el => { slideRefs.current[1] = el; }}
              role="group"
              aria-label={`${t('landing.gallery.slideLabel')} 2 / ${slides.length}`}
            >
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

          {canScrollNext && (
            <button
              type="button"
              className={`${styles.carouselNav} ${styles.carouselNavNext}`}
              onClick={() => scrollByOne(1)}
              aria-label={t('landing.gallery.next')}
            >
              ›
            </button>
          )}
        </div>

        <div className={styles.carouselDots}>
          {slides.map((slide, index) => (
            <button
              key={slide.key}
              type="button"
              className={`${styles.carouselDot} ${index === activeIndex ? styles.carouselDotActive : ''}`}
              onClick={() => scrollToSlide(index)}
              aria-label={`${t('landing.gallery.goToSlide')} ${index + 1}`}
              aria-current={index === activeIndex}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default GallerySection;
