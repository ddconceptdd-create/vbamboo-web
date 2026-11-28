'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

export type SlideLayer = { image: string; depth: 'back' | 'front' };
export type Slide = {
  slug: string;
  href: string;
  name: string;
  tagline: string;
  count: string;
  photo: string | null;
  layers: SlideLayer[];
};

type Props = {
  slides: Slide[];
  eyebrow: string;
  title: string;
  labels: { discover: string; pause: string; play: string; hint: string };
};

/* Brand colours the background crossfades through (moss, sage, charcoal, umber, night green). */
const TONES = ['#2d3826', '#3b4633', '#2c2a25', '#4a3e2e', '#1f2b27'];
const AUTOPLAY_MS = 5000;
const STEP_MS = 1800; // tab / autoplay / keys
const SETTLE_MS = 900; // after a drag
const SPEED = { back: 0.9, f1: 1.18, f2: 1.32 } as const; // depth: how far each layer travels per slide
const MOUSE = { back: 0.008, f1: 0.03, f2: 0.045 } as const; // pointer parallax, fraction of the screen

const power4InOut = (t: number) => (t < 0.5 ? 8 * t ** 4 : 1 - (-2 * t + 2) ** 4 / 2);
const power3Out = (t: number) => 1 - (1 - t) ** 3;

const hex = (h: string) => [1, 3, 5].map((k) => parseInt(h.slice(k, k + 2), 16));
const mix = (a: string, b: string, f: number) => {
  const [x, y] = [hex(a), hex(b)];
  return `rgb(${x.map((v, k) => Math.round(v + (y[k] - v) * f)).join(' ')})`;
};

type Tween = { from: number; to: number; t0: number; dur: number; ease: (t: number) => number };

/**
 * Home-page collections: a looping vertical slider under the film.
 *
 * Each collection is a full-height scene of layered sketches: one large "back"
 * drawing behind the name and up to two "front" pieces. Layers travel at
 * different speeds as the slides move (depth) and drift with the pointer.
 * Numbered tabs on the left show a 5-second progress line, then the next
 * collection comes up. Drag (mouse), swipe sideways (touch), arrow keys or the
 * tabs move it by hand; "Discover" folds the scene into a card holding the
 * collection's opening photograph, which opens to full screen as its page loads.
 *
 * Reduced motion: no autoplay, no parallax, instant changes, direct navigation.
 */
