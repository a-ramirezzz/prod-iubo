'use client';

import { useLocale } from '@/app/lib/i18n';
import styles from './ErrorBoundary.module.css';

interface ErrorFallbackProps {
  error: Error | null;
  /** Optional — unused at root level, which reloads the page instead. */
  onRetry?: () => void;
  level?: 'root' | 'section';
}

// Hardcoded Spanish fallbacks used when the i18n context is unavailable
// (e.g. the error happened while providers were mounting). Root-level only.
const ROOT_FALLBACK_ES = {
  rootTitle: 'Algo salió mal',
  rootMessage: 'Ocurrió un error inesperado. Por favor, recarga la página.',
  reloadButton: 'Recargar página',
  errorDetailsLabel: 'Detalles del error',
};

export default function ErrorFallback({
  error,
  onRetry,
  level = 'section',
}: ErrorFallbackProps) {
  // The i18n context may not exist if providers themselves crashed. Guard the
  // hook so the root boundary always renders something useful.
  // Intentional guard: the root boundary may render when the i18n provider
  // itself has crashed, so the hook call is wrapped in try/catch.
  let t: (key: string) => string;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    t = useLocale().t;
  } catch {
    t = (key: string) => {
      const short = key.replace('app.errorBoundary.', '');
      return (ROOT_FALLBACK_ES as Record<string, string>)[short] ?? key;
    };
  }

  const isDev = process.env.NODE_ENV === 'development';

  const details =
    isDev && error ? (
      <details className={styles.errorDetails}>
        <summary>{t('app.errorBoundary.errorDetailsLabel')}</summary>
        <pre>{error.message}</pre>
      </details>
    ) : null;

  if (level === 'root') {
    return (
      <div className={styles.rootContainer} role="alert">
        <div className={styles.icon} aria-hidden="true">
          ⚠️
        </div>
        <h1 className={styles.title}>{t('app.errorBoundary.rootTitle')}</h1>
        <p className={styles.message}>{t('app.errorBoundary.rootMessage')}</p>
        <button
          type="button"
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          {t('app.errorBoundary.reloadButton')}
        </button>
        {details}
      </div>
    );
  }

  return (
    <div className={styles.sectionContainer} role="alert">
      <div className={styles.icon} aria-hidden="true">
        ⚠️
      </div>
      <h2 className={styles.title}>{t('app.errorBoundary.sectionTitle')}</h2>
      <p className={styles.message}>{t('app.errorBoundary.sectionMessage')}</p>
      <button type="button" className={styles.retryButton} onClick={onRetry}>
        {t('app.errorBoundary.retryButton')}
      </button>
      {details}
    </div>
  );
}
