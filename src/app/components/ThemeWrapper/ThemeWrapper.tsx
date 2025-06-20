// src/app/components/ThemeWrapper.tsx
'use client';

import { useSettings } from '../../context/SettingsContext';
import { useEffect } from 'react';

// Este componente solo tiene una responsabilidad: aplicar la clase del tema.
export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();

  // Este efecto se ejecuta en el cliente y cambia la clase en la etiqueta <html>
  useEffect(() => {
    const root = document.documentElement; 
    root.classList.remove('light-mode', 'dark-mode');
    root.classList.add(settings.themeMode === 'light' ? 'light-mode' : 'dark-mode');
  }, [settings.themeMode]);

  // Simplemente renderiza los hijos que recibe
  return <>{children}</>;
}
