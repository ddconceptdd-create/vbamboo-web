'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';

export type GalleryImage = { src: string; alt: string; kind: string; kindLabel: string };
type Props = { images: GalleryImage[]; labels: { prev: string; next: string; enlarge: string; close: string; gallery: string } };

/**
 * Architectural → studio → detail. Images cross-fade; supports thumbnails,
 * arrow keys, swipe, and a full-screen view for examining the bamboo closely.
 */
export default function ProductGallery({ images, labels }: Props) {
  const [i, setI] = useState(0);
  const dialog = useRef<HTMLDialogElement>(null);
  const touch = useRef<number | null>(null);
  const n = images.length;
  const go = useCallback((k: number) => setI((v) => (v + k + n) % n), [n]);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    d.addEventListener('keydown', onKey);
    return () => d.removeEventListener('keydown', onKey);
  }, [go]);

  if (!n) return null;

  return (
    <div className="gallery" role="region" aria-roledescription="carousel" aria-label={labels.gallery}>
      <div
        className="gallery__stage"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') go(1);
          if (e.key === 'ArrowLeft') go(-1);
        }}
        onTouchStart={(e) => (touch.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = e.changedTouches[0].clientX - touch.current;
          if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        {images.map((im, k) => (
          <div
            key={im.src}
            className="gallery__slide"
            data-active={k === i || undefined}
            aria-hidden={k !== i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${k + 1} / ${n}: ${im.kindLabel}`}
          >
            <Image
              src={im.src}
              alt={im.alt}
              fill
              sizes="(min-width: 1200px) 75vw, 100vw"
              loading={k === 0 ? 'eager' : 'lazy'}
              unoptimized={im.src.endsWith('.svg')}
            />
          </div>
        ))}
        <button type="button" className="gallery__zoom icon-btn" onClick={() => dialog.current?.showModal()} aria-label={labels.enlarge}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" strokeLinecap="round" />
          </svg>
        </button>
        {n > 1 && (
          <div className="gallery__arrows">
            <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label={labels.prev}>
              <span aria-hidden="true">←</span>
            </button>
            <span className="gallery__count" aria-live="polite">
              {String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
            </span>
            <button type="button" className="icon-btn" onClick={() => go(1)} aria-label={labels.next}>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        )}
      </div>

      {n > 1 && (
        <ol className="gallery__thumbs">
          {images.map((im, k) => (
            <li key={im.src}>
              <button type="button" onClick={() => setI(k)} aria-current={k === i || undefined} aria-label={`${im.kindLabel}: ${im.alt}`}>
                <span className="gallery__thumb media">
                  <Image src={im.src} alt="" fill sizes="160px" unoptimized={im.src.endsWith('.svg')} />
                </span>
                <span className="gallery__thumb-label">{im.kindLabel}</span>
              </button>
            </li>
          ))}
        </ol>
      )}

      <dialog ref={dialog} className="lightbox" aria-label={images[i].alt} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <div className="lightbox__img">
          <Image src={images[i].src} alt={images[i].alt} fill sizes="100vw" unoptimized={images[i].src.endsWith('.svg')} />
        </div>
        <button type="button" className="lightbox__close icon-btn" onClick={() => dialog.current?.close()} aria-label={labels.close}>
          <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path d="M5 5l14 14M19 5 5 19" strokeLinecap="round" />
          </svg>
        </button>
        {n > 1 && (
          <div className="lightbox__nav">
            <button type="button" className="icon-btn" onClick={() => go(-1)} aria-label={labels.prev}>←</button>
            <button type="button" className="icon-btn" onClick={() => go(1)} aria-label={labels.next}>→</button>
          </div>
        )}
      </dialog>
    </div>
  );
}
