'use client';

import { useEffect, useRef } from 'react';

const MIN_MS = 1400; // how long the logo stays at least
const MAX_MS = 3200; // never longer, even on a slow connection
const FADE_MS = 800;

/**
 * Opening screen: the woven green ground with the gold VBamboo logo, as on the
 * catalogue. Shown once per visit (sessionStorage), then it fades away to the
 * page. The markup is server-rendered so it is the very first thing painted; a
 * script in <head> hides it before paint on later pages of the same visit.
 * Reduced motion: a short, still display with no fade.
 */
export default function Splash() {
  const el = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = el.current;
    const root = document.documentElement;
    if (!node || !root.hasAttribute('data-splash')) return;
    try {
      sessionStorage.setItem('vb-splash', '1');
    } catch {
      /* storage blocked: the splash simply shows again next time */
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = performance.now();
    let done = false;
    const timers: number[] = [];
    const finish = () => {
      if (done) return;
      done = true;
      const wait = Math.max(0, (reduce ? 600 : MIN_MS) - (performance.now() - start));
      timers.push(
        window.setTimeout(() => {
          node.dataset.leaving = '';
          timers.push(window.setTimeout(() => root.removeAttribute('data-splash'), reduce ? 0 : FADE_MS));
        }, wait),
      );
    };
    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish, { once: true });
    timers.push(window.setTimeout(finish, MAX_MS));
    return () => {
      window.removeEventListener('load', finish);
      timers.forEach(clearTimeout);
      root.removeAttribute('data-splash');
    };
  }, []);

  return (
    <div ref={el} className="splash woven" aria-hidden="true">
      <span className="splash__logo" />
    </div>
  );
}
