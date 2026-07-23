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
  position: number;   // Sort order of the task within the user's list.
}

/**
 * Defines the complete structure for all user-configurable settings.
 * This object is persisted in Supabase to remember user preferences.
 * All fields use snake_case to match the database schema.
 */
export interface AppSettings {
  is_pro: boolean;
  start_in_mini_mode: boolean;
  confirm_on_stop: boolean;
  pip_mode_enabled: boolean;
  horizontal_pip_enabled: boolean;
  language: 'es' | 'en';
  enable_desktop_notifications: boolean;
  theme_mode: 'light' | 'dark';
  selected_theme_id: string;
  background_sound: string;
  volume: number;
  daily_pomodoro_goal: number;
}
