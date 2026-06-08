// app/components/TimerControls/TimerControls.tsx
import styles from '@/app/components/TimerControls/TimerControls.module.css'

/**
 * Defines the props for the TimerControls component
 */
interface TimerControlsProps {
  isActive: boolean
  initialTimeSet: number
  totalSeconds: number
  onTogglePause: () => void
  onReset: () => void
  onStop: () => void
}

/**
 * A component that renders the main timer controls: Pause/Resume, Reset, and Stop
 */
export default function TimerControls({
  isActive,
  initialTimeSet,
  totalSeconds,
  onTogglePause,
  onReset,
  onStop
}: TimerControlsProps) {
  // Do not render the controls if no initial time has been set
  if (initialTimeSet === 0) {
    return null
  }

  // Determine if the timer has finished to disable the pause/resume button
  const isTimerFinished = totalSeconds === 0 && !isActive
  // Dynamically set the text for the main action button
  const pauseResumeText = isActive ? 'Pausar' : 'Reanudar'

  return (
    <div className={styles.controlsContainer}>
      <button
        onClick={onTogglePause}
        className={`button ${styles.btnPause}`}
        disabled={isTimerFinished}
        aria-label={isActive ? 'Pause the timer' : 'Resume the timer'}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
        </svg>
        {pauseResumeText}
      </button>
      <button
        onClick={onReset}
        className={`button button-reset ${styles.btnReset}`}
        aria-label="Reset the timer to its initial time"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8"/><path d="M3 3v5h5"/>
        </svg>
        Reiniciar
      </button>
      <button
        onClick={onStop}
        className={`button button-stop ${styles.btnStop}`}
        aria-label="Stop the timer and return to the setup screen"
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2"/>
        </svg>
        Detener
      </button>
    </div>
  )
}
