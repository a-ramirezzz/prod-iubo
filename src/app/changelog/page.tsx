// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz) — CC BY-NC-ND 4.0

import type { Metadata } from 'next';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { getEntries } from './lib/getEntries';
import styles from './Changelog.module.css';

export const metadata: Metadata = {
  title: 'Changelog | PROD-UIBO',
  description: 'Historial de mejoras y actualizaciones de PROD-UIBO',
};

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

function formatDate(date: string): string {
  return dateFormatter.format(new Date(`${date}T00:00:00`));
}

export default function ChangelogPage() {
  const entries = getEntries();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Link href="/" className={styles.backLink}>
          ← Inicio
        </Link>
        <header className={styles.header}>
          <h1 className={styles.title}>Registro de cambios</h1>
          <p className={styles.subtitle}>Historial de mejoras y actualizaciones de PROD-UIBO</p>
        </header>

        <ol className={styles.timeline}>
          {entries.map((entry) => (
            <li key={entry.slug} className={styles.entry}>
              <div className={styles.entryHeader}>
                <time className={styles.date} dateTime={entry.date}>
                  {formatDate(entry.date)}
                </time>
                {entry.version && <span className={styles.version}>v{entry.version}</span>}
              </div>
              <h2 className={styles.entryTitle}>{entry.title}</h2>
              {entry.tags.length > 0 && (
                <div className={styles.tags}>
                  {entry.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className={styles.prose}>
                <MDXRemote source={entry.content} />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
