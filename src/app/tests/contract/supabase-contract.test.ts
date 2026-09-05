// Contract tests — run real queries against the actual Supabase project to
// catch schema drift that mocked unit tests cannot detect.
//
// Requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
// E2E_USER_EMAIL and E2E_USER_PASSWORD (see .env.local). Skips gracefully
// when any of these are missing. Run with `npm run test:contract` — these
// are NOT part of the regular `npm run test` / CI suite because they need
// network access and real credentials.
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

import type { Database } from '@/types/database.types';
import type { SettingsRow } from '@/types/tables';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TEST_EMAIL = process.env.E2E_USER_EMAIL;
const TEST_PASSWORD = process.env.E2E_USER_PASSWORD;

const canRunContractTests = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && TEST_EMAIL && TEST_PASSWORD
);

describe.skipIf(!canRunContractTests)('Supabase Contract Tests', () => {
  let supabase: SupabaseClient<Database>;
  let userId: string;

  beforeAll(async () => {
    supabase = createClient<Database>(SUPABASE_URL!, SUPABASE_ANON_KEY!);
    const { data, error } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL!,
      password: TEST_PASSWORD!,
    });
    if (error) throw new Error(`Auth failed: ${error.message}`);
    userId = data.user!.id;
  });

  afterAll(async () => {
    await supabase.auth.signOut();
  });

  // --- pomodoro_sessions ---
  // Immutable log: INSERT/SELECT/DELETE policies exist, no UPDATE policy.

  describe('pomodoro_sessions', () => {
    let testSessionId: string | null = null;

    afterAll(async () => {
      if (testSessionId) {
        await supabase.from('pomodoro_sessions').delete().eq('id', testSessionId);
      }
    });

    it('can insert a valid session', async () => {
      const now = new Date().toISOString();
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .insert({
          user_id: userId,
          started_at: thirtyMinutesAgo,
          completed_at: now,
          duration_minutes: 30,
          session_type: 'work',
          completed: true,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.duration_minutes).toBe(30);
      expect(data!.session_type).toBe('work');
      testSessionId = data!.id;
    });

    it('rejects session with invalid duration (0)', async () => {
      const now = new Date().toISOString();

      const { error } = await supabase.from('pomodoro_sessions').insert({
        user_id: userId,
        started_at: now,
        completed_at: now,
        duration_minutes: 0,
        session_type: 'work',
        completed: true,
      });

      expect(error).not.toBeNull();
    });

    it('rejects session with invalid session_type', async () => {
      const now = new Date().toISOString();

      const { error } = await supabase.from('pomodoro_sessions').insert({
        user_id: userId,
        started_at: now,
        completed_at: now,
        duration_minutes: 25,
        session_type: 'invalid_type',
        completed: true,
      });

      expect(error).not.toBeNull();
    });

    it('rejects session where completed_at is before started_at', async () => {
      const now = new Date();
      const before = new Date(now.getTime() - 60_000).toISOString();

      const { error } = await supabase.from('pomodoro_sessions').insert({
        user_id: userId,
        started_at: now.toISOString(),
        completed_at: before,
        duration_minutes: 25,
        session_type: 'work',
        completed: true,
      });

      expect(error).not.toBeNull();
    });

    it('can select sessions with expected columns', async () => {
      const { data, error } = await supabase
        .from('pomodoro_sessions')
        .select('id, user_id, started_at, completed_at, duration_minutes, session_type, task_text, completed')
        .limit(1);

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });

    it('cannot update sessions (immutable)', async () => {
      if (!testSessionId) return;

      // No UPDATE policy exists on pomodoro_sessions — RLS silently blocks
      // the write (0 rows affected) rather than returning an error, so we
      // verify immutability by checking the value didn't change.
      const { data: before } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes')
        .eq('id', testSessionId)
        .single();

      await supabase
        .from('pomodoro_sessions')
        .update({ duration_minutes: 99 })
        .eq('id', testSessionId);

      const { data: after } = await supabase
        .from('pomodoro_sessions')
        .select('duration_minutes')
        .eq('id', testSessionId)
        .single();

      expect(after!.duration_minutes).toBe(before!.duration_minutes);
      expect(after!.duration_minutes).not.toBe(99);
    });
  });

  // --- tasks ---

  describe('tasks', () => {
    const testTaskId = crypto.randomUUID();

    afterAll(async () => {
      await supabase.from('tasks').delete().eq('id', testTaskId);
    });

    it('can insert a valid task', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          id: testTaskId,
          user_id: userId,
          text: 'Contract test task',
          completed: false,
          position: 0,
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.text).toBe('Contract test task');
    });

    it('rejects task with empty text', async () => {
      const { error } = await supabase.from('tasks').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        text: '',
        completed: false,
        position: 0,
      });

      expect(error).not.toBeNull();
    });

    it('rejects task with text exceeding 200 chars', async () => {
      const { error } = await supabase.from('tasks').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        text: 'x'.repeat(201),
        completed: false,
        position: 0,
      });

      expect(error).not.toBeNull();
    });

    it('can update a task', async () => {
      const { data, error } = await supabase
        .from('tasks')
        .update({ completed: true })
        .eq('id', testTaskId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data!.completed).toBe(true);
    });

    it('can delete a task', async () => {
      const deleteId = crypto.randomUUID();
      await supabase.from('tasks').insert({
        id: deleteId,
        user_id: userId,
        text: 'To delete',
        completed: false,
        position: 99,
      });

      const { error } = await supabase.from('tasks').delete().eq('id', deleteId);

      expect(error).toBeNull();
    });

    it('rejects negative position', async () => {
      const { error } = await supabase.from('tasks').insert({
        id: crypto.randomUUID(),
        user_id: userId,
        text: 'Negative pos',
        completed: false,
        position: -1,
      });

      expect(error).not.toBeNull();
    });
  });

  // --- user_settings ---
  // One row per user, auto-created by a trigger on signup — no INSERT here.

  describe('user_settings', () => {
    let originalSettings: SettingsRow | null = null;

    beforeAll(async () => {
      const { data } = await supabase.from('user_settings').select('*').single();
      originalSettings = data;
    });

    afterAll(async () => {
      if (originalSettings) {
        await supabase
          .from('user_settings')
          .update({
            volume: originalSettings.volume,
            language: originalSettings.language,
            daily_pomodoro_goal: originalSettings.daily_pomodoro_goal,
          })
          .eq('id', userId);
      }
    });

    it('can read own settings', async () => {
      const { data, error } = await supabase.from('user_settings').select('*').single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data).toHaveProperty('language');
      expect(data).toHaveProperty('volume');
      expect(data).toHaveProperty('theme_mode');
      expect(data).toHaveProperty('selected_theme_id');
    });

    it('can update settings with valid values', async () => {
      const { error } = await supabase
        .from('user_settings')
        .update({ daily_pomodoro_goal: 8 })
        .eq('id', userId);

      expect(error).toBeNull();
    });

    it('rejects volume outside 0-1 range', async () => {
      const { error } = await supabase
        .from('user_settings')
        .update({ volume: 5 })
        .eq('id', userId);

      expect(error).not.toBeNull();
    });

    it('rejects invalid language value', async () => {
      const { error } = await supabase
        .from('user_settings')
        .update({ language: 'fr' })
        .eq('id', userId);

      expect(error).not.toBeNull();
    });

    it('rejects daily_pomodoro_goal outside 1-50 range', async () => {
      const { error } = await supabase
        .from('user_settings')
        .update({ daily_pomodoro_goal: 0 })
        .eq('id', userId);

      expect(error).not.toBeNull();
    });
  });

  // --- user_achievements ---
  // Append-only: SELECT/INSERT policies exist, no UPDATE or DELETE policy.

  describe('user_achievements', () => {
    const testAchievementId = `contract_test_${Date.now()}`;

    afterAll(async () => {
      // No DELETE policy exists on user_achievements, so this is expected
      // to be a no-op (RLS silently filters rows rather than erroring on
      // delete). The achievement id is unique per test run, so leftover
      // rows do not affect future runs.
      await supabase.from('user_achievements').delete().eq('achievement_id', testAchievementId);
    });

    it('can insert an achievement', async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .insert({ user_id: userId, achievement_id: testAchievementId })
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data!.achievement_id).toBe(testAchievementId);
    });

    it('rejects duplicate achievement for same user', async () => {
      const { error } = await supabase
        .from('user_achievements')
        .insert({ user_id: userId, achievement_id: testAchievementId });

      expect(error).not.toBeNull();
    });

    it('can read own achievements', async () => {
      const { data, error } = await supabase
        .from('user_achievements')
        .select('id, user_id, achievement_id, unlocked_at');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
    });

    it('cannot update achievements (permanent)', async () => {
      const { error } = await supabase
        .from('user_achievements')
        .update({ achievement_id: 'hacked' })
        .eq('achievement_id', testAchievementId);

      // No UPDATE policy exists on user_achievements — RLS blocks the write.
      expect(error).not.toBeNull();
    });
  });

  // --- RLS isolation ---

  describe('RLS isolation', () => {
    it('select on sessions only returns own data (user_id matches)', async () => {
      const { data } = await supabase.from('pomodoro_sessions').select('user_id').limit(10);

      if (data && data.length > 0) {
        for (const row of data) {
          expect(row.user_id).toBe(userId);
        }
      }
    });

    it('select on tasks only returns own data', async () => {
      const { data } = await supabase.from('tasks').select('user_id').limit(10);

      if (data && data.length > 0) {
        for (const row of data) {
          expect(row.user_id).toBe(userId);
        }
      }
    });

    it('select on achievements only returns own data', async () => {
      const { data } = await supabase.from('user_achievements').select('user_id').limit(10);

      if (data && data.length > 0) {
        for (const row of data) {
          expect(row.user_id).toBe(userId);
        }
      }
    });
  });
});
