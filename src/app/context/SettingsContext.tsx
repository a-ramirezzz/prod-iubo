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
  theme_mode: 'dark',
  selected_theme_id: 'dark-default',
  background_sound: 'none',
  volume: 0.5,
  daily_pomodoro_goal: 8,
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
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) {
        setSettings(DEFAULT_SETTINGS);
        console.error('[SettingsContext] Error loading settings:', error);
        setNotification({ visible: true, message: t('settings.errors.loadFailed'), icon: iconError });
      } else if (!data) {
        setSettings(DEFAULT_SETTINGS);
        console.log('[SettingsContext] No settings found, using defaults.');
      } else {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        console.log('[SettingsContext] Loaded settings from Supabase:', data);
      }
      setLoading(false);
    };
    fetchSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, authLoading]);

  /**
   * Updates one or more settings and persists them to Supabase.
   * Uses upsert to ensure the row exists. Only snake_case fields are sent.
   */
  const updateSettings = useCallback(async (newSettings: Partial<AppSettings>) => {
    if (!user) return;
    setError(null);

    const updated: AppSettings = { ...settings, ...newSettings };
    setSettings(updated);
    console.log('[SettingsContext] updateSettings called:', newSettings, 'Full object:', updated);

    const updatedSettings = { ...updated };
    const { error } = await supabase
      .from('user_settings')
      .upsert([{ id: user.id, ...updatedSettings }], { onConflict: 'id' });
    if (error) {
      setError('Error updating settings: ' + error.message);
      console.error('[SettingsContext] Error updating settings:', error);
      setNotification({ visible: true, message: t('settings.errors.saveFailed'), icon: iconError });
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

    const { error } = await supabase
      .from('user_settings')
      .upsert([{ id: user.id, ...resetValues }], { onConflict: 'id' });
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
