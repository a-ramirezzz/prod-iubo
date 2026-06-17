// src/app/hooks/useHorizontalPipTimer.ts
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TimeParts } from '@/types/index';

interface UseHorizontalPipTimerOptions {
  onPipModeDisabled?: () => void;
}

// Best-effort initial size hint passed to requestWindow(). Chrome may or may
// not honor it exactly — the layout below is fully responsive regardless.
// Chrome does not support programmatic resize of Document PiP windows (resizeTo is a no-op);
// the layout must instead be fully responsive to whatever size Chrome assigns or the user sets manually.
const DEFAULT_WIDTH = 420;
const DEFAULT_HEIGHT = 220;

/**
 * useHorizontalPipTimer
 *
 * Opens a horizontal floating timer using the Document Picture-in-Picture API
 * (window.documentPictureInPicture), as an alternative to the canvas/video
 * based usePipTimer hook. Renders real HTML via a React portal into the
 * PiP window's own document, instead of drawing to a canvas.
 *
 * Only supported in Chromium-based desktop browsers (Chrome/Edge).
 *
 * @param enabled - whether the horizontal PiP window should be open.
 * @param timeParts - the current timer values (hours, minutes, seconds).
 * @param isActive - whether the timer is currently running.
 * @param currentTaskText - optional name of the active task to display.
 * @param themeMode - the app's current dark/light setting, used to pick the
 *   color palette (same source as the canvas PiP's themeMode read).
 */
export const useHorizontalPipTimer = (
  enabled: boolean,
  timeParts: TimeParts,
  isActive: boolean,
  currentTaskText: string | undefined,
  themeMode?: string,
  options?: UseHorizontalPipTimerOptions
) => {
  const pipWindowRef = useRef<Window | null>(null);
  const portalContainerRef = useRef<HTMLDivElement | null>(null);
  const [portalNode, setPortalNode] = useState<HTMLDivElement | null>(null);

  // Feature detection: Document PiP is only available in Chromium desktop browsers.
  const isSupported =
    typeof window !== 'undefined' && 'documentPictureInPicture' in window;

  useEffect(() => {
    if (!isSupported) return;

    // Fires when the user closes the PiP window manually.
    const handlePageHide = () => {
      pipWindowRef.current = null;
      setPortalNode(null);
      if (options && typeof options.onPipModeDisabled === 'function') {
        options.onPipModeDisabled();
      }
    };

    const openPipWindow = async () => {
      // @ts-expect-error - documentPictureInPicture is not yet in TS lib types
      const pipWindow: Window = await window.documentPictureInPicture.requestWindow({
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
      });
      pipWindowRef.current = pipWindow;

      // The PiP window starts with a blank document, so styles must be
      // injected directly rather than relying on the app's stylesheet.
      // Two palettes are exposed as CSS variables on [data-theme], toggled
      // from the effect below without needing to recreate the window.
      const style = pipWindow.document.createElement('style');
      style.textContent = `
        :root[data-theme='dark'] {
          --pip-bg: #0a0a0a;
          --pip-text: #ffffff;
          --pip-text-secondary: #888888;
          --pip-divider: rgba(255, 255, 255, 0.1);
        }
        :root[data-theme='light'] {
          --pip-bg: #fafafa;
          --pip-text: #111111;
          --pip-text-secondary: #777777;
          --pip-divider: rgba(0, 0, 0, 0.1);
        }
        html, body {
          margin: 0;
          height: 100%;
          background: var(--pip-bg);
          overflow: hidden;
        }
        #pip-root {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          width: 100%;
          box-sizing: border-box;
          padding: clamp(4px, 2vh, 16px) clamp(8px, 4vw, 24px);
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          overflow: hidden;
        }
        .pip-time-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex: 1;
          width: 100%;
          min-height: 0;
        }
        .pip-time-unit {
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: clamp(1.5rem, 22vh, 12rem);
          font-weight: 600;
          letter-spacing: 0.06em;
          line-height: 1;
          white-space: nowrap;
          color: var(--pip-text);
        }
        .pip-divider {
          width: 40%;
          height: 1px;
          background: var(--pip-divider);
          margin: clamp(4px, 1vh, 10px) 0;
          flex-shrink: 0;
        }
        .pip-meta {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: clamp(6px, 2vw, 16px);
          width: 100%;
        }
        .pip-status {
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: clamp(0.6rem, 2.2vh, 1rem);
          font-weight: 400;
          letter-spacing: 0.04em;
          color: var(--pip-text-secondary);
          white-space: nowrap;
        }
        .pip-task {
          font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
          font-size: clamp(0.6rem, 2.2vh, 1rem);
          font-weight: 400;
          letter-spacing: 0.04em;
          color: var(--pip-text-secondary);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 60%;
        }
      `;
      pipWindow.document.head.appendChild(style);

      pipWindow.document.documentElement.setAttribute(
        'data-theme',
        themeMode === 'light' ? 'light' : 'dark'
      );

      const root = pipWindow.document.createElement('div');
      root.id = 'pip-root';
      pipWindow.document.body.appendChild(root);
      portalContainerRef.current = root;
      setPortalNode(root);

      pipWindow.addEventListener('pagehide', handlePageHide);
    };

    const closePipWindow = () => {
      const pipWindow = pipWindowRef.current;
      if (pipWindow) {
        pipWindow.removeEventListener('pagehide', handlePageHide);
        pipWindow.close();
        pipWindowRef.current = null;
      }
      setPortalNode(null);
    };

    if (enabled && !pipWindowRef.current) {
      openPipWindow().catch(err => {
        console.error('[HorizontalPiP] Failed to open Document PiP window:', err);
      });
    } else if (!enabled && pipWindowRef.current) {
      closePipWindow();
    }

    // Cleanup on unmount or before the next run of this effect.
    return () => {
      const pipWindow = pipWindowRef.current;
      if (pipWindow) {
        pipWindow.removeEventListener('pagehide', handlePageHide);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isSupported]);

  // Keeps the HUD palette in sync if the app's theme mode changes while the
  // PiP window is already open, without needing to recreate the window.
  useEffect(() => {
    const pipWindow = pipWindowRef.current;
    if (pipWindow) {
      pipWindow.document.documentElement.setAttribute(
        'data-theme',
        themeMode === 'light' ? 'light' : 'dark'
      );
    }
  }, [themeMode, portalNode]);

  // Closes the window fully on unmount, regardless of `enabled`.
  useEffect(() => {
    return () => {
      if (pipWindowRef.current) {
        pipWindowRef.current.close();
        pipWindowRef.current = null;
      }
    };
  }, []);

  const portal =
    portalNode &&
    createPortal(
      <>
        <div className="pip-time-stack">
          <span className="pip-time-unit">{timeParts.hours}</span>
          <span className="pip-time-unit">{timeParts.minutes}</span>
          <span className="pip-time-unit">{timeParts.seconds}</span>
        </div>
        <div className="pip-divider" />
        <div className="pip-meta">
          <span className="pip-status">{isActive ? 'En curso' : 'En pausa'}</span>
          {currentTaskText && <span className="pip-task">{currentTaskText}</span>}
        </div>
      </>,
      portalNode
    );

  return { isSupported, portal };
};
