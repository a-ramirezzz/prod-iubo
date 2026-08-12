// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/lib/haptic.ts

/**
 * Triggers a short vibration pulse on supporting mobile devices.
 * Feature-detects navigator.vibrate and swallows any errors — some
 * browsers throw even when the API is present.
 */
export function hapticFeedback(pattern: number | number[] = 50): void {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Haptics are a non-critical enhancement — never crash the app.
  }
}
