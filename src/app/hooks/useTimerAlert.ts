/**
 * =================================================================
 * src/app/hooks/useTimerAlert.ts
 * -----------------------------------------------------------------
 * This custom hook encapsulates the logic for alerting the user
 * when a timer session finishes. It handles both audio and native
 * browser notifications.
 * =================================================================
 */

// =================================================================
// SECTION: Imports
// =================================================================

import { useRef, useCallback, useEffect } from 'react';

// =================================================================
// SECTION: Hook Definition
// =================================================================

/**
 * A custom hook to manage user alerts (sound and notifications) for the timer.
 * @returns {object} An object containing the `triggerAlert` function.
 */
export const useTimerAlert = () => {
  // -----------------------------------------------------------------
  // State and Refs
  // We use refs to store instances that should persist across renders
  // without causing re-renders themselves (like audio elements or timers).
  // -----------------------------------------------------------------

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const notificationRef = useRef<Notification | null>(null);
  const soundTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // -----------------------------------------------------------------
  // Memoized Functions
  // Using useCallback to ensure these functions have a stable identity
  // across renders, preventing unnecessary re-renders.
  // -----------------------------------------------------------------
  
  /**
   * Stops all alert activities: pauses the sound and clears any pending playback.
   */
  const stopAlert = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (soundTimeoutRef.current) {
      clearTimeout(soundTimeoutRef.current);
    }
  }, []);

  /**
   * Shows a native browser notification.
   */
  const showNotification = useCallback(() => {
    const notificationTitle = '¡Tiempo cumplido!';
    const notificationOptions: NotificationOptions = {
      body: 'Tu sesión de productividad ha finalizado.',
      icon: '/favicon.ico',
    };

    notificationRef.current = new Notification(notificationTitle, notificationOptions);

    // Add event listeners to stop the sound if the user interacts with the notification.
    notificationRef.current.onclick = () => {
      stopAlert();
      notificationRef.current?.close();
    };
    notificationRef.current.onclose = () => {
      stopAlert();
    };
  }, [stopAlert]);
  
  /**
   * Plays the alert sound a fixed number of times with a delay.
   * This uses chained setTimeouts for a more robust sequence than setInterval.
   */
  const playSound = useCallback(() => {
    // Ensure the audio element exists, creating it on the first play.
    if (!audioRef.current) {
      audioRef.current = new Audio('/simple-notification-152054.mp3');
    }

    stopAlert(); // Stop any previous alert before starting a new one.

    const maxPlays = 3;
    const delay = 2500; // 2.5 seconds between plays

    const playRepeatedly = (playCount: number) => {
      if (playCount <= 0) return;

      audioRef.current?.play().catch(e => console.error("Error playing audio:", e));
      
      // Schedule the next play.
      soundTimeoutRef.current = setTimeout(() => {
        playRepeatedly(playCount - 1);
      }, delay);
    };

    playRepeatedly(maxPlays);
  }, [stopAlert]);

  /**
   * The main function exposed by the hook. It coordinates playing the
   * sound and showing the notification, handling permissions as needed.
   */
  const triggerAlert = useCallback(async () => {
    playSound();

    if (Notification.permission === 'granted') {
      showNotification();
    } else if (Notification.permission !== 'denied') {
      // If we don't have permission yet, request it.
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        showNotification();
      }
    }
  }, [playSound, showNotification]);
  
  // -----------------------------------------------------------------
  // Lifecycle Management
  // -----------------------------------------------------------------
  
  /**
   * Effect to clean up any running alerts when the component that
   * uses this hook unmounts. This is crucial to prevent memory leaks
   * and "ghost" sounds.
   */
  useEffect(() => {
    // The returned function is the cleanup function.
    return () => {
      stopAlert();
    };
  }, [stopAlert]); // Dependency on stopAlert ensures cleanup has access to the latest function.

  // -----------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------

  return { triggerAlert };
};
