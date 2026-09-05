// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, waitFor, act } from '@testing-library/react';

import type { AppSettings } from '@/app/types';
import { POMODORO } from '@/app/lib/constants';
import { DEFAULT_SHORTCUTS } from '@/app/lib/keyboardShortcuts';

// -----------------------------------------------------------------------------
// A local mirror of SettingsContext's internal DEFAULT_SETTINGS. It isn't
// exported by the module, so tests reconstruct it here (kept in sync with the
// POMODORO constant it derives from) to assert "settings equal the defaults".
// -----------------------------------------------------------------------------
const DEFAULT_SETTINGS: AppSettings = {
  is_pro: false,
  start_in_mini_mode: false,
  confirm_on_stop: true,
  pip_mode_enabled: false,
  horizontal_pip_enabled: false,
  language: 'es',
  enable_desktop_notifications: true,
  notification_sound_enabled: true,
  theme_mode: 'dark',
  selected_theme_id: 'dark-default',
  background_sound: 'none',
  volume: 0.5,
  daily_pomodoro_goal: POMODORO.DEFAULT_DAILY_GOAL,
  has_seen_onboarding: false,
  // In-memory settings always hold the fully resolved shortcuts map (see
  // SettingsContext's DEFAULT_SETTINGS docs); only the persisted row stores overrides.
  keyboard_shortcuts: { ...DEFAULT_SHORTCUTS },
};

// =============================================================================
// Auth mock — SettingsContext reads { user, loading } from useAuth().
// =============================================================================

const useAuthMock = vi.fn();
vi.mock('@/app/context/AuthContext', () => ({
  useAuth: () => useAuthMock(),
}));

// =============================================================================
// Supabase mock — a chainable, thenable query builder for the
// `user_settings` table (select().eq().single() for reads, update()/upsert()
// for writes).
// =============================================================================

let selectResult: { data: Partial<AppSettings> | null; error: unknown } = { data: null, error: null };
let updateResult: { error: unknown } = { error: null };
let upsertResult: { error: unknown } = { error: null };

const updateMock = vi.fn();
const upsertMock = vi.fn();

const makeBuilder = () => {
  let mode: 'update' | 'upsert' | null = null;
  const builder: Record<string, unknown> = {};
  const chain = () => builder;

  builder.select = vi.fn(chain);
  builder.eq = vi.fn(chain);
  builder.single = vi.fn(() => Promise.resolve(selectResult));
  builder.update = vi.fn((payload: Record<string, unknown>) => {
    mode = 'update';
    updateMock(payload);
    return builder;
  });
  builder.upsert = vi.fn((payload: unknown, options: unknown) => {
    mode = 'upsert';
    upsertMock(payload, options);
    return builder;
  });
  builder.then = (resolve: (v: { error: unknown }) => unknown) => {
    if (mode === 'update') return resolve(updateResult);
    if (mode === 'upsert') return resolve(upsertResult);
    return resolve({ error: null });
  };

  return builder;
};

const fromMock = vi.fn(() => makeBuilder());
const mockSupabase = { from: fromMock };

vi.mock('@/app/lib/supabase/client', () => ({
  createClient: vi.fn(() => mockSupabase),
}));

// =============================================================================
// Offline cache mock — the IndexedDB mirror used by fetchWithOfflineFallback
// (read path) and executeOrQueue (write path). Kept as pure no-ops so
// SettingsContext exercises the real Supabase-first flow above.
// =============================================================================

const cacheSettingsMock = vi.fn().mockResolvedValue(undefined);
const getCachedSettingsMock = vi.fn().mockResolvedValue(null);
const addToSyncQueueMock = vi.fn().mockResolvedValue(undefined);

vi.mock('@/app/lib/offlineDb', () => ({
  cacheSettings: (...args: unknown[]) => cacheSettingsMock(...args),
  getCachedSettings: (...args: unknown[]) => getCachedSettingsMock(...args),
  addToSyncQueue: (...args: unknown[]) => addToSyncQueueMock(...args),
}));

import { SettingsProvider, useSettings } from '@/app/context/SettingsContext';

// -----------------------------------------------------------------------------
// Test helpers
// -----------------------------------------------------------------------------

type SettingsCtx = ReturnType<typeof useSettings>;

let latestCtx: SettingsCtx | null = null;

function TestConsumer() {
  const ctx = useSettings();
  React.useEffect(() => {
    latestCtx = ctx;
  });
  return null;
}

const renderWithSettings = () =>
  render(
    <SettingsProvider>
      <TestConsumer />
    </SettingsProvider>
  );

const AUTH_USER = { id: 'user-1' };

const authenticated = (overrides: Partial<AppSettings> = {}) => {
  useAuthMock.mockReturnValue({ user: AUTH_USER, loading: false });
  selectResult = { data: { ...DEFAULT_SETTINGS, ...overrides }, error: null };
};

const unauthenticated = () => {
  useAuthMock.mockReturnValue({ user: null, loading: false });
};

