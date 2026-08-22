// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

'use client';

import { memo } from 'react';
import styles from './AchievementsTab.module.css';
import { useLocale } from '@/app/lib/i18n';
import type { AchievementCategory, AchievementDefinition } from '@/app/lib/achievements';

interface Progress {
  totalSessions: number;
  currentStreak: number;
  totalTasksCompleted: number;
}

interface AchievementsTabProps {
  unlockedIds: Set<string>;
  allAchievements: AchievementDefinition[];
  progress: Progress;
  loading: boolean;
}

const CATEGORY_ORDER: AchievementCategory[] = ['sessions', 'streak', 'tasks'];

const CATEGORY_LABEL_KEY: Record<AchievementCategory, string> = {
  sessions: 'achievements.categorySessions',
  streak: 'achievements.categoryStreak',
  tasks: 'achievements.categoryTasks',
};

function progressFor(category: AchievementCategory, progress: Progress): number {
  switch (category) {
    case 'sessions':
      return progress.totalSessions;
    case 'streak':
      return progress.currentStreak;
    case 'tasks':
      return progress.totalTasksCompleted;
  }
}

/**
 * Read-only presentation component: renders the full achievements catalog,
 * grouped by category, with unlocked/locked visual states and per-card
 * progress toward the next threshold. All evaluation happens in
 * `useAchievements` (page.tsx) — this component never mutates data.
 */
function AchievementsTab({
  unlockedIds,
  allAchievements,
  progress,
  loading,
}: AchievementsTabProps) {
  const { t } = useLocale();

  if (loading) {
    return (
      <section className={styles.container} aria-busy="true">
        <p className={styles.loadingText}>…</p>
      </section>
    );
  }

  const total = allAchievements.length;
  const unlockedCount = unlockedIds.size;

  return (
    <section className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('achievements.title')}</h2>
        <span className={styles.summary}>
          {t('achievements.totalUnlocked')
            .replace('{count}', String(unlockedCount))
            .replace('{total}', String(total))}
        </span>
      </div>

      <div className={styles.statRow}>
        <div className={styles.statCard}>
          <span className={styles.statEmoji} aria-hidden="true">🔥</span>
          <span className={styles.statValue}>{progress.totalSessions}</span>
          <span className={styles.statLabel}>{t('achievements.categorySessions')}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statEmoji} aria-hidden="true">📅</span>
          <span className={styles.statValue}>{progress.currentStreak}</span>
          <span className={styles.statLabel}>{t('achievements.categoryStreak')}</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statEmoji} aria-hidden="true">✅</span>
          <span className={styles.statValue}>{progress.totalTasksCompleted}</span>
          <span className={styles.statLabel}>{t('achievements.categoryTasks')}</span>
        </div>
      </div>

      {unlockedCount === 0 && (
        <p className={styles.emptyState}>{t('achievements.emptyState')}</p>
      )}

      {CATEGORY_ORDER.map((category) => {
        const items = allAchievements.filter((a) => a.category === category);
        const current = progressFor(category, progress);

        return (
          <div key={category} className={styles.categorySection}>
            <h3 className={styles.categoryTitle}>{t(CATEGORY_LABEL_KEY[category])}</h3>
            <div className={styles.grid}>
              {items.map((achievement, i) => {
                const isUnlocked = unlockedIds.has(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`${styles.card} ${isUnlocked ? styles.cardUnlocked : styles.cardLocked}`}
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <span className={styles.cardEmoji} aria-hidden="true">
                      {achievement.emoji}
                    </span>
                    <div className={styles.cardText}>
                      <span className={styles.cardName}>{t(achievement.nameKey)}</span>
                      <span className={styles.cardDesc}>{t(achievement.descriptionKey)}</span>
                      {!isUnlocked && (
                        <span className={styles.cardProgress}>
                          {t('achievements.progress')
                            .replace('{current}', String(Math.min(current, achievement.threshold)))
                            .replace('{target}', String(achievement.threshold))}
                        </span>
                      )}
                    </div>
                    <span className={isUnlocked ? styles.badgeUnlocked : styles.badgeLocked}>
                      {isUnlocked ? t('achievements.unlocked') : t('achievements.locked')}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// Memoized: page.tsx re-renders every timer tick (countdown state lives there),
// but the achievements catalog, progress and unlocked set change rarely.
export default memo(AchievementsTab);
