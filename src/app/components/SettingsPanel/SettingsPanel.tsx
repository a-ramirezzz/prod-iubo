// src/app/components/SettingsPanel/SettingsPanel.tsx

// React and hooks
import { useState } from 'react';
// Styles
import styles from './SettingsPanel.module.css';
// Context for global settings
import { useSettings } from '../../context/SettingsContext';
// Theme and sound data
import { themes } from '../../lib/themes';
import ThemeCard from '../ThemeCard/ThemeCard';
import { sounds, noSound } from '../../lib/sounds';

// Props for the SettingsPanel component
interface SettingsPanelProps {
  isOpen: boolean; // Whether the panel is open
  onClose: () => void; // Function to close the panel
}

// Icon definitions for each section
const ICONS = {
  General: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 7h-9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" /><path d="M5 14H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1" /></svg>
  ),
  Temas: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" /></svg>
  ),
  Sonidos: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
  ),
  Focus: (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" /></svg>
  ),
};

// Type for the active section
type ActiveSectionType = 'General' | 'Temas' | 'Sonidos' | 'Focus';
// Menu items for the sidebar
const MENU_ITEMS: ActiveSectionType[] = ['General', 'Temas', 'Sonidos', 'Focus'];

/**
 * SettingsPanel component
 * Displays a modal panel for user settings, including general options, themes, and sounds.
 */