describe('SettingsContext', () => {
  beforeEach(() => {
    latestCtx = null;
    selectResult = { data: null, error: null };
    updateResult = { error: null };
    upsertResult = { error: null };

    fromMock.mockClear();
    updateMock.mockClear();
    upsertMock.mockClear();
    cacheSettingsMock.mockClear().mockResolvedValue(undefined);
    getCachedSettingsMock.mockClear().mockResolvedValue(null);
    addToSyncQueueMock.mockClear().mockResolvedValue(undefined);
    useAuthMock.mockReset();

    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads default settings for new user (no existing settings in Supabase)', async () => {
    useAuthMock.mockReturnValue({ user: AUTH_USER, loading: false });
    selectResult = { data: null, error: null };

    renderWithSettings();

    await waitFor(() => {
      expect(latestCtx?.loading).toBe(false);
    });
    expect(latestCtx?.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('loads existing settings from Supabase for returning user', async () => {
    authenticated({ language: 'en', volume: 0.8, daily_pomodoro_goal: 6, theme_mode: 'light' });

    renderWithSettings();

    await waitFor(() => {
      expect(latestCtx?.loading).toBe(false);
    });
    expect(latestCtx?.settings).toEqual({
      ...DEFAULT_SETTINGS,
      language: 'en',
      volume: 0.8,
      daily_pomodoro_goal: 6,
      theme_mode: 'light',
    });
    // Sanity check: this is NOT just the defaults.
    expect(latestCtx?.settings).not.toEqual(DEFAULT_SETTINGS);
  });

  it('updates partial settings without overwriting other fields', async () => {
    authenticated({ language: 'en', volume: 0.7, daily_pomodoro_goal: 6 });
    renderWithSettings();

    await waitFor(() => {
      expect(latestCtx?.settings.language).toBe('en');
    });

    await act(async () => {
      await latestCtx?.updateSettings({ volume: 0.9 });
    });

    expect(latestCtx?.settings.volume).toBe(0.9);
    // Untouched fields survive the partial update.
    expect(latestCtx?.settings.language).toBe('en');
    expect(latestCtx?.settings.daily_pomodoro_goal).toBe(6);

    // Only the changed field is sent to Supabase, not the whole object.
    expect(updateMock).toHaveBeenCalledWith({ volume: 0.9 });
  });

  it('persists keyboard_shortcuts as overrides-only, but keeps the resolved map locally', async () => {
    authenticated({});
    renderWithSettings();

    await waitFor(() => {
      expect(latestCtx?.loading).toBe(false);
    });

    await act(async () => {
      await latestCtx?.updateSettings({
        keyboard_shortcuts: { ...DEFAULT_SHORTCUTS, resetTimer: 'x' },
      });
    });

    // Local state holds the fully resolved map (all actions present).
    expect(latestCtx?.settings.keyboard_shortcuts).toEqual({ ...DEFAULT_SHORTCUTS, resetTimer: 'x' });
    // Only the diff from the defaults is sent to Supabase.
    expect(updateMock).toHaveBeenCalledWith({ keyboard_shortcuts: { resetTimer: 'x' } });
  });

  it('resets settings to defaults', async () => {
    authenticated({ language: 'en', volume: 0.9, theme_mode: 'light', selected_theme_id: 'light-default' });
    renderWithSettings();

    await waitFor(() => {
      expect(latestCtx?.settings.language).toBe('en');
    });

    await act(async () => {
      await latestCtx?.resetSettings();
    });

    expect(latestCtx?.settings).toEqual(DEFAULT_SETTINGS);
    // The persisted row stores keyboard_shortcuts as overrides-only (empty = all defaults),
    // not the fully resolved map held in local state.
    expect(upsertMock).toHaveBeenCalledWith(
      [{ id: AUTH_USER.id, ...DEFAULT_SETTINGS, keyboard_shortcuts: {} }],
      { onConflict: 'id' }
    );
  });

  it('handles Supabase error on update gracefully', async () => {
    authenticated({ volume: 0.7 });
    renderWithSettings();

    await waitFor(() => {
      expect(latestCtx?.settings.volume).toBe(0.7);
    });

    // A genuine data-level error (not a connectivity issue), so it surfaces
    // immediately instead of being queued for offline retry.
    updateResult = { error: { message: 'Row not found', code: '23505' } };

    await act(async () => {
      await latestCtx?.updateSettings({ volume: 0.9 });
    });

    // Optimistic update is reverted back to the pre-update value.
    expect(latestCtx?.settings.volume).toBe(0.7);
    expect(latestCtx?.error).toContain('Error updating settings');
  });

  it('sets default settings when user is not authenticated', async () => {
    unauthenticated();

    renderWithSettings();

    await waitFor(() => {
      expect(latestCtx?.loading).toBe(false);
    });
    expect(latestCtx?.settings).toEqual(DEFAULT_SETTINGS);
    expect(fromMock).not.toHaveBeenCalled();
  });
});
