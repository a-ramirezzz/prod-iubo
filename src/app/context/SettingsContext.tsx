/**
 * =================================================================
 * src/app/context/SettingsContext.tsx
 * -----------------------------------------------------------------
 * This file creates and manages the global state for all user-
 * configurable settings. It uses React Context to provide settings
 * data throughout the application and persists them to localStorage.
 * =================================================================
 */

// =================================================================
// SECTION: Imports
// =================================================================

'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useCallback, useMemo } from 'react';
import type { AppSettings } from '@/app/types';

// =================================================================
// SECTION: Constants
// =================================================================

/**
 * The default state for application settings.
 * Used on the very first launch or after a settings reset.
 * The app is configured to always start in dark mode by default.
 */
const DEFAULT_SETTINGS: AppSettings = {
  startInMiniMode: false,
  confirmOnStop: true,
  alwaysOnTop: false,
  language: 'es',
  themeMode: 'dark',
  selectedThemeId: 'dark-default',
  backgroundSound: 'none',
  volume: 0.5,
};

const SETTINGS_STORAGE_KEY = 'prod-uibo-settings';

// =================================================================
// SECTION: Context Definition
// =================================================================

/**
 * Defines the shape of the data that the SettingsContext will provide.
 */
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
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
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The child components to render.
 * @returns {JSX.Element} The context provider component.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);

  /**
   * Effect to load (hydrate) settings from localStorage on initial client-side render.
   */
  useEffect(() => {
    let initialSettings = { ...DEFAULT_SETTINGS };
    try {
      const storedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
      if (storedSettings) {
        // If settings exist in storage, merge them over the defaults.
        initialSettings = { ...initialSettings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error("Failed to parse settings from localStorage", error);
    }
    setSettings(initialSettings);
  }, []); // Empty dependency array ensures this runs only once on mount.

  /**
   * Effect to persist settings to localStorage whenever they change.
   */
  useEffect(() => {
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);

  /**
   * Updates one or more settings and merges them into the current state.
   * Memoized with useCallback to maintain a stable function reference.
   */
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  /**
   * Resets all settings back to their default values.
   * Memoized with useCallback.
   */
  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  /**
   * Memoize the context value to prevent unnecessary re-renders in consumers.
   * The value object will only be recreated if settings or the updater functions change.
   */
  const value = useMemo(() => ({
    settings,
    updateSettings,
    resetSettings
  }), [settings, updateSettings, resetSettings]);

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
