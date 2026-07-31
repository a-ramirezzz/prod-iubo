'use client';

import { useLocale } from '@/app/lib/i18n';
import styles from './Offline.module.css';

export default function OfflinePage() {
  const { t } = useLocale();

  return (
    <div className={styles.container} role="alert">
      <div className={styles.icon} aria-hidden="true">
        📡
      </div>
      <h1 className={styles.title}>{t('app.offline.title')}</h1>
      <p className={styles.message}>{t('app.offline.message')}</p>
      <button
        type="button"
        className={styles.retryButton}
        onClick={() => window.location.reload()}
      >
        {t('app.offline.retry')}
      </button>
    </div>
  );
}
