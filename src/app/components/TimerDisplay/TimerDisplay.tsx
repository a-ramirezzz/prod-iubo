// src/app/components/TimerDisplay/TimerDisplay.tsx
import type { TimeParts } from '../../types'
import styles from './TimerDisplay.module.css'

/**
 * Defines the props for the TimerDisplay component
 */
interface TimerDisplayProps {
  timeParts: TimeParts
}

/**
 * A component that displays the remaining time in HH:MM:SS format
 * It is semantically structured and accessible for screen readers
 */
export default function TimerDisplay({ timeParts }: TimerDisplayProps) {
  // Format the time into an ISO 8601 duration string for the datetime attribute
  // This provides a machine-readable format for assistive technologies
  const dateTimeString = `PT${timeParts.hours}H${timeParts.minutes}M${timeParts.seconds}S`

  return (
    <time
      className={styles.timerDisplay}
      dateTime={dateTimeString}
      aria-live="polite" // Announces updates to screen readers without interrupting
      aria-atomic="true" // Ensures the entire time is announced, not just the changed part
    >
      {/* Hours segment */}
      {/* The unique key forces a re-render, which can be used to trigger animations */}
      <span key={`h-${timeParts.hours}`} className={styles.timeSegment}>
        {timeParts.hours}
      </span>

      <span aria-hidden="true">:</span>

      {/* Minutes segment */}
      <span key={`m-${timeParts.minutes}`} className={styles.timeSegment}>
        {timeParts.minutes}
      </span>

      <span aria-hidden="true">:</span>

      {/* Seconds segment */}
      <span key={`s-${timeParts.seconds}`} className={styles.timeSegment}>
        {timeParts.seconds}
      </span>
    </time>
  )
}