export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  // State for the currently active section
  const [activeSection, setActiveSection] = useState<ActiveSectionType>('General');
  // Access settings and update functions from context
  const { settings, updateSettings, resetSettings } = useSettings();

  // If the panel is not open, render nothing
  if (!isOpen) {
    return null;
  }

  // Handler for resetting all settings to default
  const handleResetClick = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer todos los ajustes a sus valores predeterminados?')) {
      resetSettings();
    }
  };

  // Handler for toggling theme mode (light/dark)
  const handleThemeChange = () => {
    const newThemeMode = settings.themeMode === 'light' ? 'dark' : 'light';
    // When changing mode, also select the first static theme by default
    const defaultThemeForMode = themes.find(t => t.mode === newThemeMode && t.type === 'static');
    
    updateSettings({ 
      themeMode: newThemeMode,
      selectedThemeId: defaultThemeForMode ? defaultThemeForMode.id : settings.selectedThemeId 
    });
  };

  // Render the settings panel UI
  return (
    <>
      {/* Backdrop overlay */}
      <div className={styles.backdrop} onClick={onClose}></div>
      <div className={`${styles.settingsPanel} ${isOpen ? styles.open : ''}`}>
        {/* Close button */}
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        <div className={styles.panelContent}>
          {/* Sidebar navigation */}
          <aside className={styles.sidebar}>
            <h3 className={styles.sidebarTitle}>CONFIGURACIÓN</h3>
            <nav>
              <ul>
                {MENU_ITEMS.map((item) => (
                  <li key={item}>
                    <button
                      className={`${styles.menuButton} ${activeSection === item ? styles.active : ''}`}
                      onClick={() => setActiveSection(item)}
                    >
                      {ICONS[item]}
                      <span>{item}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          {/* Main content area */}
          <main className={styles.mainContentArea}>
            <h2 className={styles.sectionTitle}>{activeSection}</h2>
            
            {/* General Settings Section */}
            {activeSection === 'General' && (
              <div className={styles.settingsContainer}>
                {/* Start in Mini Mode toggle */}
                <div className={styles.settingItem}>
                  <label htmlFor="start-mini">Iniciar en Modo Mini</label>
                  <label className={styles.toggleSwitch}>
                    <input
                      id="start-mini"
                      type="checkbox"
                      checked={settings.startInMiniMode}
                      onChange={(e) => updateSettings({ startInMiniMode: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {/* Confirm on Stop toggle */}
                <div className={styles.settingItem}>
                  <label htmlFor="confirm-stop">Confirmación al Detener</label>
                  <label className={styles.toggleSwitch}>
                    <input
                      id="confirm-stop"
                      type="checkbox"
                      checked={settings.confirmOnStop}
                      onChange={(e) => updateSettings({ confirmOnStop: e.target.checked })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {/* Always on Top (disabled, placeholder) */}
                <div className={styles.settingItem}>
                  <label htmlFor="always-on-top" className={styles.disabledLabel}>Mantener Siempre Visible</label>
                  <label className={styles.toggleSwitch}>
                    <input id="always-on-top" type="checkbox" disabled />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                {/* Language selector */}
                <div className={styles.settingItem}>
                  <label htmlFor="language">Idioma</label>
                  <select
                    id="language"
                    value={settings.language}
                    onChange={(e) => updateSettings({ language: e.target.value as 'es' | 'en' })}
                    className={styles.select}
                  >
                    <option value="es">Español</option>
                    <option value="en" disabled>English (Próximamente)</option>
                  </select>
                </div>
                {/* Reset settings button */}
                <div className={styles.resetSection}>
                  <button onClick={handleResetClick} className={`${styles.resetButton} button button-stop`}>
                    Restablecer Ajustes
                  </button>
                </div>
              </div>
            )}
            
            {/* Themes Section */}
            {activeSection === 'Temas' && (
              <div className={styles.settingsContainer}>
                {/* Theme mode switcher */}
                <div className={styles.settingItem}>
                  <label>Apariencia</label>
                  <div className={styles.themeSwitcher}>
                    <span>Claro</span>
                    <label className={styles.toggleSwitch}>
                      <input
                        type="checkbox"
                        checked={settings.themeMode === 'dark'}
                        onChange={handleThemeChange}
                      />
                      <span className={styles.slider}></span>
                    </label>
                    <span>Oscuro</span>
                  </div>
                </div>

                {/* Static themes */}
                <h3 className={styles.subSectionTitle}>Temas Estáticos</h3>
                <div className={styles.themeGrid}>
                  {themes
                    .filter(theme => theme.mode === settings.themeMode && theme.type === 'static')
                    .map(theme => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={settings.selectedThemeId === theme.id}
                        onClick={() => updateSettings({ selectedThemeId: theme.id })}
                      />
                    ))}
                </div>

                {/* Animated themes */}
                <h3 className={styles.subSectionTitle}>Temas Animados</h3>
                <div className={styles.themeGrid}>
                   {themes
                    .filter(theme => theme.mode === settings.themeMode && theme.type === 'animated')
                    .map(theme => (
                      <ThemeCard
                        key={theme.id}
                        theme={theme}
                        isSelected={settings.selectedThemeId === theme.id}
                        onClick={() => updateSettings({ selectedThemeId: theme.id })}
                      />
                    ))}
                </div>
              </div>
            )}

            {/* Sounds Section */}
            {activeSection === 'Sonidos' && (
              <div className={styles.settingsContainer}>
                {/* Background sound selection */}
                <h3 className={styles.subSectionTitle}>Sonido de fondo</h3>

                <div className={styles.soundList}>
                  {[noSound, ...sounds].map((sound) => (
                    <button
                      key={sound.id}
                      className={`${styles.soundCard} ${settings.backgroundSound === sound.id ? styles.activeSound : ''}`}
                      onClick={() => updateSettings({ backgroundSound: sound.id })}
                    >
                      <div className={styles.soundIcon}>{sound.icon}</div>
                      <span>{sound.name}</span>
                    </button>
                  ))}
                </div>

                {/* Volume control */}
                <h3 className={styles.subSectionTitle}>Volumen</h3>
                <div className={styles.volumeControl}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/></svg>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={settings.volume}
                        className={styles.volumeSlider}
                        onChange={(e) => updateSettings({ volume: parseFloat(e.target.value) })}
                    />
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>
                </div>
              </div>
            )}

            {/* Focus Section (coming soon placeholder) */}
            {activeSection === 'Focus' && (
              <div className={styles.comingSoon}>PRÓXIMAMENTE</div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
