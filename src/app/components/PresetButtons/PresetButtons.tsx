// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// app/components/PresetButtons/PresetButtons.tsx
import type React from 'react'
import styles from '@/app/components/PresetButtons/PresetButtons.module.css'

interface PresetButtonsProps {
  onSetTime: (minutes: number) => void
  disabled: boolean
}

const PRESET_MINUTES = [5, 15, 25, 60]

function addRipple(e: React.MouseEvent<HTMLButtonElement>) {
  const btn = e.currentTarget
  const rect = btn.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height)
  const x = e.clientX - rect.left - size / 2
  const y = e.clientY - rect.top - size / 2
  const ripple = document.createElement('span')
  ripple.className = styles.ripple
  ripple.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px`
  btn.appendChild(ripple)
  setTimeout(() => ripple.remove(), 500)
}

export default function PresetButtons({ onSetTime, disabled }: PresetButtonsProps) {
  return (
    <div className={styles.presetsContainer}>
      {PRESET_MINUTES.map((minutes) => (
        <button
          key={minutes}
          onClick={(e) => { addRipple(e); onSetTime(minutes) }}
          className={`button ${styles.presetBtn} ${minutes === 25 ? styles.presetBtnPomodoro : ''}`}
          disabled={disabled}
          aria-label={`Set timer for ${minutes} minutes`}
        >
          {minutes} min
        </button>
      ))}
    </div>
  )
}
