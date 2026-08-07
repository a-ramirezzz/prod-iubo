// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

export type AchievementCategory = 'sessions' | 'streak' | 'tasks';

export interface AchievementDefinition {
  id: string;
  category: AchievementCategory;
  emoji: string;
  threshold: number;
  nameKey: string;       // i18n key for the achievement name
  descriptionKey: string; // i18n key for the description
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  // Sessions
  { id: 'first_session',  category: 'sessions', emoji: '🔥', threshold: 1,   nameKey: 'achievements.items.firstSession.name',  descriptionKey: 'achievements.items.firstSession.desc' },
  { id: 'sessions_10',    category: 'sessions', emoji: '⚡', threshold: 10,  nameKey: 'achievements.items.sessions10.name',    descriptionKey: 'achievements.items.sessions10.desc' },
  { id: 'sessions_50',    category: 'sessions', emoji: '💪', threshold: 50,  nameKey: 'achievements.items.sessions50.name',    descriptionKey: 'achievements.items.sessions50.desc' },
  { id: 'sessions_100',   category: 'sessions', emoji: '🏆', threshold: 100, nameKey: 'achievements.items.sessions100.name',   descriptionKey: 'achievements.items.sessions100.desc' },

  // Streak
  { id: 'streak_3',       category: 'streak',   emoji: '📅', threshold: 3,   nameKey: 'achievements.items.streak3.name',       descriptionKey: 'achievements.items.streak3.desc' },
  { id: 'streak_7',       category: 'streak',   emoji: '🗓️', threshold: 7,   nameKey: 'achievements.items.streak7.name',       descriptionKey: 'achievements.items.streak7.desc' },
  { id: 'streak_14',      category: 'streak',   emoji: '🔁', threshold: 14,  nameKey: 'achievements.items.streak14.name',      descriptionKey: 'achievements.items.streak14.desc' },
  { id: 'streak_30',      category: 'streak',   emoji: '👑', threshold: 30,  nameKey: 'achievements.items.streak30.name',      descriptionKey: 'achievements.items.streak30.desc' },

  // Tasks
  { id: 'first_task',     category: 'tasks',    emoji: '✅', threshold: 1,   nameKey: 'achievements.items.firstTask.name',     descriptionKey: 'achievements.items.firstTask.desc' },
  { id: 'tasks_10',       category: 'tasks',    emoji: '📋', threshold: 10,  nameKey: 'achievements.items.tasks10.name',       descriptionKey: 'achievements.items.tasks10.desc' },
  { id: 'tasks_50',       category: 'tasks',    emoji: '📦', threshold: 50,  nameKey: 'achievements.items.tasks50.name',       descriptionKey: 'achievements.items.tasks50.desc' },
  { id: 'tasks_100',      category: 'tasks',    emoji: '🎯', threshold: 100, nameKey: 'achievements.items.tasks100.name',      descriptionKey: 'achievements.items.tasks100.desc' },
];
