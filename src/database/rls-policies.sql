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
