// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

'use client';

import { useEffect } from 'react';
import styles from './AchievementNotification.module.css';
import { useLocale } from '@/app/lib/i18n';
import type { AchievementDefinition } from '@/app/lib/achievements';

interface AchievementNotificationProps {
  achievement: AchievementDefinition | null;
  onDismiss: () => void;
}

const AUTO_DISMISS_MS = 5000;

/**
 * Toast shown at the top of the screen when a new achievement unlocks.
 * Auto-dismisses after 5s, or on click.
 */
export function AchievementNotification({ achievement, onDismiss }: AchievementNotificationProps) {
  const { t } = useLocale();

  useEffect(() => {
    if (!achievement) return;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [achievement, onDismiss]);

  if (!achievement) return null;

  return (
    <div
      className={styles.toast}
      role="status"
      aria-live="polite"
      onClick={onDismiss}
    >
      <span className={styles.emoji} aria-hidden="true">{achievement.emoji}</span>
      <div className={styles.text}>
        <span className={styles.label}>{t('achievements.notification')}</span>
        <span className={styles.name}>{t(achievement.nameKey)}</span>
      </div>
    </div>
  );
}

export default AchievementNotification;
