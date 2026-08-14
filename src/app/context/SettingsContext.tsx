/**
 * =================================================================
 * src/app/context/SettingsContext.tsx
 * -----------------------------------------------------------------
 * This file creates and manages the global state for all user-
 * configurable settings. It uses React Context to provide settings
 * data throughout the application and persists them to Supabase.
 * =================================================================
 */

// ALAN RODRIGO RAMIREZ LUNA

'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { createClient } from '@/app/lib/supabase/client';
import { useAuth } from './AuthContext';
import { useLocale } from '@/app/lib/i18n';
import Notification from '@/app/components/Notification/Notification';
import { AppSettings } from '../types';
import { logError } from '@/app/lib/logger';
import { fetchWithOfflineFallback } from '@/app/lib/offlineSync';
import { cacheSettings, getCachedSettings } from '@/app/lib/offlineDb';
import { executeOrQueue } from '@/app/lib/offlineMutation';
import { POMODORO } from '@/app/lib/constants';

// =================================================================
// SECTION: Constants
// =================================================================

/**
 * The default state for application settings.
 * Used on the very first launch or after a settings reset.
 */
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
};

// =================================================================
// SECTION: Context Definition
// =================================================================

/**
 * Defines the shape of the data that the SettingsContext will provide.
 */
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

/**
 * The React Context object for the application settings.
 * Initialized with `undefined` and type-checked in the consumer hook.
 */
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// =================================================================
// SECTION: Provider Component
// =================================================================

/**
 * The provider component that wraps the application and makes the
 * settings state available to all child components.
 * Loads and persists settings to Supabase for the authenticated user.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The context provider component.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLocale();
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ visible: boolean; message: string; icon: React.ReactNode }>({ visible: false, message: '', icon: null });

  /**
   * Effect to load settings from Supabase for the authenticated user.
   * Waits for AuthContext to finish loading before fetching settings.
   */
  const iconError = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="24" cy="24" r="24" fill="#EF4444"/>
      <path d="M17 17L31 31M31 17L17 31" stroke="#fff" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  );

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setSettings(DEFAULT_SETTINGS);
      setLoading(false);
      return;
    }
    setLoading(true);
    const fetchSettings = async () => {
      const result = await fetchWithOfflineFallback<AppSettings>({
        fetchFn: async () => {
          const { data, error } = await supabase
            .from('user_settings')
            .select('*')
            .eq('id', user.id)
            .single();
          if (error) throw error;
          return data as AppSettings;
        },
        cacheFn: (data) => cacheSettings(user.id, data),
        getCacheFn: () => getCachedSettings(user.id),
        operationName: 'fetchSettings',
      });

      if (result.data) {
        setSettings({ ...DEFAULT_SETTINGS, ...result.data });
        console.log(`[SettingsContext] Loaded settings from ${result.source}:`, result.data);
      } else {
        setSettings(DEFAULT_SETTINGS);
        if (result.error) {
          console.error('[SettingsContext] Error loading settings:', result.error);
          setNotification({ visible: true, message: t('settings.errors.loadFailed'), icon: iconError });
        } else {
          console.log('[SettingsContext] No settings found, using defaults.');
        }
      }
      setLoading(false);
    };
    fetchSettings();
    // Keyed on the user's id (not the `user` object itself) — Supabase emits a
    // new `user` object reference on every auth event (token refresh,
    // reconnect, duplicate INITIAL_SESSION/SIGNED_IN at startup) even when the
    // logged-in user hasn't changed. Depending on the object caused this
    // effect to refire repeatedly, flipping `loading` back to true and
    // silently swallowing in-flight theme clicks gated on `!settingsLoading`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, authLoading]);

  /**
   * Updates one or more settings and persists them to Supabase.
   * Applies an optimistic full-object update locally, but persists ONLY the
   * changed fields via `.update()` so concurrent tabs don't clobber each
   * other and unknown columns can't fail the entire save. Reverts the
   * optimistic update if the persist fails.
   */
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    if (!user) return;
    setError(null);

    // 1. Optimistic local update — merge the full object for the UI.
    const previous = settings;
    const updated: AppSettings = { ...settings, ...newSettings };
    setSettings(updated);
    console.log('[SettingsContext] updateSettings called:', newSettings, 'Full object:', updated);

    // 2. Persist ONLY the changed fields to Supabase.
    const { queued, error } = await executeOrQueue(
      () => supabase.from('user_settings').update(newSettings).eq('id', user.id),
      {
        table: 'user_settings',
        operation: 'update',
        data: newSettings as Record<string, unknown>,
        filters: { id: user.id },
        userId: user.id,
      }
    );
    if (queued) {
      await cacheSettings(user.id, updated);
      return;
    }
    if (error) {
      setError('Error updating settings: ' + error.message);
      logError(error, { operation: 'updateSettings', userId: user.id, metadata: { fields: Object.keys(newSettings) } });
      setNotification({ visible: true, message: t('settings.errors.saveFailed'), icon: iconError });
      // Revert the optimistic update on failure.
      setSettings(previous);
    } else {
      console.log('[SettingsContext] Settings updated successfully in Supabase');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, settings]);

  /**
   * Resets all settings back to their default values in Supabase.
   * Uses upsert to ensure the row exists.
   */
  const resetSettings = useCallback(async () => {
    if (!user) return;
    setError(null);
    // Preserve whether the user already completed the onboarding tour — a
    // settings reset should not make the tour reappear.
    const preservedOnboarding = settings.has_seen_onboarding;
    const resetValues: AppSettings = { ...DEFAULT_SETTINGS, has_seen_onboarding: preservedOnboarding };
    setSettings(resetValues);
    console.log('[SettingsContext] resetSettings called');

    const upsertPayload = { id: user.id, ...resetValues };
    const { queued, error } = await executeOrQueue(
      () => supabase.from('user_settings').upsert([upsertPayload], { onConflict: 'id' }),
      {
        table: 'user_settings',
        operation: 'upsert',
        data: upsertPayload as Record<string, unknown>,
        userId: user.id,
      }
    );
    if (queued) {
      await cacheSettings(user.id, resetValues);
      return;
    }
    if (error) {
      setError('Error resetting settings: ' + error.message);
      console.error('[SettingsContext] Error resetting settings:', error);
      setNotification({ visible: true, message: t('settings.errors.resetFailed'), icon: iconError });
    } else {
      console.log('[SettingsContext] Settings reset successfully in Supabase');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, settings]);

  /**
   * Memoize the context value to prevent unnecessary re-renders in consumers.
   * The value object will only be recreated if settings or the updater functions change.
   */
  const value = useMemo(() => ({
    settings,
    updateSettings,
    resetSettings,
    loading,
    error
  }), [settings, updateSettings, resetSettings, loading, error]);

  return (
    <SettingsContext.Provider value={value}>
      <Notification
        message={notification.message}
        visible={notification.visible}
        icon={notification.icon}
        duration={4000}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
      {children}
    </SettingsContext.Provider>
  );
}

// =================================================================
// SECTION: Custom Hook
// =================================================================

/**
 * A custom hook for consuming the SettingsContext easily and safely.
 * Throws an error if used outside of a SettingsProvider.
 * @returns {SettingsContextType} The settings context value.
 */
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
