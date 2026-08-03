import { useEffect, useRef } from 'react';

/**
 * Runs `callback` on an interval while `active` is true.
 * Clears the interval automatically on cleanup or when `active` becomes false.
 */
export function usePolling(callback: () => void, intervalMs: number, active: boolean) {
  const ref = useRef<ReturnType<typeof setInterval> | null>(null);
  const callbackRef = useRef(callback);

  // Keep the interval alive while always invoking the latest callback,
  // avoiding stale page/state values after pagination changes.
  useEffect(() => { callbackRef.current = callback; }, [callback]);

  useEffect(() => {
    if (active && !ref.current) {
      ref.current = setInterval(() => callbackRef.current(), intervalMs);
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
