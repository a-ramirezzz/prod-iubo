"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

import Link from 'next/link';
import { useLocale } from '@/app/lib/i18n';
import styles from './LegalPage.module.css';

interface LegalPageProps {
  pageKey: 'privacy' | 'terms' | 'cookies';
}

export default function LegalPage({ pageKey }: LegalPageProps) {
  const { t } = useLocale();

  const title = t(`legal.${pageKey}.title`);
  const intro = t(`legal.${pageKey}.intro`);

  const sections: { heading: string; content: string }[] = [];
  for (let i = 0; i < 10; i++) {
    const headingKey = `legal.${pageKey}.sections.${i}.heading`;
    const heading = t(headingKey);
    if (heading === headingKey) break;
    const content = t(`legal.${pageKey}.sections.${i}.content`);
    sections.push({ heading, content });
  }

  return (
    <main className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          {t('legal.backToHome')}
        </Link>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.lastUpdated}>{t('legal.lastUpdated')}</p>
        <p className={styles.intro}>{intro}</p>
        {sections.map((section, index) => (
          <section key={index} className={styles.section}>
            <h2 className={styles.sectionHeading}>{section.heading}</h2>
            <p className={styles.sectionContent}>{section.content}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
