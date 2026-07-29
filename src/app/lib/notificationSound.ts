// Copyright (c) 2025 Alan Rodrigo Ramírez Luna (@a-ramirezzz)
// Licensed under CC BY-NC-ND 4.0 — https://creativecommons.org/licenses/by-nc-nd/4.0/
// src/app/lib/notificationSound.ts

/**
 * =================================================================
 * Notification chime (Web Audio API)
 * -----------------------------------------------------------------
 * Generates a short, pleasant two-tone "ding-ding" chime entirely in
 * code — no audio files. Web Audio oscillators are preferred over an
 * <audio> element because they:
 *   - ship zero asset bytes,
 *   - keep working in background/unfocused tabs (which throttle
 *     <audio> playback and setTimeout),
 *   - never fail on CORS, codecs, or network loading.
 *
 * This is fully independent of the ambient/background sound system,
 * so the two never interfere.
 * =================================================================
 */

// A single reused AudioContext. Creating new ones is expensive and
// browsers cap how many can exist simultaneously.
let audioContext: AudioContext | null = null;

/**
 * Returns a live, resumed AudioContext, creating one on first use.
 * Browsers suspend AudioContexts until a user gesture; the resume is
 * best-effort — by the time a timer completes the user has already
 * interacted (they started the timer), so it is normally resumable.
 */
function getAudioContext(): AudioContext {
  if (!audioContext || audioContext.state === 'closed') {
    audioContext = new AudioContext();
  }
  if (audioContext.state === 'suspended') {
    // Fire-and-forget: resume may reject if there was no user gesture.
    audioContext.resume().catch(() => {
      // Silent: the chime is a non-critical enhancement.
    });
  }
  return audioContext;
}

/**
 * Plays a pleasant ascending two-note chime.
 * @param volume - 0..1, matching the app's volume setting. Scaled down
 *                  internally so it stays comfortable at max volume.
 */
export function playNotificationSound(volume: number = 0.5): void {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    // Keep the peak gain gentle even at full volume.
    const peak = Math.max(0.0001, volume * 0.3);

    /**
     * Schedules a single sine tone with an exponential fade-out
     * envelope. exponentialRampToValueAtTime can't reach 0, so we ramp
     * to a tiny value for a natural-sounding decay.
     */
    const playTone = (frequency: number, startAt: number, duration: number) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;

      gainNode.gain.setValueAtTime(peak, startAt);
      gainNode.gain.exponentialRampToValueAtTime(0.001, startAt + duration);

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.start(startAt);
      oscillator.stop(startAt + duration);
      // No references kept — nodes auto-disconnect once stopped.
    };

    // Note 1: 830 Hz for 120ms.
    playTone(830, now, 0.12);
    // Note 2: 1050 Hz for 150ms, starting just after the first.
    playTone(1050, now + 0.13, 0.15);
  } catch {
    // Audio must never crash the app — swallow any failure.
  }
}
