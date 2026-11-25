'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Dict, Locale } from '@/i18n';
import type { SearchItem } from '@/lib/content';

/** Lowercase and strip Vietnamese diacritics so "ghe" finds "Ghế". */
const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd');

type Props = { open: boolean; onClose: () => void; locale: Locale; dict: Dict['search']; index: SearchItem[] };

export default function SearchDialog({ open, onClose, locale, dict, index }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      d.showModal();
      requestAnimationFrame(() => inputRef.current?.focus());
    } else if (!open && d.open) d.close();
  }, [open]);

  const prepared = useMemo(() => index.map((it) => ({ ...it, n: norm(`${it.title} ${it.terms}`), nt: norm(it.title) })), [index]);
  const results = useMemo(() => {
    const words = norm(q).split(/\s+/).filter(Boolean);
    if (!words.length) return prepared.filter((i) => i.kind === 'collection').concat(prepared.filter((i) => i.kind === 'product').slice(0, 4));
    const score = (it: (typeof prepared)[number]) => words.filter((w) => it.nt.includes(w)).length;
    return prepared
      .filter((it) => words.every((w) => it.n.includes(w)))
      .sort((a, b) => score(b) - score(a))
      .slice(0, 12);
  }, [q, prepared]);

  const href = (it: SearchItem) => `/${locale}/${it.kind === 'product' ? 'products' : 'collections'}/${it.slug}`;

  return (
    <dialog
      ref={ref}
      className="search-dialog"
      aria-label={dict.title}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      <div className="search-dialog__panel">
        <div className="search-dialog__bar container">
          <label htmlFor="site-search" className="visually-hidden">
            {dict.title}
          </label>
          <input
            ref={inputRef}
            id="site-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={dict.placeholder}
            autoComplete="off"
            enterKeyHint="search"
          />
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="22" height="22" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
              <path d="M5 5l14 14M19 5 5 19" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className="search-dialog__results container" aria-live="polite">
          {!q && <p className="eyebrow">{dict.hint}</p>}
          {results.length === 0 ? (
            <p className="search-dialog__empty">{dict.empty}</p>
          ) : (
            <ul>
              {results.map((it) => (
                <li key={it.kind + it.slug}>
                  <Link href={href(it)} onClick={onClose}>
                    <span className="search-dialog__thumb media">
                      {it.image && <Image src={it.image} alt="" fill sizes="96px" unoptimized={it.image.endsWith('.svg')} />}
                    </span>
                    <span>
                      <span className="search-dialog__kind">{it.kind === 'product' ? dict.products : dict.collections}</span>
                      <span className="search-dialog__title">{it.title}</span>
                      {it.sub && <span className="search-dialog__sub">{it.sub}</span>}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </dialog>
  );
}
