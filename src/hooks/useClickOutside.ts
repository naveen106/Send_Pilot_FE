import { useEffect, RefObject } from 'react';

/**
 * Calls `handler` when a mousedown event occurs outside of `ref`.
 * Used to close dropdowns and menus when clicking away.
 */
export function useClickOutside<T extends HTMLElement>(ref: RefObject<T | null>, handler: () => void) {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler();
    }
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [handler]);
}
