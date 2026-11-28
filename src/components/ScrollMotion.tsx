'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Scroll-linked expansion for architectural images ([data-expand]).
 * Writes a 0 → 1 progress to the CSS variable --p; CSS turns it into a frame
 * that opens out to full bleed and a slight settle of the photograph.
 *
 *   data-expand          progress while the image enters the screen
 *   data-expand="hero"   for an opening image: progress while scrolling past its first half
 *
 * Only transform/clip-path change (no layout), one rAF per frame, visible
 * elements only. With "reduce motion" nothing runs and CSS shows images at rest.
 */
export default function ScrollMotion() {
  const pathname = usePathname();
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduce.matches) return;
    const els = Array.from(document.querySelectorAll<HTMLElement>('[data-expand]'));
    if (!els.length) return;
    const live = new Set<HTMLElement>();
    let frame = 0;

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const el of live) {
        const r = el.getBoundingClientRect();
        const p = el.dataset.expand === 'hero' ? -r.top / (r.height * 0.45) : (vh - r.top) / (vh * 0.8);
        el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(3));
      }
    };
    const request = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        const el = e.target as HTMLElement;
        if (e.isIntersecting) live.add(el);
        else live.delete(el);
      }
      request();
    });
    els.forEach((el) => {
      el.classList.add('is-expanding');
      io.observe(el);
    });
    update();
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', request);
      window.removeEventListener('resize', request);
      cancelAnimationFrame(frame);
    };
  }, [pathname]);
  return null;
}
