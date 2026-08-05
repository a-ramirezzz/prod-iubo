"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import styles from '@/app/LandingPage.module.css';
import { useEffect, useRef } from 'react';
import { useLocale } from '@/app/lib/i18n';

export function PomodoroSection() {
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
    <div className={styles.pomodoroSection} ref={containerRef}>
      {/* Section header with animated icon */}
      <h3 className={styles.pomodoroTitle}>
        <span className={styles.pomodoroIcon}>🍅</span>
        {t('landing.pomodoro.title')}
      </h3>
      {/* Introduction to Pomodoro technique */}
      <p className={styles.pomodoroIntro}>
        {t('landing.pomodoro.intro')}
      </p>

      {/* Step-by-step Pomodoro process */}
      <div className={styles.pomodoroSteps}>
        {[0, 1, 2, 3].map((i) => (
          <div className={styles.pomodoroStep} data-reveal key={i}>
            <div className={styles.stepNumber}>{i + 1}</div>
            <div className={styles.stepContent}>
              <h4>{t(`landing.pomodoro.steps.${i}.title`)}</h4>
              <p>{t(`landing.pomodoro.steps.${i}.description`)}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Benefits of Pomodoro technique */}
      <div className={styles.pomodoroBenefits}>
        <h4>{t('landing.pomodoro.benefitsTitle')}</h4>
        <div className={styles.benefitsGrid}>
          {['🎯', '⏰', '🧠', '📈'].map((icon, i) => (
            <div className={styles.benefitItem} key={i}>
              <span className={styles.benefitIcon}>{icon}</span>
              <span>{t(`landing.pomodoro.benefits.${i}`)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PomodoroSection;
