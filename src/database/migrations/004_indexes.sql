-- Migration 004: Performance indexes

-- Session history queries: paginated list filtered by user, ordered by date
CREATE INDEX IF NOT EXISTS idx_sessions_user_completed
  ON pomodoro_sessions (user_id, completed_at DESC);

-- Task list queries: ordered by position per user
CREATE INDEX IF NOT EXISTS idx_tasks_user_position
  ON tasks (user_id, position ASC);
