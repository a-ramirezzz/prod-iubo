"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import styles from '@/app/LandingPage.module.css';
import { useLocale } from '@/app/lib/i18n';

export function IntroSection() {
  const { t } = useLocale();

  return (
    <section className={styles.section} id="informacion">
      <div className={styles.content}>
        <h2 className={styles.sectionTitle}>{t('landing.intro.title')}</h2>
        {/* Project description paragraphs */}
        <div className={styles.introText}>
          <p>{t('landing.intro.paragraph1')}</p>
          <p>{t('landing.intro.paragraph2')}</p>
        </div>

        <div className={styles.introHighlight}>
          <span className={styles.introHighlightIcon}>💡</span>
          <p>{t('landing.intro.highlightPrefix')}<strong>{t('landing.intro.highlightStrong')}</strong>{t('landing.intro.highlightSuffix')}</p>
        </div>
      </div>
    </section>
  );
}

export default IntroSection;
