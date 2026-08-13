import { useCallback, useEffect, useRef, useState } from 'react';

interface CountdownOptions {
  /** Starting duration in seconds. */
  initialSeconds: number;
  /** While false the clock freezes and keeps whatever time is left. */
  running: boolean;
  /** Fired exactly once per run when the clock reaches zero. */
  onExpire?: () => void;
  /** Fired on every whole second that ticks down, with the seconds remaining. */
  onTick?: (secondsLeft: number) => void;
}

interface Countdown {
  timeLeft: number;
  addTime: (seconds: number) => void;
  reset: (seconds?: number) => void;
}

const TICK_MS = 250;

/**
 * Deadline-based countdown.
 *
 * Timing is derived from a wall-clock deadline rather than accumulated
 * `prev - 1` steps, so pausing, adding bonus time, or a busy main thread never
 * shift the clock. Callbacks fire from the interval body (never from inside a
 * state updater), which keeps them safe under StrictMode's double invocation.
 */
export const useCountdown = ({
  initialSeconds,
  running,
  onExpire,
  onTick,
}: CountdownOptions): Countdown => {
  const [timeLeft, setTimeLeft] = useState<number>(initialSeconds);

  // Seconds banked while the clock is paused; the source of truth on resume.
  const remainingRef = useRef<number>(initialSeconds);
  const deadlineRef = useRef<number>(Date.now() + initialSeconds * 1000);
  const hasExpiredRef = useRef<boolean>(false);
  const lastTickRef = useRef<number>(initialSeconds);

  // Keep callbacks fresh without restarting the interval on every render.
  const onExpireRef = useRef(onExpire);
  const onTickRef = useRef(onTick);
  useEffect(() => {
    onExpireRef.current = onExpire;
    onTickRef.current = onTick;
  });

  useEffect(() => {
    if (!running) {
      // Bank the remaining time so a later resume picks up where we stopped.
      remainingRef.current = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
      return;
    }

    deadlineRef.current = Date.now() + remainingRef.current * 1000;

    const tick = () => {
      const secondsLeft = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      setTimeLeft(secondsLeft);

      if (secondsLeft > 0) {
        if (secondsLeft !== lastTickRef.current) {
          lastTickRef.current = secondsLeft;
          onTickRef.current?.(secondsLeft);
        }
        return;
      }

      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        onExpireRef.current?.();
      }
    };

    tick();
    const intervalId = setInterval(tick, TICK_MS);
    return () => clearInterval(intervalId);
  }, [running]);

  const addTime = useCallback((seconds: number) => {
    deadlineRef.current += seconds * 1000;
    remainingRef.current = Math.max(0, (deadlineRef.current - Date.now()) / 1000);
    setTimeLeft(Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000)));
  }, []);

  const reset = useCallback(
    (seconds?: number) => {
      const duration = seconds ?? initialSeconds;
      remainingRef.current = duration;
      deadlineRef.current = Date.now() + duration * 1000;
      hasExpiredRef.current = false;
      lastTickRef.current = duration;
      setTimeLeft(duration);
    },
    [initialSeconds]
  );

  return { timeLeft, addTime, reset };
};
