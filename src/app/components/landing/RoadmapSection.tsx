"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import styles from '@/app/LandingPage.module.css';
import { useEffect, useRef } from 'react';
import { useLocale } from '@/app/lib/i18n';

export function RoadmapSection() {
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
    <section className={styles.section} id="roadmap">
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>{t('landing.roadmap.title')}</h2>
        <div className={styles.roadmapWrapper}>
          <div className={styles.roadmapGrid} ref={containerRef}>
            {[
              { i: 0, done: true },
              { i: 1, done: true },
              { i: 2, done: false },
              { i: 3, done: false },
            ].map(({ i, done }) => (
              <div
                className={styles.roadmapItem + ' ' + (done ? styles.roadmapDone : styles.roadmapNext)}
                data-reveal
                key={i}
              >
                <span className={styles.roadmapIcon}>{done ? '✔️' : '🔜'}</span>
                <span>{t(`landing.roadmap.items.${i}.title`)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default RoadmapSection;
