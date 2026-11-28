'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

type Item = { src: string; alt: string; caption: string };
type Labels = { close: string; prev: string; next: string; zoomIn: string; zoomOut: string; hint: string };

const ZOOM = 2.5;

/**
 * One full-screen viewer for every enlargeable image on a page.
 * Any element with data-zoom="<src>" (plus data-zoom-alt / data-zoom-caption)
 * inside the nearest [data-zoom-scope] opens it; the others in the same scope
 * become the previous/next images. Server-rendered pages need no client state.
 *
 * Tap or click toggles a 2.5× zoom at that point; drag (or move the mouse) to
 * travel across the weave or grain. Arrow keys, Escape and the buttons work too.
 * A larger image is requested when zoomed so close-ups stay sharp.
 */
export default function ZoomLightbox({ labels }: { labels: Labels }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [i, setI] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(null);

  const reset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const trigger = (e.target as HTMLElement).closest<HTMLElement>('[data-zoom]');
      if (!trigger) return;
      e.preventDefault();
      const scope = trigger.closest('[data-zoom-scope]') ?? document.body;
      const seen = new Set<string>();
      const list: Item[] = [];
      scope.querySelectorAll<HTMLElement>('[data-zoom]').forEach((el) => {
        const src = el.dataset.zoom!;
        if (seen.has(src)) return;
        seen.add(src);
        list.push({ src, alt: el.dataset.zoomAlt ?? '', caption: el.dataset.zoomCaption ?? '' });
      });
      setItems(list);
      setI(Math.max(0, list.findIndex((x) => x.src === trigger.dataset.zoom)));
      reset();
      dialog.current?.showModal();
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  const n = items.length;
  const go = useCallback(
    (k: number) => {
      setI((v) => (v + k + n) % n);
      reset();
    },
    [n],
  );

  /** Keep the zoomed image covering the stage (no empty edges). */
  const clamp = useCallback((x: number, y: number, z: number) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return { x, y };
    const mx = ((z - 1) * r.width) / 2;
    const my = ((z - 1) * r.height) / 2;
    return { x: Math.max(-mx, Math.min(mx, x)), y: Math.max(-my, Math.min(my, y)) };
  }, []);

  const zoomAt = (clientX: number, clientY: number) => {
    const r = stage.current?.getBoundingClientRect();
    if (!r) return;
    if (zoom > 1) return reset();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    setZoom(ZOOM);
    setPan(clamp(-dx * (ZOOM - 1), -dy * (ZOOM - 1), ZOOM));
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(1);
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === '+' || e.key === '=') {
      setZoom(ZOOM);
    }
    if (e.key === '-') reset();
  };

  const item = items[i];

  return (
    <dialog
      ref={dialog}
      className="zoombox"
      aria-label={item?.alt}
      onKeyDown={onKey}
      onClose={() => {
        reset();
      }}
    >
      {item && (
        <>
          <div
            ref={stage}
            className="zoombox__stage"
            data-zoomed={zoom > 1 || undefined}
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
              (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            }}
            onPointerMove={(e) => {
              const d = drag.current;
              if (!d || zoom === 1) return;
              const dx = e.clientX - d.x;
              const dy = e.clientY - d.y;
              if (Math.abs(dx) + Math.abs(dy) > 4) d.moved = true;
              setPan(clamp(d.px + dx, d.py + dy, zoom));
            }}
            onPointerUp={(e) => {
              const d = drag.current;
              drag.current = null;
              if (d && !d.moved) zoomAt(e.clientX, e.clientY);
            }}
            onPointerCancel={() => (drag.current = null)}
          >
            <div className="zoombox__img" style={{ transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${zoom})` }}>
              <Image key={item.src} src={item.src} alt={item.alt} fill sizes={zoom > 1 ? '250vw' : '100vw'} quality={90} draggable={false} />
            </div>
          </div>

          <div className="zoombox__bar">
            <p className="zoombox__caption">
              {item.caption && <span>{item.caption}</span>}
              <span className="zoombox__hint">{labels.hint}</span>
            </p>
            <div className="zoombox__tools">
              {n > 1 && (
                <>
                  <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label={labels.prev}>
                    <span aria-hidden="true">←</span>
                  </button>
                  <span className="zoombox__count" aria-live="polite">
                    {i + 1} / {n}
                  </span>
                  <button type="button" className="icon-btn" onClick={() => go(1)} aria-label={labels.next}>
                    <span aria-hidden="true">→</span>
                  </button>
                </>
              )}
              <button
                type="button"
                className="icon-btn"
                onClick={() => (zoom > 1 ? reset() : setZoom(ZOOM))}
                aria-label={zoom > 1 ? labels.zoomOut : labels.zoomIn}
              >
                <span aria-hidden="true">{zoom > 1 ? '−' : '+'}</span>
              </button>
              <button type="button" className="icon-btn" onClick={() => dialog.current?.close()} aria-label={labels.close}>
                <svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                  <path d="M5 5l14 14M19 5 5 19" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </dialog>
  );
}