export default function CollectionSlider({ slides, eyebrow, title, labels }: Props) {
  const n = slides.length;
  const router = useRouter();
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const bars = useRef<(HTMLSpanElement | null)[]>([]);
  type Parts = { title: HTMLElement | null; back: HTMLElement | null; f1: HTMLElement | null; f2: HTMLElement | null; slide: HTMLElement | null };
  const parts = useRef<Parts[]>([]);
  const part = (i: number) => (parts.current[i] ??= { title: null, back: null, f1: null, f2: null, slide: null });

  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [entered, setEntered] = useState(false);
  const [morph, setMorph] = useState<number | null>(null);

  // Animation state lives in refs: it changes every frame and must not re-render React.
  const s = useRef({
    pos: 0,
    target: 0,
    tween: null as Tween | null,
    drag: null as null | { x: number; y: number; pos: number; touch: boolean; moved: boolean; lastPos: number; lastT: number; v: number },
    justDragged: false,
    progress: 0,
    hold: false, // hover or focus inside
    visible: false,
    reduce: false,
    playing: true,
    mouse: { x: 0, y: 0, tx: 0, ty: 0 },
    last: 0,
    active: 0,
    entered: false,
  });

  const real = useCallback((i: number) => ((i % n) + n) % n, [n]);

  const tweenTo = useCallback((to: number, dur: number, ease: (t: number) => number) => {
    const st = s.current;
    st.progress = 0;
    if (st.reduce) {
      st.tween = null;
      st.pos = st.target = to;
      return;
    }
    st.tween = { from: st.pos, to, t0: performance.now(), dur, ease };
    st.target = to;
  }, []);

  /** Go to collection i by the shortest way round the loop. */
  const goTo = useCallback(
    (i: number) => {
      const st = s.current;
      const base = Math.round(st.tween ? st.tween.to : st.pos);
      const delta = ((((i - real(base)) % n) + n + n / 2) % n) - n / 2;
      if (!delta && !st.tween) return;
      tweenTo(base + Math.round(delta), STEP_MS, power4InOut);
    },
    [n, real, tweenTo],
  );

  /* Frame loop: position, depth, parallax, background, progress. */
  useEffect(() => {
    const st = s.current;
    st.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    const frame = (now: number) => {
      const dt = Math.min(64, now - (st.last || now));
      st.last = now;
      const el = stage.current;
      const H = el?.clientHeight ?? window.innerHeight;
      const W = el?.clientWidth ?? window.innerWidth;

      if (st.tween) {
        const t = Math.min(1, (now - st.tween.t0) / st.tween.dur);
        st.pos = st.tween.from + (st.tween.to - st.tween.from) * st.tween.ease(t);
        if (t >= 1) st.tween = null;
      } else if (st.drag) {
        st.pos += (st.target - st.pos) * 0.2;
      }

      // Pointer parallax, eased.
      const m = st.mouse;
      m.x += (m.tx - m.x) * 0.06;
      m.y += (m.ty - m.y) * 0.06;

      for (let i = 0; i < n; i++) {
        const p = parts.current[i];
        if (!p) continue;
        const d = ((((i - st.pos) % n) + n + n / 2) % n) - n / 2; // -n/2 … n/2, nearest copy
        const far = Math.abs(d) > 1.35;
        if (p.slide) p.slide.style.visibility = far ? 'hidden' : 'visible';
        if (far) continue;
        const y = d * H;
        if (p.title) {
          p.title.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
          p.title.style.opacity = String(Math.max(0, 1 - Math.abs(d) * 1.4));
        }
        (['back', 'f1', 'f2'] as const).forEach((k) => {
          const o = p[k];
          if (!o) return;
          const mx = st.reduce ? 0 : m.x * W * MOUSE[k];
          const my = st.reduce ? 0 : m.y * H * MOUSE[k];
          o.style.transform = `translate3d(${mx.toFixed(1)}px, ${(y * SPEED[k] + my).toFixed(1)}px, 0)`;
        });
      }

      // Background crossfades between the two nearest collections.
      if (root.current) {
        const a = Math.floor(st.pos);
        root.current.style.setProperty('--cs-bg', mix(TONES[real(a) % TONES.length], TONES[real(a + 1) % TONES.length], st.pos - a));
      }

      const now_ = real(Math.round(st.pos));
      if (now_ !== st.active) {
        st.active = now_;
        setActive(now_);
      }

      // Autoplay progress: runs only while the slider is on screen and left alone.
      const run = st.playing && !st.reduce && st.visible && !st.hold && !st.drag && !st.tween && !document.hidden;
      if (run) {
        st.progress += dt / AUTOPLAY_MS;
        if (st.progress >= 1) {
          st.progress = 0;
          tweenTo(Math.round(st.pos) + 1, STEP_MS, power4InOut);
        }
      }
      bars.current.forEach((b, i) => {
        if (b) b.style.transform = `scaleY(${i === st.active ? (st.reduce || !st.playing ? 1 : st.progress) : 0})`;
      });

      raf = st.visible || st.tween ? requestAnimationFrame(frame) : 0;
    };

    const io = new IntersectionObserver(
      ([e]) => {
        st.visible = e.isIntersecting;
        if (e.isIntersecting && !raf) {
          st.last = 0;
          raf = requestAnimationFrame(frame);
        }
        // Entrance: the first collection rises into place the first time the slider is seen.
        if (e.isIntersecting && e.intersectionRatio > 0.3 && !st.entered) {
          st.entered = true;
          setEntered(true);
          if (!st.reduce) {
            st.pos = Math.round(st.pos) - 0.45;
            tweenTo(Math.round(st.pos + 0.45), 2000, power3Out);
          }
        }
      },
      { threshold: [0, 0.3] },
    );
    if (root.current) io.observe(root.current);
    raf = requestAnimationFrame(frame);
    return () => {
      io.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [n, real, tweenTo]);

  useEffect(() => {
    s.current.playing = playing;
  }, [playing]);

  /* Drag (mouse: vertical, like the slides) and swipe (touch: sideways, so the page still scrolls). */
  const onPointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('a, button')) return;
    const st = s.current;
    st.tween = null;
    st.drag = { x: e.clientX, y: e.clientY, pos: st.pos, touch: e.pointerType !== 'mouse', moved: false, lastPos: st.pos, lastT: performance.now(), v: 0 };
    st.target = st.pos;
    st.progress = 0;
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const st = s.current;
    const el = stage.current;
    if (!el) return;
    if (e.pointerType === 'mouse') {
      const r = el.getBoundingClientRect();
      st.mouse.tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      st.mouse.ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }
    const d = st.drag;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved) {
      if (Math.hypot(dx, dy) < 6) return;
      if (d.touch && Math.abs(dy) > Math.abs(dx)) {
        st.drag = null; // vertical touch = page scroll
        return;
      }
      d.moved = true;
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        /* pointer already released */
      }
    }
    const pan = d.touch ? -dx / (el.clientWidth * 0.8) : -dy / el.clientHeight;
    st.target = d.pos + pan;
    const t = performance.now();
    if (t - d.lastT > 16) {
      d.v = ((st.target - d.lastPos) / (t - d.lastT)) * 1000; // slides per second
      d.lastPos = st.target;
      d.lastT = t;
    }
  };
  const onPointerUp = () => {
    const st = s.current;
    const d = st.drag;
    st.drag = null;
    if (!d || !d.moved) return;
    st.justDragged = true;
    window.setTimeout(() => (st.justDragged = false), 50);
    const pan = st.target - d.pos;
    const start = Math.round(d.pos);
    const steps = Math.abs(pan) > 0.3 || Math.abs(d.v) > 1.2 ? Math.sign(pan || d.v) * Math.max(1, Math.round(Math.abs(pan) + Math.abs(d.v) * 0.2)) : 0;
    tweenTo(start + steps, SETTLE_MS, power3Out);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    const k = e.key;
    if (k !== 'ArrowDown' && k !== 'ArrowUp' && k !== 'ArrowRight' && k !== 'ArrowLeft') return;
    if (!(e.target as HTMLElement).closest('[role="tablist"]')) return;
    e.preventDefault();
    const next = real(active + (k === 'ArrowDown' || k === 'ArrowRight' ? 1 : -1));
    goTo(next);
    root.current?.querySelector<HTMLElement>(`#cs-tab-${next}`)?.focus();
  };

  /* Discover: the scene folds into a card holding the opening photograph, the card opens to full screen, then the page changes. */
  const overlay = useRef<HTMLDivElement>(null);
  const discover = (e: React.MouseEvent, i: number) => {
    const st = s.current;
    if (st.justDragged) return e.preventDefault();
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0 || st.reduce || morph != null) return;
    e.preventDefault();
    router.prefetch(slides[i].href);
    setMorph(i);
  };

  useEffect(() => {
    if (morph == null) return;
    const el = overlay.current;
    const sec = root.current;
    if (!el || !sec) return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const r = sec.getBoundingClientRect();
    const top = Math.max(0, r.top);
    const bottom = Math.max(0, H - Math.min(H, r.bottom));
    const mobile = W <= 820 && H >= W;
    const cw = mobile ? W * 0.78 : W * 0.36;
    const ch = mobile ? H * 0.56 : H * 0.64;
    const cx = (W - cw) / 2;
    const cy = (H - ch) / 2;
    const ease = 'cubic-bezier(0.87, 0, 0.13, 1)'; // expo.inOut
    const fold = el.animate(
      [{ clipPath: `inset(${top}px 0px ${bottom}px 0px round 0px)` }, { clipPath: `inset(${cy}px ${cx}px ${cy}px ${cx}px round 6px)` }],
      { duration: 1000, easing: ease, fill: 'forwards' },
    );
    let open: Animation | null = null;
    fold.onfinish = () => {
      open = el.animate([{ clipPath: `inset(${cy}px ${cx}px ${cy}px ${cx}px round 6px)` }, { clipPath: 'inset(0px 0px 0px 0px round 0px)' }], {
        duration: 650,
        easing: 'cubic-bezier(0.7, 0, 0.2, 1)',
        fill: 'forwards',
      });
      el.dataset.phase = 'open';
      open.onfinish = () => router.push(slides[morph].href);
    };
    return () => {
      fold.cancel();
      open?.cancel();
    };
  }, [morph, router, slides]);

  return (
    <section
      ref={root}
      className="cs"
      aria-roledescription="carousel"
      aria-label={title}
      data-entered={entered || undefined}
      onMouseEnter={() => (s.current.hold = true)}
      onMouseLeave={() => {
        s.current.hold = false;
        s.current.mouse.tx = s.current.mouse.ty = 0;
      }}
      onFocus={() => (s.current.hold = true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) s.current.hold = false;
      }}
      onKeyDown={onKeyDown}
    >
      <div
        ref={stage}
        className="cs__stage"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        {slides.map((c, i) => {
          const back = c.layers.find((l) => l.depth === 'back');
          const [f1, f2] = c.layers.filter((l) => l.depth === 'front');
          const on = i === active;
          return (
            <div
              key={c.slug}
              id={`cs-slide-${i}`}
              role="tabpanel"
              aria-labelledby={`cs-tab-${i}`}
              aria-roledescription="slide"
              className="cs__slide"
              inert={!on}
              ref={(el) => {
                part(i).slide = el;
              }}
            >
              {back && (
                <div className="cs__obj cs__obj--back" ref={(el) => {
                    part(i).back = el;
                  }}>
                  <Image src={back.image} alt="" fill sizes="(min-width: 821px) 44vw, 92vw" draggable={false} />
                </div>
              )}
              <div className="cs__title" ref={(el) => {
                    part(i).title = el;
                  }}>
                <span className="cs__count">{c.count}</span>
                <h3 className="cs__name caps">{c.name}</h3>
                {c.tagline && <p className="cs__tagline">{c.tagline}</p>}
                <Link href={c.href} className="cs__discover" onClick={(e) => discover(e, i)} onMouseEnter={() => router.prefetch(c.href)}>
                  {labels.discover}
                  <span className="cs__discover-name"> {c.name}</span>
                  <span aria-hidden="true"> →</span>
                </Link>
              </div>
              {f1 && (
                <div className="cs__obj cs__obj--f1" ref={(el) => {
                    part(i).f1 = el;
                  }}>
                  <Image src={f1.image} alt="" fill sizes="(min-width: 821px) 28vw, 56vw" draggable={false} />
                </div>
              )}
              {f2 && (
                <div className="cs__obj cs__obj--f2" ref={(el) => {
                    part(i).f2 = el;
                  }}>
                  <Image src={f2.image} alt="" fill sizes="(min-width: 821px) 22vw, 44vw" draggable={false} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="cs__side">
        <span className="eyebrow cs__eyebrow">{eyebrow}</span>
        <h2 className="visually-hidden">{title}</h2>
        <div className="cs__tabs" role="tablist" aria-orientation="vertical" aria-label={title}>
          {slides.map((c, i) => (
            <button
              key={c.slug}
              id={`cs-tab-${i}`}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-controls={`cs-slide-${i}`}
              tabIndex={i === active ? 0 : -1}
              className="cs__tab"
              onClick={() => goTo(i)}
            >
              <span className="cs__bar" aria-hidden="true">
                <span ref={(el) => void (bars.current[i] = el)} />
              </span>
              <span className="cs__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="cs__tab-name">{c.name}</span>
            </button>
          ))}
        </div>
        <button type="button" className="cs__play" onClick={() => setPlaying((v) => !v)} aria-label={playing ? labels.pause : labels.play} title={playing ? labels.pause : labels.play}>
          {playing ? (
            <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3 1.5h2.6v11H3zM8.4 1.5H11v11H8.4z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 14 14" aria-hidden="true">
              <path d="M3.5 1.5v11l9-5.5z" fill="currentColor" />
            </svg>
          )}
        </button>
        <p className="visually-hidden">{labels.hint}</p>
      </div>

      {morph != null && (
        <div ref={overlay} className="cs-morph" aria-hidden="true" style={{ background: TONES[morph % TONES.length] }}>
          {slides[morph].photo && <Image src={slides[morph].photo} alt="" fill sizes="100vw" loading="eager" className="cs-morph__photo" />}
          <span className="cs-morph__name caps">{slides[morph].name}</span>
        </div>
      )}
    </section>
  );
}
