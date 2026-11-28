'use client';

import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import { Flip } from 'gsap/Flip';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

gsap.registerPlugin(Flip);

export type ShowcaseSlide = {
  slug: string;
  href: string;
  name: string;
  tagline: string;
  count: string;
  pieces: string[];
  image: string | null;
  focus: string;
};

type Props = {
  slides: ShowcaseSlide[];
  eyebrow: string;
  title: string;
  labels: { discover: string; pause: string; play: string; prev: string; next: string; show: string };
};

/* Motion parameters (seconds) and easing, as specified. */
const EXPAND = 0.75;
const SHIFT = 0.55;
const TEXT = 0.45;
const STAGGER = 0.06;
const AUTOPLAY = 7;
const CARDS = 3;

/** cubic-bezier(0.22, 1, 0.36, 1) as a GSAP ease function. */
const ease = (() => {
  const [x1, y1, x2, y2] = [0.22, 1, 0.36, 1];
  const bez = (t: number, a: number, b: number) => 3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  const dBez = (t: number, a: number, b: number) => 3 * a * (1 - t) ** 2 + 6 * (b - a) * t * (1 - t) + 3 * (1 - b) * t ** 2;
  return (x: number) => {
    if (x <= 0 || x >= 1) return x;
    let t = x;
    for (let i = 0; i < 8; i++) {
      const d = dBez(t, x1, x2);
      if (Math.abs(d) < 1e-6) break;
      t -= (bez(t, x1, x2) - x) / d;
    }
    return bez(Math.min(1, Math.max(0, t)), y1, y2);
  };
})();

type Slot = 'full' | 'under' | 'card' | 'park';

/**
 * Home-page collections: the active collection's catalogue photograph fills the
 * hero, the next three wait as vertical cards on the right. Every 7 seconds (or
 * on a click, the arrows, a horizontal sweep of the cursor across the cards, or
 * a swipe) the first card expands from its place to the full hero (GSAP Flip:
 * position, size, crop and corner radius together, the photo always "cover", so
 * never stretched) while the other cards slide left and the previous photograph
 * goes to the end of the loop. Titles rise through a vertical mask, staggered.
 * Navigation stays put throughout.
 *
 * The mouse wheel is never captured: the page keeps scrolling.
 * Reduced motion: no autoplay, changes are instant.
 */
