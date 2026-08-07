-- Migration 001: Create base tables
-- Run in Supabase SQL Editor in order

-- =================================================================
-- Table: user_settings
-- One row per user, keyed by auth.uid()
-- =================================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id                          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pro                      boolean NOT NULL DEFAULT false,
  start_in_mini_mode          boolean NOT NULL DEFAULT false,
  confirm_on_stop             boolean NOT NULL DEFAULT true,
  pip_mode_enabled            boolean NOT NULL DEFAULT false,
  horizontal_pip_enabled      boolean NOT NULL DEFAULT false,
  language                    text NOT NULL DEFAULT 'es',
  enable_desktop_notifications boolean NOT NULL DEFAULT true,
  notification_sound_enabled  boolean NOT NULL DEFAULT true,
  theme_mode                  text NOT NULL DEFAULT 'dark',
  selected_theme_id           text NOT NULL DEFAULT 'dark-default',
  background_sound            text NOT NULL DEFAULT 'none',
  volume                      numeric NOT NULL DEFAULT 0.5,
  daily_pomodoro_goal         integer NOT NULL DEFAULT 8,
  has_seen_onboarding         boolean NOT NULL DEFAULT false
);

-- =================================================================
-- Table: tasks
-- User tasks with manual ordering via position column
-- =================================================================
CREATE TABLE IF NOT EXISTS tasks (
  id          uuid PRIMARY KEY,
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  text        text NOT NULL,
  completed   boolean NOT NULL DEFAULT false,
  position    integer NOT NULL DEFAULT 0,
  updated_at  timestamptz
);

-- =================================================================
-- Table: pomodoro_sessions
-- Immutable log of completed Pomodoro work sessions
-- =================================================================
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at        timestamptz NOT NULL,
  completed_at      timestamptz NOT NULL,
  duration_minutes  integer NOT NULL,
  session_type      text NOT NULL DEFAULT 'work',
  task_text         text,
  completed         boolean NOT NULL DEFAULT true
);
