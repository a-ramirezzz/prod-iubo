// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// components/FocusMode/FocusMode.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './FocusMode.module.css';
import { useLocale } from '@/app/lib/i18n';

interface FocusModeProps {
  timeDisplay: string;
  isRunning: boolean;
  currentPhase: string;
  taskText: string | null;
  onToggleTimer: () => void;
  onExit: () => void;
}

const PHASE_KEYS: Record<string, string> = {
  work: 'app.focusMode.work',
  short_break: 'app.focusMode.shortBreak',
  long_break: 'app.focusMode.longBreak',
};

/**
 * FocusMode is a distraction-free fullscreen overlay showing only the timer
 * countdown, the current task and a play/pause control. It is a CSS overlay
 * (not the browser Fullscreen API) so it works reliably without a user
 * gesture requirement or cross-browser quirks. The timer engine keeps
 * running underneath it — this component is purely presentational.
 */
export default function FocusMode({
  timeDisplay,
  isRunning,
  currentPhase,
  taskText,
  onToggleTimer,
  onExit,
}: FocusModeProps) {
  const { t } = useLocale();
  const overlayRef = useRef<HTMLDivElement>(null);
  const playPauseRef = useRef<HTMLButtonElement>(null);
  const [hintVisible, setHintVisible] = useState(true);

  // Move focus into the overlay on mount so keyboard/Escape works right away.
  useEffect(() => {
    playPauseRef.current?.focus();
  }, []);

  // Exit hint: fades out after 3s of inactivity, reappears on mouse movement.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const resetHint = () => {
      setHintVisible(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => setHintVisible(false), 3000);
    };
    resetHint();
    window.addEventListener('mousemove', resetHint);
    return () => {
      window.removeEventListener('mousemove', resetHint);
      clearTimeout(timeoutId);
    };
  }, []);

  // F/Escape are handled globally by useKeyboardShortcuts (it knows about
  // every other modal in the app and must decide priority). This effect only
  // keeps Tab cycling between the two focusable elements in the overlay.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        const focusables = overlayRef.current?.querySelectorAll<HTMLElement>(
          'button, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement;
        if (e.shiftKey && active === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const phaseKey = PHASE_KEYS[currentPhase];

  return (
    <div
      ref={overlayRef}
      className={styles.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={t('app.focusMode.title')}
    >
      {phaseKey && <div className={styles.phaseLabel}>{t(phaseKey)}</div>}

      <div className={styles.timeDisplay}>{timeDisplay}</div>

      {taskText && <div className={styles.taskText}>{taskText}</div>}

      <button
        ref={playPauseRef}
        type="button"
        className={styles.playPauseButton}
        onClick={onToggleTimer}
        aria-label={isRunning ? t('app.focusMode.pause') : t('app.focusMode.resume')}
      >
        {isRunning ? (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        ) : (
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      <span
        className={`${styles.exitHint} ${hintVisible ? styles.exitHintVisible : ''}`}
        aria-hidden="true"
      >
        {t('app.focusMode.exitHint')}
      </span>

      {/* Visually hidden but focusable: gives keyboard/screen-reader users an
          explicit way to exit besides the F/Esc shortcuts. */}
      <button
        type="button"
        className={styles.exitButton}
        onClick={onExit}
        aria-label={t('app.focusMode.title')}
      >
        {t('app.focusMode.exitHint')}
      </button>
    </div>
  );
}
