// src/app/context/SettingsContext.tsx
'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import type { AppSettings } from '../types';
import { themes } from '../lib/themes';

// Valores por defecto para los ajustes
const defaultSettings: AppSettings = {
  startInMiniMode: false,
  confirmOnStop: true,
  alwaysOnTop: false,
  language: 'es',
  themeMode: 'dark',
  selectedThemeId: 'dark-default',
};

// Definir el tipo para el valor del contexto
interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

// Crear el contexto
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// Crear el proveedor del contexto
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // Al cargar, intentar leer la configuración
  useEffect(() => {
    let initialSettings = { ...defaultSettings };
    try {
      // 1. Detectar preferencia del sistema para establecer un valor inicial inteligente
      const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      const initialMode = prefersDark ? 'dark' : 'light';
      
      // Usamos .find() para obtener el tema por defecto 
      const defaultTheme = themes.find(theme => theme.mode === initialMode);

      initialSettings.themeMode = initialMode;
      // Asignamos el ID encontrado. Si no encuentra nada, se queda con el default.
      initialSettings.selectedThemeId = defaultTheme ? defaultTheme.id : (prefersDark ? 'dark-default' : 'light-default');

      // 2. Sobrescribir con lo guardado en localStorage si existe
      const storedSettings = localStorage.getItem('prod-uibo-settings');
      if (storedSettings) {
        initialSettings = { ...initialSettings, ...JSON.parse(storedSettings) };
      }
    } catch (error) {
      console.error("Failed to initialize settings", error);
    }
    setSettings(initialSettings);
  }, []);

  // Cuando los ajustes cambien, guardarlos en localStorage
  useEffect(() => {
    try {
      localStorage.setItem('prod-uibo-settings', JSON.stringify(settings));
    } catch (error) {
      console.error("Failed to save settings to localStorage", error);
    }
  }, [settings]);

  // Función para actualizar una o más configuraciones
  const updateSettings = useCallback((newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Función para restablecer a los valores por defecto
  const resetSettings = useCallback(() => {
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const themeMode = prefersDark ? 'dark' : 'light';
    
    // También usamos .find() al resetear
    const defaultTheme = themes.find(theme => theme.mode === themeMode);
    const selectedThemeId = defaultTheme ? defaultTheme.id : (prefersDark ? 'dark-default' : 'light-default');

    setSettings({ ...defaultSettings, themeMode, selectedThemeId });
  }, []);

  const value = { settings, updateSettings, resetSettings };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

// Hook personalizado para usar el contexto fácilmente
export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
