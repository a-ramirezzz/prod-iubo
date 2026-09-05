-- Migration 008: Add customizable keyboard shortcuts
-- Stores only the user's overrides that differ from the app's built-in
-- defaults; an empty object means every shortcut uses its default key.

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS keyboard_shortcuts jsonb NOT NULL DEFAULT '{}'::jsonb;
