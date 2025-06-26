/**
 * =================================================================
 * src/app/lib/time.ts
 * -----------------------------------------------------------------
 * This file contains utility functions related to time formatting
 * and calculations.
 * =================================================================
 */

// =================================================================
// SECTION: Imports
// =================================================================

import type { TimeParts } from '../types'; 

// =================================================================
// SECTION: Utility Functions
// =================================================================

/**
 * Converts a total number of seconds into a structured time object.
 * The object contains zero-padded strings for hours, minutes, and seconds,
 * making it suitable for direct use in a UI display.
 * * @param {number} secondsToFormat - The total number of seconds to format.
 * @returns {TimeParts} An object with `hours`, `minutes`, and `seconds` properties.
 */
export const formatTime = (secondsToFormat: number): TimeParts => {
  // Calculate hours by dividing the total seconds by 3600 (60 * 60).
  const h = Math.floor(secondsToFormat / 3600);
  
  // Calculate minutes by getting the remainder of the hours division and dividing by 60.
  const m = Math.floor((secondsToFormat % 3600) / 60);
  
  // Seconds are the remainder of the division by 60.
  const s = secondsToFormat % 60;

  // Return the structured object, ensuring each part is a two-digit string.
  return {
    hours: String(h).padStart(2, '0'),
    minutes: String(m).padStart(2, '0'),
    seconds: String(s).padStart(2, '0'),
  };
};
