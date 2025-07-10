// src/app/hooks/usePipTimer.ts
import { useRef, useEffect } from 'react';
import { TimeParts, AppSettings } from '@/types/index';

interface UsePipTimerOptions {
  onPipModeDisabled?: () => void;
}

/**
 * usePipTimer
 *
 * Custom hook to manage a floating timer using the Picture-in-Picture (PiP) API.
 * Handles canvas drawing, PiP window control, and theme-based styling.
 *
 * @param {object} timeParts - The current timer values (hours, minutes, seconds).
 * @param {object} settings - The user settings, including PiP mode toggle and theme.
 * @returns {object} - { canvasRef } to be attached to a <canvas> element.
 */
export const usePipTimer = (
  timeParts: TimeParts,
  settings: AppSettings,
  options?: UsePipTimerOptions
) => {
  // Ref for the hidden canvas element used for PiP rendering
  const canvasRef = useRef(null);
  // Ref to track the current PiP window
  const pipWindowRef = useRef(null);

  /**
   * Draws the timer on the canvas with theme-based styles.
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D context.
   * @param {TimeParts} timeParts - The current timer values.
   */
  const drawTimer = (ctx: CanvasRenderingContext2D, timeParts: TimeParts) => {
    // Canvas dimensions
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw semi-transparent dark background
    ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
    ctx.fillRect(0, 0, width, height);

    // Prepare timer text (hh:mm:ss)
    const timerText = `${timeParts.hours}:${timeParts.minutes}:${timeParts.seconds}`;

    // Set font style (using Anton font, fallback to sans-serif)
    ctx.font = 'bold 48px Anton, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Get theme colors from CSS variables
    const root = document.documentElement;
    const textColor = getComputedStyle(root).getPropertyValue('--text-highlight-color') || '#fff';
    const textShadow = getComputedStyle(root).getPropertyValue('--text-shadow') || '0 2px 8px #000';

    // Set text color
    ctx.fillStyle = textColor.trim();

    // Draw text shadow (manual, since canvas doesn't support CSS text-shadow directly)
    // Parse shadow: '0 2px 8px #000' => offsetX, offsetY, blur, color
    const shadowMatch = textShadow.match(/(-?\d+)px\s+(-?\d+)px\s+(\d+)px\s+(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\))/);
    if (shadowMatch) {
      const [, offsetX, offsetY, blur, color] = shadowMatch;
      ctx.save();
      ctx.shadowOffsetX = Number(offsetX);
      ctx.shadowOffsetY = Number(offsetY);
      ctx.shadowBlur = Number(blur);
      ctx.shadowColor = color;
      ctx.fillText(timerText, width / 2, height / 2);
      ctx.restore();
    }

    // Draw main timer text (without shadow)
    ctx.shadowColor = 'transparent';
    ctx.fillText(timerText, width / 2, height / 2);
  };

  /**
   * Handles entering or exiting Picture-in-Picture mode for the timer canvas.
   * If pipModeEnabled is true, requests PiP; otherwise, exits PiP if active.
   */
  const togglePipWindow = async () => {
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    if (!canvas) return;

    // If PiP mode should be enabled
    if (settings.pipModeEnabled) {
      try {
        // Only request PiP if not already in PiP
        if (document.pictureInPictureElement !== canvas) {
          // Set a reasonable size for the PiP window
          canvas.width = 320;
          canvas.height = 120;
          // Request Picture-in-Picture
          // @ts-ignore: requestPictureInPicture is not yet in TS DOM types for canvas
          pipWindowRef.current = await canvas.requestPictureInPicture();
        }
      } catch (err) {
        // Handle errors (e.g., user denied, not supported)
        // Optionally, you could show a notification or log
        // console.error('Failed to enter Picture-in-Picture:', err);
      }
    } else {
      // If PiP mode should be disabled and canvas is in PiP
      if (document.pictureInPictureElement === canvas) {
        try {
          await document.exitPictureInPicture();
        } catch (err) {
          // Handle errors
        }
      }
    }
  };

  /**
   * Main effect: updates the canvas with the current timer and theme, and manages PiP state.
   * Also attaches a listener to detect when the PiP window is closed manually by the user.
   */
  useEffect(() => {
    const canvas = canvasRef.current as HTMLCanvasElement | null;
    if (!canvas) return;

    // Draw the timer with the latest values and theme
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawTimer(ctx, timeParts);
    }

    // Handle PiP window state
    togglePipWindow();

    // Handler for PiP window close event
    const handleLeavePiP = () => {
      // If the PiP window is closed manually, call the provided callback to update state in context
      if (options && typeof options.onPipModeDisabled === 'function') {
        options.onPipModeDisabled();
      }
    };

    // Add event listener for PiP close
    canvas.addEventListener('leavepictureinpicture', handleLeavePiP);

    // Cleanup: remove event listener
    return () => {
      canvas.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeParts, settings]);

  // Return the canvas ref for use in the main component
  return { canvasRef };
}; 