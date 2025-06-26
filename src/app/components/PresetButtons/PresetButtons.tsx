// app/components/PresetButtons/PresetButtons.tsx
import styles from '@/app/components/PresetButtons/PresetButtons.module.css'

/**
 * Defines the props for the PresetButtons component
 */
interface PresetButtonsProps {
  // Callback function to set the timer with a specific number of minutes
  onSetTime: (minutes: number) => void
  // Boolean to disable the buttons, e.g., when a timer is running
  disabled: boolean
}

// An array of numbers representing the preset minute options
const PRESET_MINUTES = [20, 30, 45, 60]

/**
 * A component that renders a set of buttons to quickly set a timer
 * to a predefined number of minutes
 */
export default function PresetButtons({ onSetTime, disabled }: PresetButtonsProps) {
  return (
    <div className={styles.presetsContainer}>
      {/* Map over the predefined minutes to create a button for each */}
      {PRESET_MINUTES.map((minutes) => (
        <button
          key={minutes}
          onClick={() => onSetTime(minutes)}
          className="button"
          disabled={disabled}
          aria-label={`Set timer for ${minutes} minutes`}
        >
          {minutes} min
        </button>
      ))}
    </div>
  )
}
