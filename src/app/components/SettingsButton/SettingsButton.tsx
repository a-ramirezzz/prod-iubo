import Image from 'next/image';
import styles from './SettingsButton.module.css';

interface SettingsButtonProps {
  onClick: () => void;
}

export default function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button className={styles.settingsButton} onClick={onClick} title="Configuración">
      <Image src="/logo-conf.png" alt="Configuración" width={30} height={30} />
    </button>
  );
}