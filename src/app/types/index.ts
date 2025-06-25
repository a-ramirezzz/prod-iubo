/**
 * =================================================================
 * src/app/types/index.ts
 * -----------------------------------------------------------------
 * This file serves as the central hub for all TypeScript type
 * definitions and interfaces used throughout the application.
 * Consolidating types here ensures consistency and maintainability.
 * =================================================================
 */

/**
 * Represents the constituent parts of a time value, used for display purposes.
 */
export interface TimeParts {
  hours: string;
  minutes: string;
  seconds: string;
}

/**
 * Represents a single to-do item in the task list.
 */
export interface Task {
  id: string;      // Unique identifier for the task.
  text: string;    // The content of the task.
  completed: boolean; // The completion status of the task.
}

/**
 * Defines the complete structure for all user-configurable settings.
 * This object is persisted in localStorage to remember user preferences.
 */
export interface AppSettings {
  // --- General Settings ---
  startInMiniMode: boolean; // Should the app launch in mini mode?
  confirmOnStop: boolean;   // Ask for confirmation before stopping the timer.
  alwaysOnTop: boolean;     // For future desktop app: keep window on top.
  language: 'es' | 'en';    // Application language.

  // --- Theme & Appearance Settings ---
  themeMode: 'light' | 'dark'; // The current color mode (light or dark).
  selectedThemeId: string;     // The ID of the currently active theme (static or animated).

  // --- Audio Settings ---
  backgroundSound: string; // The ID of the selected background sound ('none' for no sound).
  volume: number;          // The volume level for background audio (0.0 to 1.0).
}
