// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/

/**
 * Centralized business-logic constants.
 * UI-only constants (layout, animation, z-index) stay in their component files.
 */

export const POMODORO = {
  /** Minimum session duration to count as valid (seconds) */
  MIN_VALID_SECONDS: 1200,
  /** Default work session (minutes) */
  DEFAULT_WORK_MINUTES: 25,
  /** Default short break (minutes) */
  DEFAULT_SHORT_BREAK_MINUTES: 5,
  /** Default long break (minutes) */
  DEFAULT_LONG_BREAK_MINUTES: 15,
  /** Work sessions before a long break */
  SESSIONS_PER_CYCLE: 4,
  /** Default daily pomodoro goal */
  DEFAULT_DAILY_GOAL: 8,
} as const;

export const SYNC = {
  /** Max retry attempts for failed offline mutations */
  MAX_RETRIES: 3,
  /** Wait time (ms) after reconnect before processing queue */
  RECONNECT_STABILIZE_MS: 1500,
  /** How long (ms) to show "reconnected" banner */
  RECONNECTED_VISIBLE_MS: 3000,
} as const;

export const RATE_LIMIT = {
  /** Time window for rate limiting (ms) */
  WINDOW_MS: 60_000,
  /** Max requests per window */
  MAX_REQUESTS: 5,
} as const;
