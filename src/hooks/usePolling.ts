import { useEffect, useRef } from 'react';

/**
 * Runs `callback` on an interval while `active` is true.
 * Clears the interval automatically on cleanup or when `active` becomes false.
 */
export function usePolling(callback: () => void, intervalMs: number, active: boolean) {
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (active && !ref.current) {
      ref.current = setInterval(callback, intervalMs);
    }
    if (!active && ref.current) {
      clearInterval(ref.current);
      ref.current = null;
    }
    return () => {
      if (ref.current) { clearInterval(ref.current); ref.current = null; }
    };
  }, [active, intervalMs]);
}
