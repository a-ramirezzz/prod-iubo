import { useState } from 'react';
import styles from './SettingsPanel.module.css';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type ActiveSectionType = 'General' | 'Temas' | 'Sonidos' | 'Focus';

const MENU_ITEMS: ActiveSectionType[] = ['General', 'Temas', 'Sonidos', 'Focus'];

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<ActiveSectionType>('General');

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Capa de fondo para el efecto borroso y cerrar al hacer clic */}
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
            {/* Contenido de la sección */}
            <div className={styles.comingSoon}>
              PRÓXIMAMENTE
            </div>
          </main>
        </div>
      </div>
    </>
  );
}