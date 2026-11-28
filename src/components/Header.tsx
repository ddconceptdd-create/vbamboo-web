'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Dict, Locale } from '@/i18n';
import type { SearchItem } from '@/lib/content';
import LanguageSwitch from './LanguageSwitch';
import SearchDialog from './SearchDialog';

type Props = { locale: Locale; dict: Dict['nav']; searchDict: Dict['search']; index: SearchItem[] };

/**
 * Solid ivory header on every page (DD, 28 Nov): logo left, the five sections,
 * language and search on the right. The logo is the way home, so there is no
 * separate Home item.
 */

export default function Header({ locale, dict, searchDict, index }: Props) {
  const pathname = usePathname() || `/${locale}`;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
  }

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? 'hidden' : '';
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // "/" opens search from anywhere (except while typing).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Home opens on the full-screen film: logo and menu sit on the film (transparent),
  // and the ivory bar fills in once the visitor scrolls.
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`;
  const overFilm = isHome && !scrolled && !menuOpen;
  const items = [
    { href: `/${locale}/about`, label: dict.about },
    { href: `/${locale}/products`, label: dict.products },
    { href: `/${locale}/collections`, label: dict.collections },
    { href: `/${locale}/stores`, label: dict.stores },
    { href: `/${locale}/contact`, label: dict.contact },
  ];
  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <>
      <header
        className="site-header"
        data-scrolled={scrolled || undefined}
        data-over={overFilm || undefined}
        data-menu={menuOpen || undefined}
      >
        <div className="site-header__inner container">
          <Link
            href={`/${locale}`}
            className="site-header__brand"
            aria-label={`VBamboo · ${dict.home}`}
            onClick={(e) => {
              // From anywhere, the logo returns to the opening film; on the home page itself, scroll back up.
              if (isHome) {
                e.preventDefault();
                setMenuOpen(false);
                window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
              }
            }}
          >
            {/* The supplied artwork in its original bamboo yellow, on every page (DD, 28 Nov). */}
            <span className="logo site-header__logo" aria-hidden="true" />
          </Link>

          <nav className="site-nav" aria-label="Primary">
            <ul>
              {items.map((it) => (
                <li key={it.href}>
                  <Link href={it.href} aria-current={isActive(it.href) ? 'page' : undefined}>
                    {it.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="site-header__tools">
            <LanguageSwitch locale={locale} label={dict.language} />
            <button
              type="button"
              className="icon-btn site-header__search-m"
              onClick={() => setSearchOpen(true)}
              aria-label={dict.search}
            >
              <SearchIcon />
            </button>
            <button
              type="button"
              className="menu-btn"
              aria-expanded={menuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <span className="visually-hidden">{menuOpen ? dict.close : dict.menu}</span>
              <span className="menu-btn__bars" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      <div id="mobile-menu" className="mobile-menu woven" data-open={menuOpen || undefined} hidden={!menuOpen} aria-label="Menu">
        <nav aria-label="Mobile">
          <ul>
            {items.map((it, i) => (
              <li key={it.href} style={{ '--i': i } as React.CSSProperties}>
                <Link href={it.href} aria-current={isActive(it.href) ? 'page' : undefined}>
                  {it.label}
                </Link>
              </li>
            ))}
            <li style={{ '--i': items.length } as React.CSSProperties}>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSearchOpen(true);
                }}
              >
                {dict.search}
              </button>
            </li>
          </ul>
        </nav>
        <span className="logo mobile-menu__logo" aria-hidden="true" />
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} locale={locale} dict={searchDict} index={index} />
    </>
  );
}

export function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5 21 21" strokeLinecap="round" />
    </svg>
  );
}
