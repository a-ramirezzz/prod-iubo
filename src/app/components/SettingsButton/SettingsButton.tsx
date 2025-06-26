// app/components/SettingsButton/SettingsButton.tsx
import styles from '@/app/components/SettingsButton/SettingsButton.module.css'

/**
 * Defines the props for the SettingsButton component
 */
interface SettingsButtonProps {
  // Callback function to be executed when the button is clicked, e.g., to open a modal
  onClick: () => void
}

/**
 * An icon button used to trigger an action, such as opening a settings panel
 */
export default function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button
      className={styles.settingsButton}
      onClick={onClick}
      aria-label="Open settings" // Provides a clear action description for screen readers
      title="Configuración" // Provides a standard tooltip for mouse users
    >
      {/* The following line disables a Next.js-specific linting rule
        This is necessary because the standard <Image> component is not available in this environment
      */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-conf.png"
        alt="Settings Icon" // Describes the image itself
        width={30}
        height={30}
      />
    </button>
  )
}
