-- Migration 007: Additional input-length constraints
-- Server-side validation: CHECK constraints on user inputs
-- Prevents malformed data from being inserted via DevTools or direct API calls
--
-- Note: chk_settings_volume and chk_settings_daily_goal (>= 0) already exist
-- from migration 003_check_constraints.sql. This migration adds the
-- constraints that were missing (length caps) and tightens the daily goal
-- upper bound without renaming/duplicating the existing constraint names.

-- tasks: text max 200 characters
ALTER TABLE tasks
  ADD CONSTRAINT chk_tasks_text_length CHECK (char_length(text) <= 200);

-- user_settings: daily pomodoro goal upper bound (lower bound of 0 already
-- enforced by chk_settings_daily_goal in migration 003; this adds the cap)
ALTER TABLE user_settings
  ADD CONSTRAINT chk_settings_daily_goal_max CHECK (daily_pomodoro_goal BETWEEN 1 AND 50);

-- user_settings: theme_mode max 20 characters
ALTER TABLE user_settings
  ADD CONSTRAINT chk_settings_theme_mode_length CHECK (char_length(theme_mode) <= 20);

-- user_settings: selected_theme_id max 50 characters
ALTER TABLE user_settings
  ADD CONSTRAINT chk_settings_theme_id_length CHECK (char_length(selected_theme_id) <= 50);

-- user_settings: background_sound max 50 characters
ALTER TABLE user_settings
  ADD CONSTRAINT chk_settings_bg_sound_length CHECK (char_length(background_sound) <= 50);
