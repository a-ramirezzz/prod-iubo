// app/components/TimerControls/TimerControls.tsx
import styles from './TimerControls.module.css'

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
        className="button"
        disabled={isTimerFinished}
        aria-label={isActive ? 'Pause the timer' : 'Resume the timer'}
      >
        {pauseResumeText}
      </button>
      <button
        onClick={onReset}
        className="button button-reset"
        aria-label="Reset the timer to its initial time"
      >
        Reiniciar
      </button>
      <button
        onClick={onStop}
        className="button button-stop"
        aria-label="Stop the timer and return to the setup screen"
      >
        Detener
      </button>
    </div>
  )
}
