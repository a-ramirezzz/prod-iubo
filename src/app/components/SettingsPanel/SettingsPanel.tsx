import { useState } from 'react';
import styles from './SettingsPanel.module.css';
import { useSettings } from '../../context/SettingsContext'; 

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveSectionType = 'General' | 'Temas' | 'Sonidos' | 'Focus';
const MENU_ITEMS: ActiveSectionType[] = ['General', 'Temas', 'Sonidos', 'Focus'];

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<ActiveSectionType>('General');
  const { settings, updateSettings, resetSettings } = useSettings(); 

  if (!isOpen) {
    return null;
  }

  const handleResetClick = () => {
    if (window.confirm('¿Estás seguro de que quieres restablecer todos los ajustes a sus valores predeterminados?')) {
      resetSettings();
    }
  };

  return (
    <>
      <div className={styles.backdrop} onClick={onClose}></div>
      <div className={`${styles.settingsPanel} ${isOpen ? styles.open : ''}`}>
        <button className={styles.closeButton} onClick={onClose}>✕</button>
        <div className={styles.panelContent}>
          <aside className={styles.sidebar}>
            <nav>
              <ul>
                {MENU_ITEMS.map((item) => (
                  <li key={item}>
                    <button
                      className={`${styles.menuButton} ${activeSection === item ? styles.active : ''}`}
                      onClick={() => setActiveSection(item)}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </aside>
          <main className={styles.mainContentArea}>
            <h2 className={styles.sectionTitle}>{activeSection}</h2>
            
            {activeSection === 'General' && (
              <div className={styles.settingsContainer}>
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

                <div className={styles.settingItem}>
                  <label htmlFor="always-on-top" className={styles.disabledLabel}>Mantener Siempre Visible</label>
                  <label className={styles.toggleSwitch}>
                    <input id="always-on-top" type="checkbox" disabled />
                    <span className={styles.slider}></span>
                  </label>
                </div>
                
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

                <div className={styles.resetSection}>
                  <button onClick={handleResetClick} className={`${styles.resetButton} button button-stop`}>
                    Restablecer Ajustes
                  </button>
                </div>
              </div>
            )}

            {activeSection !== 'General' && (
              <div className={styles.comingSoon}>PRÓXIMAMENTE</div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}