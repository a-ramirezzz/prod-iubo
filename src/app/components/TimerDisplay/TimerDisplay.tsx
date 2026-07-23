// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/components/TimerDisplay/TimerDisplay.tsx
import { useEffect, useState } from 'react'
import type { TimeParts } from '@/app/types'
import styles from '@/app/components/TimerDisplay/TimerDisplay.module.css'
import { useLocale } from '@/app/lib/i18n'

/**
 * Defines the props for the TimerDisplay component
 */
interface TimerDisplayProps {
  timeParts: TimeParts
  isActive?: boolean
  remainingSeconds?: number
}

/**
 * A component that displays the remaining time in HH:MM:SS format
 * It is semantically structured and accessible for screen readers
 */
export default function TimerDisplay({ timeParts, isActive = false, remainingSeconds = 0 }: TimerDisplayProps) {
  // Format the time into an ISO 8601 duration string for the datetime attribute
  // This provides a machine-readable format for assistive technologies
  const dateTimeString = `PT${timeParts.hours}H${timeParts.minutes}M${timeParts.seconds}S`

  // Screen-reader announcement text, updated only at meaningful thresholds so the
  // live region does not announce the countdown every single second.
  const [liveText, setLiveText] = useState('')
  const { t } = useLocale()

  useEffect(() => {
    const totalSeconds = (Number(timeParts.hours) * 3600) + (Number(timeParts.minutes) * 60) + Number(timeParts.seconds)
    if (totalSeconds === 60) setLiveText(t('app.timer.display.oneMinute'))
    else if (totalSeconds === 10) setLiveText(t('app.timer.display.tenSeconds'))
    else if (totalSeconds === 0) setLiveText(t('app.timer.display.timeUp'))
  }, [timeParts, t])

  const timerStateClass =
    isActive && remainingSeconds <= 10
      ? styles.timerCritical
      : isActive && remainingSeconds <= 60
        ? styles.timerWarning
        : isActive
          ? styles.timerActive
          : ''

  return (
    <>
    <time
      className={`${styles.timerDisplay} ${timerStateClass}`}
      dateTime={dateTimeString}
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

    {/* Visually hidden live region: announces only at thresholds (see effect above) */}
    <span
      role="status"
      aria-live="assertive"
      aria-atomic="true"
      className="sr-only"
    >
      {liveText}
    </span>
    </>
  )
}
