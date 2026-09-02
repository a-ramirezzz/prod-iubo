// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * Central place for table row/insert/update aliases derived from the
 * generated `database.types.ts`. Prefer importing from here over redefining
 * table shapes by hand — regenerating `database.types.ts` keeps these in
 * sync automatically.
 */

import type { Database } from './database.types';

export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

export type SessionRow =
  Database['public']['Tables']['pomodoro_sessions']['Row'];
export type SessionInsert =
  Database['public']['Tables']['pomodoro_sessions']['Insert'];
export type SessionUpdate =
  Database['public']['Tables']['pomodoro_sessions']['Update'];

export type SettingsRow = Database['public']['Tables']['user_settings']['Row'];
export type SettingsInsert =
  Database['public']['Tables']['user_settings']['Insert'];
export type SettingsUpdate =
  Database['public']['Tables']['user_settings']['Update'];

export type AchievementRow =
  Database['public']['Tables']['user_achievements']['Row'];
export type AchievementInsert =
  Database['public']['Tables']['user_achievements']['Insert'];
export type AchievementUpdate =
  Database['public']['Tables']['user_achievements']['Update'];
