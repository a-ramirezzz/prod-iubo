// app/components/CustomTimeInput/CustomTimeInput.tsx
import styles from '@/app/components/CustomTimeInput/CustomTimeInput.module.css'
import { useLocale } from '@/app/lib/i18n'

/**
 * Interface for the CustomTimeInput component's props
 */
interface CustomTimeInputProps {
  hours: string
  onHoursChange: (value: string) => void
  minutes: string
  onMinutesChange: (value: string) => void
  onStart: () => void
  disabled: boolean
  inputsDisabled: boolean
}

/**
 * A reusable input component for setting a custom time (hours and minutes)
 * It includes validation and accessibility improvements
 */
export default function CustomTimeInput({
  hours,
  onHoursChange,
  minutes,
  onMinutesChange,
  onStart,
  disabled,
  inputsDisabled
}: CustomTimeInputProps) {
  const { t } = useLocale()
  // Handles changes for a given time input (hours or minutes)
  const handleTimeChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    max: number,
    callback: (value: string) => void
  ) => {
    // Get the raw value from the input
    const rawValue = e.target.value

    // Allow the input to be empty
    if (rawValue === '') {
      callback('')
      return
    }

    // Parse the value as an integer
    const numericValue = parseInt(rawValue, 10)

    // Ensure the value is a valid number and within the allowed range
    if (!isNaN(numericValue) && numericValue >= 0) {
      // If value exceeds max, clamp it to the max value
      const clampedValue = Math.min(numericValue, max)
      callback(String(clampedValue))
    }
  }

  return (
    <div className={styles.customInputContainer}>
      <input
        type="number"
        placeholder="HH"
        value={hours}
        // Use the handler to process changes for hours
        onChange={(e) => handleTimeChange(e, 72, onHoursChange)}
        className={`${styles.customInput} ${styles.customInputHours}`}
        disabled={inputsDisabled}
        aria-label={t('app.timer.customInput.hoursAria')}
        title={t('app.timer.customInput.hoursTitle')}
      />
      <span className={styles.customInputSeparator} aria-hidden="true">:</span>
      <input
        type="number"
        placeholder="MM"
        value={minutes}
        // Use the handler to process changes for minutes
        onChange={(e) => handleTimeChange(e, 59, onMinutesChange)}
        className={`${styles.customInput} ${styles.customInputMinutes}`}
        disabled={inputsDisabled}
        aria-label={t('app.timer.customInput.minutesAria')}
        title={t('app.timer.customInput.minutesTitle')}
      />
      <button
        onClick={onStart}
        className="button"
        disabled={disabled}
        aria-label={t('app.timer.customInput.startAria')}
      >
        {t('app.timer.customInput.start')}
      </button>
    </div>
  )
}
