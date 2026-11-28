'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';

export type HeroPiece = { slug: string; name: string; type: string; x: number; y: number; thumb: string | null };

type Props = {
  locale: string;
  name: string;
  tagline: string;
  eyebrow: string;
  image: string | null;
  alt: string;
  position: string;
  tone: 'light' | 'dark';
  pieces: HeroPiece[];
  labels: { inFrame: string; view: string };
  badge?: React.ReactNode;
};

/**
 * Opening frame of a collection: the architectural photograph fills the screen
 * and opens out as you scroll (ScrollMotion, data-expand="hero"). The name sits
 * in the photo's negative space, and every piece in the frame is a link from the
 * very first view, as a marker on the piece and in the "In this frame" list.
 *
 * Markers are placed in % of the photograph, so they are re-projected through
 * the same "cover" crop the browser applies at each screen size.
 */
export default function CollectionHero({ locale, name, tagline, eyebrow, image, alt, position, tone, pieces, labels, badge }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const place = useCallback(
    (x: number, y: number) => {
      if (!natural || !size) return null;
      const scale = Math.max(size.w / natural.w, size.h / natural.h);
      const w = natural.w * scale;
      const h = natural.h * scale;
      const left = (size.w - w) / 2 + (x / 100) * w;
      const top = (size.h - h) / 2 + (y / 100) * h;
      // Hide markers the crop has pushed off screen (they stay in the list below).
      if (left < 24 || left > size.w - 24 || top < 72 || top > size.h - 24) return null;
      return { left, top };
    },
    [natural, size],
  );

  return (
    <section className="c-hero" data-tone={tone} aria-label={name}>
      <div className="c-hero__frame" data-expand="hero">
        <div className="c-hero__media" ref={box}>
          {image && (
            <Image
              src={image}
              alt={alt}
              fill
              sizes="100vw"
              priority
              onLoad={(e) => {
                const img = e.currentTarget;
                setNatural({ w: img.naturalWidth, h: img.naturalHeight });
              }}
            />
          )}
          <div className="c-hero__shade" data-position={position} aria-hidden="true" />
          {pieces.map((p) => {
            const at = place(p.x, p.y);
            if (!at) return null;
            return (
              <Link
                key={p.slug}
                href={`/${locale}/products/${p.slug}`}
                className="hotspot"
                style={{ left: at.left, top: at.top }}
                aria-label={`${labels.view}: ${p.name}`}
              >
                <span className="hotspot__dot" aria-hidden="true" />
                <span className="hotspot__label" aria-hidden="true">
                  <span className="hotspot__name">{p.name}</span>
                  <span className="hotspot__type">{p.type}</span>
                </span>
              </Link>
            );
          })}
        </div>

        <div className="c-hero__title container" data-position={position}>
          <p className="eyebrow c-hero__eyebrow">{eyebrow}</p>
          <h1 className="c-hero__name caps">{name}</h1>
          {tagline && <p className="c-hero__tagline">{tagline}</p>}
          {badge}
        </div>

        {pieces.length > 0 && (
          <nav className="c-hero__pieces" aria-label={labels.inFrame}>
            <span className="eyebrow c-hero__pieces-label">{labels.inFrame}</span>
            <ul>
              {pieces.map((p) => (
                <li key={p.slug}>
                  <Link href={`/${locale}/products/${p.slug}`}>
                    {p.thumb && (
                      <span className="c-hero__thumb">
                        <Image src={p.thumb} alt="" fill sizes="56px" />
                      </span>
                    )}
                    <span>
                      <span className="c-hero__piece-name">{p.name}</span>
                      <span className="c-hero__piece-cta">
                        {labels.view} <span aria-hidden="true">→</span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </div>
    </section>
  );
}