export default function CollectionShowcase({ slides, eyebrow, title, labels }: Props) {
  const n = slides.length;
  const root = useRef<HTMLElement>(null);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const texts = useRef<(HTMLDivElement | null)[]>([]);
  const bar = useRef<HTMLSpanElement>(null);
  const [order, setOrder] = useState(() => slides.map((_, i) => i));
  const [under, setUnder] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const pending = useRef<{ state: Flip.FlipState; from: number; to: number } | null>(null);
  const busy = useRef(false);
  const reduce = useRef(false);
  const onScreen = useRef(false);
  const progress = useRef<gsap.core.Tween | null>(null);
  const goRef = useRef<(to: number) => void>(() => undefined);
  const scrub = useRef<{ tl: gsap.core.Timeline; x0: number; span: number; p: number; from: number; to: number } | null>(null);
  const scrubCommit = useRef(false);
  const idle = useRef(0);
  const carry = useRef<number | null>(null); // where a continuing sweep's next slot starts

  const active = order[0];

  const slotOf = (i: number): Slot => {
    if (i === under) return 'under';
    const p = order.indexOf(i);
    if (p === 0) return 'full';
    return p <= CARDS ? 'card' : 'park';
  };

  /** Run or hold the 7-second progress line, then advance. */
  const syncProgress = useCallback(() => {
    const tw = progress.current;
    if (!tw) return;
    const run = !paused && !reduce.current && onScreen.current && !busy.current && !document.hidden;
    if (run) tw.play();
    else tw.pause();
  }, [paused]);

  const restartProgress = useCallback(() => {
    progress.current?.kill();
    if (!bar.current) return;
    progress.current = gsap.fromTo(
      bar.current,
      { scaleX: 0 },
      { scaleX: 1, duration: AUTOPLAY, ease: 'none', paused: true, onComplete: () => goRef.current(-1) },
    );
    syncProgress();
  }, [syncProgress]);

  const go = useCallback(
    (to: number) => {
      // -1 = next card
      const target = to === -1 ? order[1] : to;
      if (busy.current || target == null || target === order[0]) return;
      busy.current = true;
      progress.current?.pause();
      const els = items.current.filter((e): e is HTMLDivElement => Boolean(e));
      pending.current = { state: Flip.getState(els, { props: 'borderRadius,opacity' }), from: order[0], to: target };
      const k = order.indexOf(target);
      setUnder(order[0]); // the old photograph stays underneath until the new one covers it
      setOrder([...order.slice(k), ...order.slice(0, k)]);
    },
    [order],
  );
  useEffect(() => {
    goRef.current = go;
  }, [go]);

  /* The transition itself, once React has moved every element to its new slot. */
  useLayoutEffect(() => {
    if (scrubCommit.current) {
      // A scrubbed transition just finished: drop the inline geometry (the CSS slots now match it).
      scrubCommit.current = false;
      gsap.set(items.current.filter(Boolean), { clearProps: 'zIndex,width,height,top,left,borderRadius,opacity' });
      items.current.forEach((el) => el && gsap.set(el.querySelector('.cx__card'), { clearProps: 'opacity' }));
      busy.current = false;
      restartProgress();
      return;
    }
    const job = pending.current;
    if (!job) return;
    pending.current = null;
    const m = reduce.current ? 0 : 1;
    const grow = items.current[job.to];
    const others = items.current.filter((e, i): e is HTMLDivElement => Boolean(e) && i !== job.to && i !== job.from);

    const tl = gsap.timeline({
      onComplete: () => {
        // Hand every photograph back to its CSS slot (keeps the layout responsive).
        gsap.set(items.current.filter(Boolean), { clearProps: 'zIndex,transform,width,height,top,left,borderRadius,opacity' });
        setUnder(null);
        busy.current = false;
        restartProgress();
      },
    });
    if (grow) {
      gsap.set(grow, { zIndex: 2 }); // over the old photograph, under the cards that slide left
      tl.add(Flip.from(job.state, { targets: grow, duration: EXPAND * m, ease, props: 'borderRadius,opacity', simple: true }), 0);
    }
    if (others.length) tl.add(Flip.from(job.state, { targets: others, duration: SHIFT * m, ease, props: 'borderRadius,opacity', simple: true }), 0);

    // Titles: the old lines leave upwards, the new ones rise through their masks.
    const out = texts.current[job.from];
    const inn = texts.current[job.to];
    if (out) {
      tl.to(out.querySelectorAll('[data-line]'), { yPercent: -110, duration: 0.3 * m, ease, stagger: 0.03 * m }, 0);
      tl.set(out, { autoAlpha: 0 }, 0.33 * m);
    }
    if (inn) {
      tl.set(inn, { autoAlpha: 1 }, 0);
      tl.fromTo(inn.querySelectorAll('[data-line]'), { yPercent: 110 }, { yPercent: 0, duration: TEXT * m, ease, stagger: STAGGER * m }, 0.28 * m);
    }
    // Keep the whole timeline at least as long as the expansion.
    tl.set({}, {}, EXPAND * m);
  }, [order, restartProgress]);

  /* Setup: reduced motion, first state of the texts, progress, visibility. */
  useLayoutEffect(() => {
    reduce.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    texts.current.forEach((t, i) => t && gsap.set(t, { autoAlpha: i === 0 ? 1 : 0 }));
  }, []);

  useEffect(() => {
    restartProgress();
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen.current = e.intersectionRatio >= 0.5;
        syncProgress();
      },
      { threshold: [0, 0.5] },
    );
    if (root.current) io.observe(root.current);
    const onVis = () => syncProgress();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      progress.current?.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => syncProgress(), [paused, syncProgress]);

  const next = () => go(order[1]);
  const prev = () => go(order[n - 1]);

  /*
   * Cursor scrub: moving the mouse sideways across the three cards drives the
   * next transition directly. Every pixel to the left moves the cards a pixel to
   * the left (one slot = one card width + gap) and opens the first card by the
   * same share. Past halfway, letting go (leaving the cards or pausing) lets it
   * finish; before that it slides back. Keep going and the following collection
   * starts at once, so a long sweep runs through the loop continuously.
   */

  const rectIn = (el: Element) => {
    const s = root.current!.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { left: r.left - s.left, top: r.top - s.top, width: r.width, height: r.height };
  };

  const startScrub = (x: number) => {
    if (busy.current || !root.current) return null;
    const [a, c1, c2, c3, ...rest] = order;
    const park = rest[0];
    const grow = items.current[c1];
    const e2 = items.current[c2];
    const e3 = items.current[c3];
    const ep = park == null ? null : items.current[park];
    if (!grow || !e2 || !e3) return null;
    busy.current = true;
    progress.current?.pause();
    const W = root.current.clientWidth;
    const H = root.current.clientHeight;
    const r1 = rectIn(grow);
    const r2 = rectIn(e2);
    const r3 = rectIn(e3);
    const tl = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
    gsap.set(grow, { zIndex: 2 });
    tl.fromTo(grow, { ...r1, borderRadius: 10 }, { left: 0, top: 0, width: W, height: H, borderRadius: 0, duration: 1 }, 0);
    tl.to(grow.querySelector('.cx__card'), { opacity: 0, duration: 0.3 }, 0);
    tl.fromTo(e2, { ...r2 }, { ...r1, duration: 1 }, 0);
    tl.fromTo(e3, { ...r3 }, { ...r2, duration: 1 }, 0);
    if (ep) tl.fromTo(ep, { ...rectIn(ep), opacity: 0 }, { ...r3, opacity: 1, duration: 1 }, 0);
    const out = texts.current[a];
    const inn = texts.current[c1];
    if (out) {
      tl.to(out.querySelectorAll('[data-line]'), { yPercent: -110, duration: 0.3, stagger: 0.02 }, 0);
      tl.set(out, { autoAlpha: 0 }, 0.36);
    }
    if (inn) {
      tl.set(inn, { autoAlpha: 1 }, 0.3);
      tl.fromTo(inn.querySelectorAll('[data-line]'), { yPercent: 110 }, { yPercent: 0, duration: 0.45, stagger: 0.05 }, 0.35);
    }
    tl.set({}, {}, 1);
    const span = Math.max(80, r2.left - r1.left); // one slot, in pixels
    scrub.current = { tl, x0: carry.current ?? x, span, p: 0, from: a, to: c1 };
    carry.current = null;
    return scrub.current;
  };

  /** Hand the scrubbed state over to React: the new order, CSS slots, no jump. */
  const commitScrub = () => {
    const s = scrub.current;
    if (!s) return;
    scrub.current = null;
    s.tl.kill();
    scrubCommit.current = true;
    setOrder((o) => [...o.slice(1), o[0]]);
  };

  const cancelScrub = () => {
    const s = scrub.current;
    if (!s) return;
    scrub.current = null;
    s.tl.progress(0).kill();
    gsap.set(items.current.filter(Boolean), { clearProps: 'zIndex,width,height,top,left,borderRadius,opacity' });
    items.current.forEach((el) => el && gsap.set(el.querySelector('.cx__card'), { clearProps: 'opacity' }));
    const out = texts.current[s.from];
    const inn = texts.current[s.to];
    if (out) gsap.set(out.querySelectorAll('[data-line]'), { yPercent: 0 });
    if (out) gsap.set(out, { autoAlpha: 1 });
    if (inn) gsap.set(inn, { autoAlpha: 0 });
    busy.current = false;
    restartProgress();
  };

  /** Settle: finish past halfway, otherwise slide back (spec easing). */
  const release = () => {
    window.clearTimeout(idle.current);
    carry.current = null;
    const s = scrub.current;
    if (!s) return;
    const done = s.p >= 0.5;
    const left = done ? 1 - s.tl.progress() : s.tl.progress();
    gsap.to(s.tl, {
      progress: done ? 1 : 0,
      duration: Math.max(0.25, (done ? EXPAND : SHIFT) * left),
      ease,
      overwrite: true,
      onComplete: () => (done ? commitScrub() : cancelScrub()),
    });
  };

  const onCardsMove = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse' || reduce.current) return;
    // Only over the strip of three cards (with a little margin).
    const cards = order.slice(1, 1 + CARDS).map((i) => items.current[i]);
    const first = cards[0];
    const last = cards[cards.length - 1];
    if (!first || !last || !root.current) return;
    const a = first.getBoundingClientRect();
    const b = last.getBoundingClientRect();
    const s0 = scrub.current;
    const inside = e.clientX >= a.left - 40 && e.clientX <= b.right + 40 && e.clientY >= a.top - 30 && e.clientY <= a.bottom + 30;
    if (!inside && !s0) return;
    if (!inside) return release();
    const s = s0 ?? startScrub(e.clientX);
    if (!s) return;
    const raw = (s.x0 - e.clientX) / s.span;
    if (raw >= 1) {
      // A full slot travelled: lock this one in and carry the rest of the sweep into the next.
      const x0 = s.x0 - s.span;
      s.tl.progress(1);
      commitScrub();
      carry.current = x0;
      return;
    }
    s.p = Math.max(0, raw);
    gsap.to(s.tl, {
      progress: s.p,
      duration: 0.18,
      ease: 'power2.out',
      overwrite: true,
    });
    window.clearTimeout(idle.current);
    idle.current = window.setTimeout(release, 260);
  };

  /* Swipe (touch): sideways only, so vertical swipes still scroll the page. */
  const touch = useRef<{ x: number; y: number } | null>(null);

  return (
    <section
      ref={root}
      className="cx"
      data-header-over
      aria-roledescription="carousel"
      aria-label={title}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') next();
        if (e.key === 'ArrowLeft') prev();
      }}
      onPointerDown={(e) => {
        if (e.pointerType !== 'mouse') touch.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        const t = touch.current;
        touch.current = null;
        if (!t) return;
        const dx = e.clientX - t.x;
        const dy = e.clientY - t.y;
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
          if (dx < 0) next();
          else prev();
        }
      }}
    >
      <h2 className="visually-hidden">{title}</h2>

      {/* Photographs: one element per collection, moved between slots (full / card / parked). */}
      <div className="cx__media" onPointerMove={onCardsMove} onPointerLeave={release}>
        {slides.map((s, i) => {
          const slot = slotOf(i);
          const p = order.indexOf(i);
          return (
            <div
              key={s.slug}
              ref={(el) => {
                items.current[i] = el;
              }}
              className="cx__item"
              data-slot={slot}
              style={{ '--k': slot === 'card' ? p : 0, '--focus': s.focus } as React.CSSProperties}
            >
              {s.image && <Image src={s.image} alt="" fill sizes="100vw" loading="eager" draggable={false} />}
              <span className="cx__shade" aria-hidden="true" />
              <button
                type="button"
                className="cx__card"
                tabIndex={slot === 'card' ? 0 : -1}
                aria-hidden={slot !== 'card'}
                aria-label={`${labels.show}: ${s.name}`}
                onClick={() => go(i)}
              >
                <span className="cx__card-num">{String(i + 1).padStart(2, '0')}</span>
                <span className="cx__card-name caps">{s.name}</span>
                <span className="cx__card-count">{s.count}</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Titles: all collections, the active one revealed through vertical masks. */}
      <div className="cx__texts" aria-live="polite">
        {slides.map((s, i) => (
          <div
            key={s.slug}
            ref={(el) => {
              texts.current[i] = el;
            }}
            className="cx__text"
            aria-hidden={i !== active}
          >
            <p className="cx__mask cx__eyebrow">
              <span data-line>
                {eyebrow} · {s.count}
              </span>
            </p>
            <h3 className="cx__name caps">
              {s.name.split(' ').map((w, k) => (
                <span key={k} className="cx__mask">
                  <span data-line>{w}</span>
                </span>
              ))}
            </h3>
            {s.tagline && (
              <p className="cx__mask cx__tagline">
                <span data-line>{s.tagline}</span>
              </p>
            )}
            {s.pieces.length > 0 && (
              <p className="cx__mask cx__pieces">
                <span data-line>{s.pieces.join('  ·  ')}</span>
              </p>
            )}
            <p className="cx__mask cx__cta-wrap">
              <span data-line>
                <Link href={s.href} className="cx__cta" tabIndex={i === active ? 0 : -1}>
                  {labels.discover} <span aria-hidden="true">→</span>
                </Link>
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Navigation: fixed in place through every transition. */}
      <div className="cx__nav">
        <button type="button" className="cx__btn" onClick={prev} aria-label={labels.prev}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M10 3 5 8l5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="cx__btn" onClick={next} aria-label={labels.next}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="m6 3 5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button type="button" className="cx__btn" onClick={() => setPaused((v) => !v)} aria-label={paused ? labels.play : labels.pause} title={paused ? labels.play : labels.pause}>
          {paused ? (
            <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3.5 1.5v11l9-5.5z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 1.5h2.6v11H3zM8.4 1.5H11v11H8.4z" fill="currentColor" />
            </svg>
          )}
        </button>
        <span className="cx__progress" aria-hidden="true">
          <span ref={bar} />
        </span>
        <span className="cx__counter">
          <span className="cx__counter-now">{String(active + 1).padStart(2, '0')}</span>
          <span className="cx__counter-of"> / {String(n).padStart(2, '0')}</span>
        </span>
      </div>
    </section>
  );
}
