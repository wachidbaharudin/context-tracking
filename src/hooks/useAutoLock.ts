import { useEffect, useRef, useCallback } from 'react';

/** Events that reset the inactivity timer */
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousedown',
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
  'click',
];

interface UseAutoLockOptions {
  /** Timeout in minutes. 0 = disabled. */
  timeoutMinutes: number;
  /** Callback when auto-lock triggers */
  onLock: () => void;
  /** Whether the auto-lock is active (e.g., only when unlocked) */
  enabled: boolean;
}

/**
 * Auto-lock hook: locks the app after a period of user inactivity.
 *
 * Monitors user interactions (mouse, keyboard, touch, scroll) and
 * triggers the onLock callback after timeoutMinutes of inactivity.
 *
 * @param options - Configuration for auto-lock behavior
 */
export function useAutoLock({ timeoutMinutes, onLock, enabled }: UseAutoLockOptions): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onLockRef = useRef(onLock);

  // Keep the callback ref up to date
  useEffect(() => {
    onLockRef.current = onLock;
  }, [onLock]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (timeoutMinutes <= 0) return;

    const timeoutMs = timeoutMinutes * 60 * 1000;
    timerRef.current = setTimeout(() => {
      console.log(`[AutoLock] Locking after ${timeoutMinutes} minutes of inactivity`);
      onLockRef.current();
    }, timeoutMs);
  }, [timeoutMinutes]);

  useEffect(() => {
    if (!enabled || timeoutMinutes <= 0) {
      // Clean up any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // Start the initial timer
    resetTimer();

    // Reset timer on any user activity
    const handleActivity = () => {
      resetTimer();
    };

    for (const event of ACTIVITY_EVENTS) {
      window.addEventListener(event, handleActivity, { passive: true });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      for (const event of ACTIVITY_EVENTS) {
        window.removeEventListener(event, handleActivity);
      }
    };
  }, [enabled, timeoutMinutes, resetTimer]);
}
