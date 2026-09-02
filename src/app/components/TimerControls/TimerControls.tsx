// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// app/components/TimerControls/TimerControls.tsx
import { motion } from 'framer-motion'
import styles from '@/app/components/TimerControls/TimerControls.module.css'
import { useLocale } from '@/app/lib/i18n'
import { useTapScaleProps } from '@/app/lib/motion'

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
  /** 'stopwatch' skips the countdown's "finished at 0" disabled state and swaps the Stop label for "Complete". Defaults to 'pomodoro'. */
  mode?: 'pomodoro' | 'stopwatch'
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
  onStop,
  mode = 'pomodoro'
}: TimerControlsProps) {
  const { t } = useLocale()
  const tapScale = useTapScaleProps()

  // Do not render the controls if no initial time has been set
  if (initialTimeSet === 0) {
    return null
  }

  // Determine if the timer has finished to disable the pause/resume button.
  // A Stopwatch never "finishes" on its own — it's always resumable until stopped.
  const isTimerFinished = mode === 'stopwatch' ? false : totalSeconds === 0 && !isActive
  // Dynamically set the text for the main action button
  const pauseResumeText = isActive ? t('app.timer.controls.pause') : t('app.timer.controls.resume')
  const stopText = mode === 'stopwatch' ? t('app.timer.stopwatch.complete') : t('app.timer.controls.stop')
  const stopAriaText = mode === 'stopwatch' ? t('app.timer.stopwatch.completeAria') : t('app.timer.controls.stopAria')

  return (
    <div className={styles.controlsContainer}>
      <motion.button
        onClick={onTogglePause}
        className={`button ${styles.btnPause}`}
        disabled={isTimerFinished}
        aria-label={isActive ? t('app.timer.controls.pauseAria') : t('app.timer.controls.resumeAria')}
        {...tapScale}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
        </svg>
        {pauseResumeText}
      </motion.button>
      <motion.button
        onClick={onReset}
        className={`button button-reset ${styles.btnReset}`}
        aria-label={t('app.timer.controls.resetAria')}
        {...tapScale}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M3 12a9 9 0 1 0 9-9 9 9 0 0 0-6.36 2.64L3 8"/><path d="M3 3v5h5"/>
        </svg>
        {t('app.timer.controls.reset')}
      </motion.button>
      <motion.button
        onClick={onStop}
        className={`button button-stop ${styles.btnStop}`}
        aria-label={stopAriaText}
        {...tapScale}
      >
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <rect x="4" y="4" width="16" height="16" rx="2"/>
        </svg>
        {stopText}
      </motion.button>
    </div>
  )
}
