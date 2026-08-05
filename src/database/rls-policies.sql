-- PROD-UIBO RLS Policies — Run in Supabase SQL Editor

-- =================================================================
-- Table: user_settings
-- User identifier column: id (matches auth.uid())
-- =================================================================

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can read own data"
ON user_settings
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- INSERT policy
CREATE POLICY "Users can insert own data"
ON user_settings
FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- UPDATE policy
CREATE POLICY "Users can update own data"
ON user_settings
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- DELETE policy
CREATE POLICY "Users can delete own data"
ON user_settings
FOR DELETE
TO authenticated
USING (id = auth.uid());

-- Grant table-level permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON user_settings TO authenticated;

-- =================================================================
-- Table: pomodoro_sessions
-- User identifier column: user_id (matches auth.uid())
-- Sessions are immutable once written — no UPDATE policy.
-- =================================================================

ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- SELECT policy
CREATE POLICY "Users can view own sessions"
ON pomodoro_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- INSERT policy
CREATE POLICY "Users can insert own sessions"
ON pomodoro_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- DELETE policy
CREATE POLICY "Users can delete own sessions"
ON pomodoro_sessions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Grant table-level permissions to authenticated role
GRANT SELECT, INSERT, DELETE ON pomodoro_sessions TO authenticated;
