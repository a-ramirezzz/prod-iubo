// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * Canonical shape of a `pomodoro_sessions` row. Other modules that only
 * need a subset of these fields should use `Pick<SessionRow, ...>`
 * rather than redeclaring their own copy.
 */
export interface SessionRow {
  id: string;
  started_at: string;
  completed_at: string;
  duration_minutes: number;
  session_type: 'work' | 'short_break' | 'long_break';
  task_text: string | null;
  completed: boolean;
}
