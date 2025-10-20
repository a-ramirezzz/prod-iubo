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
 * For animated themes, it uses the background video as the PiP source.
 *
 * @param {object} timeParts - The current timer values (hours, minutes, seconds).
 * @param {object} settings - The user settings, including PiP mode toggle and theme.
 * @returns {object} - { canvasRef, videoRef } to be attached to canvas and video elements.
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
  // Ref to track the background video element for animated themes
  const backgroundVideoRef = useRef<HTMLVideoElement | null>(null);

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
    await ensureAntonFontLoaded();
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    // Determine background and text color based on theme mode
    let backgroundColor = '#000';
    let textColor = '#fff';
    if (settings.themeMode === 'light') {
      backgroundColor = '#fff';
      textColor = '#111';
    }
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    const timerText = `${timeParts.hours}:${timeParts.minutes}:${timeParts.seconds}`;
    const fontSize = Math.floor(height * 0.4);
    ctx.font = `bold ${fontSize}px Anton, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = textColor;
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
    if (settings.pipModeEnabled) {
      try {
        if (!streamRef.current) {
          streamRef.current = canvas.captureStream();
          video.srcObject = streamRef.current;
          video.muted = true;
          video.playsInline = true;
          await video.play();
        }
        if (document.pictureInPictureElement !== video) {
          console.log('[PiP] Requesting Picture-in-Picture on video...');
          // @ts-expect-error - requestPictureInPicture is not fully typed in TypeScript
          pipWindowRef.current = await video.requestPictureInPicture();
          console.log('[PiP] Picture-in-Picture window opened');
        } else {
          console.log('[PiP] Video is already in Picture-in-Picture');
        }
      } catch (err) {
        console.error('[PiP] Failed to enter Picture-in-Picture:', err);
      }
    } else {
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
    const backgroundVideo = backgroundVideoRef.current;
    if (!canvas || !video) return;

    // Always set the canvas and video resolution to high quality
    canvas.width = PIP_WIDTH;
    canvas.height = PIP_HEIGHT;
    video.width = PIP_WIDTH;
    video.height = PIP_HEIGHT;

    // Draw the timer with the latest values and theme
    const ctx = canvas.getContext('2d');
    if (ctx) {
      drawTimer(ctx, timeParts);
    }

    // Handle PiP window state
    togglePipWindow();

    // Handler for PiP window close event
    const handleLeavePiP = () => {
      if (options && typeof options.onPipModeDisabled === 'function') {
        options.onPipModeDisabled();
      }
    };
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    // Cleanup: remove event listener and stop stream if needed
    return () => {
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
      if (!settings.pipModeEnabled && streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
        video.srcObject = null;
      }      
      if (backgroundVideo) {
        backgroundVideo.pause();
        backgroundVideo.src = '';
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeParts, settings]);

  // Return both refs for use in the main component
  return { canvasRef, videoRef, backgroundVideoRef };
}; 