"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import styles from '@/app/LandingPage.module.css';
import { useEffect, useRef } from 'react';
import { useLocale } from '@/app/lib/i18n';

export function StatusSection() {
  const { t } = useLocale();
  const containerRef = useRef<HTMLUListElement>(null);

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
    <section className={styles.section} id="estado">
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>{t('landing.status.title')}</h2>
        <div className={styles.betaNotice}>
          <span className={styles.betaNoticeBadge}>{t('landing.status.betaBadge')}</span>
          <span>{t('landing.status.betaNotice')}</span>
        </div>
        <ul className={styles.statusList} ref={containerRef}>
          {['🚀', '⚙️', '🔜'].map((icon, i) => (
            <li data-reveal key={i}><span className={styles.statusIcon}>{icon}</span>{t(`landing.status.items.${i}`)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export default StatusSection;
