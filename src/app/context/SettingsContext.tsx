/**
 * =================================================================
 * src/app/context/SettingsContext.tsx
 * -----------------------------------------------------------------
 * This file creates and manages the global state for all user-
 * configurable settings. It uses React Context to provide settings
 * data throughout the application and persists them to Supabase.
 * =================================================================
 */

'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { supabase } from '@/app/lib/supabaseClient';
import { useAuth } from './AuthContext';

// =================================================================
// SECTION: Constants
// =================================================================

/**
 * Defines the complete structure for all user-configurable settings.
 * This object is persisted in Supabase to remember user preferences.
 * All fields use snake_case to match the database schema.
 */
export interface FullAppSettings {
  is_pro: boolean;
  start_in_mini_mode: boolean;
  confirm_on_stop: boolean;
  pip_mode_enabled: boolean;
  language: 'es' | 'en';
  enable_desktop_notifications: boolean;
  theme_mode: 'light' | 'dark';
  selected_theme_id: string;
  background_sound: string;
  volume: number;
}

/**
 * The default state for application settings.
 * Used on the very first launch or after a settings reset.
 */
const DEFAULT_SETTINGS: FullAppSettings = {
  is_pro: false,
  start_in_mini_mode: false,
  confirm_on_stop: true,
  pip_mode_enabled: false,
  language: 'es',
  enable_desktop_notifications: true,
  theme_mode: 'dark',
  selected_theme_id: 'dark-default',
  background_sound: 'none',
  volume: 0.5,
};

// =================================================================
// SECTION: Context Definition
// =================================================================

/**
 * Defines the shape of the data that the SettingsContext will provide.
 */
interface SettingsContextType {
  settings: FullAppSettings;
  updateSettings: (newSettings: Partial<FullAppSettings>) => Promise<void>;
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
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<FullAppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Effect to load settings from Supabase for the authenticated user.
   * Waits for AuthContext to finish loading before fetching settings.
   */
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
      if (error || !data) {
        setSettings(DEFAULT_SETTINGS);
        console.log('[SettingsContext] No settings found or error:', error);
      } else {
        setSettings({ ...DEFAULT_SETTINGS, ...data });
        console.log('[SettingsContext] Loaded settings from Supabase:', data);
      }
      setLoading(false);
    };
    fetchSettings();
  }, [user, authLoading]);

  /**
   * Updates one or more settings and persists them to Supabase.
   * Uses upsert to ensure the row exists. Only snake_case fields are sent.
   */
  const updateSettings = useCallback(async (newSettings: Partial<FullAppSettings>) => {
    if (!user) return;
    setError(null);
    // Solo incluir propiedades snake_case válidas en el objeto enviado a Supabase
    const updated: FullAppSettings = { ...settings, ...newSettings };
    setSettings(updated);
    console.log('[SettingsContext] updateSettings called:', newSettings, 'Full object:', updated);
    // Enviar solo snake_case (todas las props de FullAppSettings ya son snake_case)
    const snakeCaseSettings = { ...updated };
    const { error } = await supabase
      .from('user_settings')
      .upsert([{ id: user.id, ...snakeCaseSettings }], { onConflict: 'id' });
    if (error) {
      setError('Error updating settings: ' + error.message);
      console.error('[SettingsContext] Error updating settings:', error);
    } else {
      console.log('[SettingsContext] Settings updated successfully in Supabase');
    }
  }, [user, settings]);

  /**
   * Resets all settings back to their default values in Supabase.
   * Uses upsert to ensure the row exists.
   */
  const resetSettings = useCallback(async () => {
    if (!user) return;
    setError(null);
    setSettings(DEFAULT_SETTINGS);
    console.log('[SettingsContext] resetSettings called');
    // Enviar solo snake_case (todas las props de DEFAULT_SETTINGS ya son snake_case)
    const snakeCaseDefaults = { ...DEFAULT_SETTINGS };
    const { error } = await supabase
      .from('user_settings')
      .upsert([{ id: user.id, ...snakeCaseDefaults }], { onConflict: 'id' });
    if (error) {
      setError('Error resetting settings: ' + error.message);
      console.error('[SettingsContext] Error resetting settings:', error);
    } else {
      console.log('[SettingsContext] Settings reset successfully in Supabase');
    }
  }, [user]);

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
