# Database Migrations

Versioned SQL migrations for the PROD-UIBO Supabase project.

## How to use

Run each file **in order** in the [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql):

1. `001_create_tables.sql` — Creates the 3 core tables
2. `002_rls_policies.sql` — Enables RLS and creates per-user access policies
3. `003_check_constraints.sql` — Adds data integrity constraints
4. `004_indexes.sql` — Creates performance indexes
5. `005_functions_and_triggers.sql` — Auto-create user settings on signup
6. `006_achievements.sql` — Creates `user_achievements` for the gamification/badges system

## Tables

| Table | Purpose |
|-------|---------|
| `user_settings` | Per-user preferences (theme, language, volume, etc.) |
| `tasks` | User task list with manual ordering |
| `pomodoro_sessions` | Immutable log of completed work sessions |
| `user_achievements` | Which achievements each user has unlocked (definitions live in code) |

## Notes

- All tables use RLS — users can only access their own data
- `pomodoro_sessions` has no UPDATE policy (sessions are immutable)
- `user_achievements` has no UPDATE/DELETE policy (achievements are permanent, no un-unlocking)
- The signup trigger in `005` ensures every new user gets default settings
- Migrations are idempotent where possible (`IF NOT EXISTS`, `OR REPLACE`)
