import { useState } from 'react';

export function useSelection<T extends { id: number }>(items: T[]) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  function toggle(id: number) {
    setSelected((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }

  function toggleAll() {
    setSelected((prev) => prev.size === items.length && items.length > 0 ? new Set() : new Set(items.map((i) => i.id)));
  }

  function clear() { setSelected(new Set()); }

  return {
    selected,
    toggle,
    toggleAll,
    clear,
    allSelected: items.length > 0 && selected.size === items.length,
    someSelected: selected.size > 0,
  };
}
