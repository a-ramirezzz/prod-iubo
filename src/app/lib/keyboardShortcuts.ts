// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/lib/keyboardShortcuts.ts
//
// Single source of truth for the app's customizable keyboard shortcuts:
// default key mapping, i18n label keys, and display formatting. Shared by
// useKeyboardShortcuts, SettingsPanel and ShortcutsModal so the three stay in sync.

export type ShortcutId =
  | 'toggleFocusMode'
  | 'toggleWidgetMode'
  | 'startPauseTimer'
  | 'resetTimer'
  | 'stopTimer'
  | 'switchTimerTab'
  | 'switchFocusTab'
  | 'switchAchievementsTab';

export const DEFAULT_SHORTCUTS: Record<ShortcutId, string> = {
  toggleFocusMode: 'f',
  toggleWidgetMode: 'm',
  startPauseTimer: ' ',
  resetTimer: 'r',
  stopTimer: 's',
  switchTimerTab: '1',
  switchFocusTab: '2',
  switchAchievementsTab: '3',
};

// Ordered for display in Settings / the shortcuts modal.
export const SHORTCUT_ORDER: ShortcutId[] = [
  'startPauseTimer',
  'stopTimer',
  'resetTimer',
  'toggleWidgetMode',
  'toggleFocusMode',
  'switchTimerTab',
  'switchFocusTab',
  'switchAchievementsTab',
];

// i18n key (under "shortcuts.") for each shortcut's action label.
export const SHORTCUT_LABEL_KEYS: Record<ShortcutId, string> = {
  toggleFocusMode: 'shortcuts.toggleFocusMode',
  toggleWidgetMode: 'shortcuts.toggleWidgetMode',
  startPauseTimer: 'shortcuts.startPauseTimer',
  resetTimer: 'shortcuts.resetTimer',
  stopTimer: 'shortcuts.stopTimer',
  switchTimerTab: 'shortcuts.switchTimerTab',
  switchFocusTab: 'shortcuts.switchFocusTab',
  switchAchievementsTab: 'shortcuts.switchAchievementsTab',
};

/** Merges saved overrides on top of the defaults, so newly added shortcuts get a key automatically. */
export function resolveShortcuts(saved: Record<string, string> | undefined | null): Record<ShortcutId, string> {
  return { ...DEFAULT_SHORTCUTS, ...(saved ?? {}) };
}

const SPECIAL_KEY_LABELS: Record<string, string> = {
  ' ': 'Space',
  escape: 'Esc',
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  enter: 'Enter',
  tab: 'Tab',
};

/** Human-readable label for a raw `event.key` value, for display in a key badge. */
export function formatKeyLabel(key: string): string {
  const lower = key.toLowerCase();
  if (lower in SPECIAL_KEY_LABELS) return SPECIAL_KEY_LABELS[lower];
  if (key.length === 1) return key.toUpperCase();
  return key;
}

const MODIFIER_KEYS = new Set(['shift', 'control', 'alt', 'meta']);

/** True if a raw `event.key` value is a bare modifier key that cannot be used alone as a shortcut. */
export function isModifierKey(key: string): boolean {
  return MODIFIER_KEYS.has(key.toLowerCase());
}
