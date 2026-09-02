// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// app/components/TimerModeToggle/TimerModeToggle.tsx
import { memo } from 'react'
import styles from '@/app/components/TimerModeToggle/TimerModeToggle.module.css'
import { useLocale } from '@/app/lib/i18n'
import type { TimerMode } from '@/hooks/useTimerController'

interface TimerModeToggleProps {
  mode: TimerMode
  onChange: (mode: TimerMode) => void
  disabled: boolean
}

/**
 * A quick-switch segmented control for choosing between Pomodoro (countdown)
 * and Stopwatch (count-up) timer modes. Lives on the Timer tab, next to the
 * display — not in Settings, since it's meant to be a fast, frequent toggle.
 * Disabled while either mode has an in-progress session, since switching
 * mid-session would discard unsaved progress.
 */
function TimerModeToggle({ mode, onChange, disabled }: TimerModeToggleProps) {
  const { t } = useLocale()

  return (
    <div
      className={styles.toggleContainer}
      role="radiogroup"
      aria-label={t('app.timer.modeToggle.label')}
    >
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'pomodoro'}
        disabled={disabled}
        className={`${styles.toggleOption} ${mode === 'pomodoro' ? styles.toggleOptionActive : ''}`}
        onClick={() => onChange('pomodoro')}
      >
        {t('app.timer.modeToggle.pomodoro')}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={mode === 'stopwatch'}
        disabled={disabled}
        className={`${styles.toggleOption} ${mode === 'stopwatch' ? styles.toggleOptionActive : ''}`}
        onClick={() => onChange('stopwatch')}
      >
        {t('app.timer.modeToggle.stopwatch')}
      </button>
    </div>
  )
}

// Memoized: parent re-renders every timer tick, but mode/disabled only
// change on start/pause/mode-switch.
export default memo(TimerModeToggle)
