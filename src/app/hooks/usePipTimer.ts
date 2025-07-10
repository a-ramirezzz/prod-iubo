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
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // Ref for the hidden video element used for PiP
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Ref to track the current PiP window
  const pipWindowRef = useRef(null);
  // Ref to track the MediaStream from the canvas
  const streamRef = useRef<MediaStream | null>(null);

  // Constants for PiP rendering resolution
  // Use a higher resolution for better quality and larger timer in PiP
  const PIP_WIDTH = 1600; // Much larger width for PiP
  const PIP_HEIGHT = 600; // Much larger height for PiP

  /**
   * Utility to ensure the Anton font is loaded before drawing on the canvas.
   * Returns a promise that resolves when the font is ready.
   */
  const ensureAntonFontLoaded = async () => {
    if (document.fonts) {
      try {
        await document.fonts.load('bold 100px Anton');
        await document.fonts.ready;
        console.log('[PiP] Anton font loaded');
      } catch (e) {
        console.warn('[PiP] Failed to load Anton font:', e);
      }
    }
  };

  /**
   * Draws the timer on the canvas with theme-based styles.
   * Ensures the Anton font is loaded before drawing.
   * @param {CanvasRenderingContext2D} ctx - The canvas 2D context.
   * @param {TimeParts} timeParts - The current timer values.
   */
  const drawTimer = async (ctx: CanvasRenderingContext2D, timeParts: TimeParts) => {
    // Ensure Anton font is loaded
    await ensureAntonFontLoaded();

    // Canvas dimensions
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;

    // Determine background and text color based on theme mode
    let backgroundColor = '#000';
    let textColor = '#fff';
    if (settings.themeMode === 'light') {
      backgroundColor = '#fff';
      textColor = '#111';
    }

    // Clear the canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);

    // Prepare timer text (hh:mm:ss)
    const timerText = `${timeParts.hours}:${timeParts.minutes}:${timeParts.seconds}`;

    // Set font style (using Anton font, fallback to sans-serif)
    const fontSize = Math.floor(height * 0.4); // 40% of canvas height
    ctx.font = `bold ${fontSize}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Set text color
    ctx.fillStyle = textColor;

    // Draw text shadow for contrast
    ctx.save();
    if (settings.themeMode === 'light') {
      ctx.shadowColor = 'rgba(0,0,0,0.18)';
      ctx.shadowBlur = 16;
    } else {
      ctx.shadowColor = 'rgba(255,255,255,0.12)';
      ctx.shadowBlur = 12;
    }
    ctx.fillText(timerText, width / 2, height / 2);
    ctx.restore();

    // Debug: log a sample of the canvas pixel data
    const imageData = ctx.getImageData(width / 2, height / 2, 1, 1).data;
    console.log('[PiP] Center pixel RGBA:', imageData);
  };

  /**
   * Handles entering or exiting Picture-in-Picture mode for the timer using a hidden video element.
   * If pipModeEnabled is true, requests PiP on the video; otherwise, exits PiP if active.
   */
  const togglePipWindow = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) {
      console.log('[PiP] Canvas or video not found');
      return;
    }

    // Always set the canvas and video resolution to high quality
    canvas.width = PIP_WIDTH;
    canvas.height = PIP_HEIGHT;
    video.width = PIP_WIDTH;
    video.height = PIP_HEIGHT;

    // If PiP mode should be enabled
    if (settings.pipModeEnabled) {
      try {
        // Create a stream from the canvas if not already created
        if (!streamRef.current) {
          streamRef.current = canvas.captureStream();
          video.srcObject = streamRef.current;
          video.muted = true;
          video.playsInline = true;
          await video.play();
        }
        // Only request PiP if not already in PiP
        if (document.pictureInPictureElement !== video) {
          console.log('[PiP] Requesting Picture-in-Picture on video...');
          // @ts-ignore: requestPictureInPicture is not yet in TS DOM types for video
          pipWindowRef.current = await video.requestPictureInPicture();
          console.log('[PiP] Picture-in-Picture window opened');
        } else {
          console.log('[PiP] Video is already in Picture-in-Picture');
        }
      } catch (err) {
        console.error('[PiP] Failed to enter Picture-in-Picture:', err);
      }
    } else {
      // If PiP mode should be disabled and video is in PiP
      if (document.pictureInPictureElement === video) {
        try {
          console.log('[PiP] Exiting Picture-in-Picture...');
          await document.exitPictureInPicture();
          console.log('[PiP] Exited Picture-in-Picture');
        } catch (err) {
          console.error('[PiP] Failed to exit Picture-in-Picture:', err);
        }
      }
    }
  };

  /**
   * Main effect: updates the canvas with the current timer and theme, and manages PiP state.
   * Also attaches a listener to detect when the PiP window is closed manually by the user.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    // Always set the canvas and video resolution to high quality
    canvas.width = PIP_WIDTH;
    canvas.height = PIP_HEIGHT;
    video.width = PIP_WIDTH;
    video.height = PIP_HEIGHT;

    // Draw the timer with the latest values and theme (async for font loading)
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
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    // Cleanup: remove event listener and stop stream if needed
    return () => {
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
      // Stop the stream if PiP is disabled
      if (!settings.pipModeEnabled && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        video.srcObject = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeParts, settings]);

  // Return both refs for use in the main component
  return { canvasRef, videoRef };
}; 