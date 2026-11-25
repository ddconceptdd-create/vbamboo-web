'use client';

import { useSyncExternalStore } from 'react';

/**
 * The selected product version lives in the URL (?finish=…&fabric=…), so it
 * survives reloads, can be shared, and is kept when switching language.
 */
export type Selection = { finish: string | null; fabric: string | null };

const EVENT = 'vb:selection';

const read = (): string => (typeof window === 'undefined' ? '' : window.location.search);

const subscribe = (cb: () => void) => {
  window.addEventListener(EVENT, cb);
  window.addEventListener('popstate', cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener('popstate', cb);
  };
};

export function useSelection(defaults: Selection): Selection {
  const search = useSyncExternalStore(subscribe, read, () => '');
  const sp = new URLSearchParams(search);
  return { finish: sp.get('finish') ?? defaults.finish, fabric: sp.get('fabric') ?? defaults.fabric };
}

export function setSelection(next: Partial<Selection>) {
  const url = new URL(window.location.href);
  for (const [k, v] of Object.entries(next)) {
    if (v) url.searchParams.set(k, v);
    else url.searchParams.delete(k);
  }
  window.history.replaceState(window.history.state, '', url);
  window.dispatchEvent(new Event(EVENT));
}
