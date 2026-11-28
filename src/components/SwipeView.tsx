'use client';

import { useEffect, useRef } from 'react';

/** A horizontal swipe on a card photo flips it between studio and room views. */
export default function SwipeView() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const card = ref.current?.closest<HTMLElement>('.product-card');
    const media = ref.current?.parentElement;
    if (!card || !media) return;
    let x0: number | null = null;
    let y0 = 0;
    const start = (e: TouchEvent) => {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    };
    const end = (e: TouchEvent) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      const dy = e.changedTouches[0].clientY - y0;
      x0 = null;
      if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      const room = dx < 0;
      card.toggleAttribute('data-room', room);
      const btn = card.querySelector<HTMLButtonElement>('.card-toggle');
      if (btn && btn.getAttribute('aria-pressed') !== String(room)) btn.click();
    };
    media.addEventListener('touchstart', start, { passive: true });
    media.addEventListener('touchend', end, { passive: true });
    return () => {
      media.removeEventListener('touchstart', start);
      media.removeEventListener('touchend', end);
    };
  }, []);
  return <span ref={ref} hidden />;
}
