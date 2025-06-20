// src/app/components/ThemeWrapper.tsx
'use client'; 

import { useSettings } from '../../context/SettingsContext';
import { useEffect, useState } from 'react';
import { themes, Theme } from '../../lib/themes';
import VideoBackground from '../VideoBackground/VideoBackground';

export default function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { settings } = useSettings();
  // Estado para mantener el tema activo
  const [activeTheme, setActiveTheme] = useState<Theme | undefined>();

  useEffect(() => {
    const root = document.documentElement; 
    const currentTheme = themes.find(theme => theme.id === settings.selectedThemeId);
    setActiveTheme(currentTheme); // Actualizamos el estado del tema activo
    
    root.classList.remove('light-mode', 'dark-mode');
    root.classList.add(settings.themeMode === 'light' ? 'light-mode' : 'dark-mode');

    if (currentTheme) {
      // Aplicar los estilos CSS (colores de paneles, etc.)
      for (const [key, value] of Object.entries(currentTheme.styles)) {
        if(value){
          root.style.setProperty(key, value);
        } else {
          root.style.removeProperty(key);
        }
      }
      
      // Si el tema es estático, poner la imagen de fondo. Si no, quitarla.
      if (currentTheme.type === 'static' && currentTheme.styles['--bg-image']) {
         root.style.backgroundImage = currentTheme.styles['--bg-image'];
      } else {
         root.style.backgroundImage = 'none';
      }
    }

  }, [settings.themeMode, settings.selectedThemeId]);

  return (
    <>
      {/* Si el tema activo es animado y tiene un video, renderizarlo */}
      {activeTheme && activeTheme.type === 'animated' && activeTheme.backgroundVideo && (
        <VideoBackground src={activeTheme.backgroundVideo} />
      )}
      {children}
    </>
  );
}
