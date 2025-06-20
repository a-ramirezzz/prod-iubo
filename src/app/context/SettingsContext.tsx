// src/app/context/SettingsContext.tsx
'use client';

import { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import type { AppSettings } from '../types';

// Valores por defecto para los ajustes
const defaultSettings: AppSettings = {
  startInMiniMode: false,
  confirmOnStop: true,
  alwaysOnTop: false,
  language: 'es',
  themeMode: 'dark',
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

  // Al cargar, intentar leer la configuración desde localStorage
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem('prod-uibo-settings');
      if (storedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
      }
    } catch (error) {
      console.error("Failed to parse settings from localStorage", error);
      setSettings(defaultSettings);
    }
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
    setSettings(defaultSettings);
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