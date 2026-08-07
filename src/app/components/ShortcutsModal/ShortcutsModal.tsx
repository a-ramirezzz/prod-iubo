"use client";
// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/components/ShortcutsModal/ShortcutsModal.tsx

import React, { useEffect, useRef } from 'react';
import styles from './ShortcutsModal.module.css';
import { useLocale } from '@/app/lib/i18n';

interface ShortcutsModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Called when the modal should close */
  onClose: () => void;
}

// A single shortcut: one or more key labels plus a description i18n key.
interface Shortcut {
  keys: string[];
  descKey: string;
}

// A category groups related shortcuts. `titleKey` is an i18n key.
interface Category {
  titleKey: string;
  shortcuts: Shortcut[];
}

/**
 * Static description of every keyboard shortcut the app currently implements.
 * Mirrors `useKeyboardShortcuts` (Space/R/S/M/F/1/2/Escape) plus the global `?`
 * that opens this modal. This is documentation only — it does not register any
 * behavior, so it must be kept in sync with the hook.
 */
const CATEGORIES: Category[] = [
  {
    titleKey: 'app.shortcuts.categoryTimer',
    shortcuts: [
      { keys: ['Space'], descKey: 'app.shortcuts.shortcutStartPause' },
      { keys: ['S'], descKey: 'app.shortcuts.shortcutStop' },
      { keys: ['R'], descKey: 'app.shortcuts.shortcutReset' },
      { keys: ['M'], descKey: 'app.shortcuts.shortcutMiniMode' },
      { keys: ['F'], descKey: 'app.focusMode.shortcut' },
    ],
  },
  {
    titleKey: 'app.shortcuts.categoryNavigation',
    shortcuts: [
      { keys: ['1'], descKey: 'app.shortcuts.shortcutTimerTab' },
      { keys: ['2'], descKey: 'app.shortcuts.shortcutFocusTab' },
      { keys: ['3'], descKey: 'app.shortcuts.shortcutAchievementsTab' },
    ],
  },
  {
    titleKey: 'app.shortcuts.categoryGeneral',
    shortcuts: [
      { keys: ['?'], descKey: 'app.shortcuts.shortcutShowShortcuts' },
      { keys: ['Esc'], descKey: 'app.shortcuts.shortcutCloseModal' },
    ],
  },
];

/**
 * A modal listing every keyboard shortcut, grouped by category. Matches the
 * PROD-UIBO modal visual language (backdrop blur + card animation) and is fully
 * localized and accessible (role="dialog", focus trap, Escape to close).
 */
const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLocale();
  const closeRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  // Remember the element focused before opening, to restore it on close.
  const previouslyFocused = useRef<HTMLElement | null>(null);

  // On open: remember focus, move it into the modal. On close: restore it.
  useEffect(() => {
    if (isOpen) {
      previouslyFocused.current = document.activeElement as HTMLElement | null;
      closeRef.current?.focus();
    } else if (previouslyFocused.current) {
      previouslyFocused.current.focus();
      previouslyFocused.current = null;
    }
  }, [isOpen]);

  // Escape to close + a minimal Tab focus trap scoped to the modal.
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key === 'Tab') {
        const focusables = modalRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
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
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <h2 id="shortcuts-modal-title" className={styles.title}>
            {t('app.shortcuts.title')}
          </h2>
          <button
            ref={closeRef}
            className={styles.closeButton}
            onClick={onClose}
            aria-label={t('settings.closeAria')}
          >
            ✕
          </button>
        </div>

        {CATEGORIES.map((category) => (
          <div key={category.titleKey} className={styles.category}>
            <h3 className={styles.categoryTitle}>{t(category.titleKey)}</h3>
            {category.shortcuts.map((shortcut) => (
              <div key={shortcut.descKey} className={styles.shortcutRow}>
                <span className={styles.description}>{t(shortcut.descKey)}</span>
                <span className={styles.keys}>
                  {shortcut.keys.map((key, i) => (
                    <kbd key={i} className={styles.kbd}>
                      {key}
                    </kbd>
                  ))}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShortcutsModal;
