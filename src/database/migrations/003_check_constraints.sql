-- Migration 003: Check constraints for data integrity

-- pomodoro_sessions
ALTER TABLE pomodoro_sessions
  ADD CONSTRAINT chk_sessions_duration CHECK (duration_minutes > 0);
ALTER TABLE pomodoro_sessions
  ADD CONSTRAINT chk_sessions_type CHECK (session_type IN ('work', 'short_break', 'long_break'));
ALTER TABLE pomodoro_sessions
  ADD CONSTRAINT chk_sessions_completed_at_after_started CHECK (completed_at >= started_at);

-- tasks
ALTER TABLE tasks
  ADD CONSTRAINT chk_tasks_text_not_empty CHECK (LENGTH(TRIM(text)) > 0);
ALTER TABLE tasks
  ADD CONSTRAINT chk_tasks_position_non_negative CHECK (position >= 0);

-- user_settings
ALTER TABLE user_settings
  ADD CONSTRAINT chk_settings_volume CHECK (volume >= 0 AND volume <= 1);
ALTER TABLE user_settings
  ADD CONSTRAINT chk_settings_language CHECK (language IN ('es', 'en'));
ALTER TABLE user_settings
  ADD CONSTRAINT chk_settings_theme CHECK (theme_mode IN ('light', 'dark'));
ALTER TABLE user_settings
  ADD CONSTRAINT chk_settings_daily_goal CHECK (daily_pomodoro_goal >= 0);
