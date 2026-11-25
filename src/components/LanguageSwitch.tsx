'use client';

import { usePathname, useRouter } from 'next/navigation';
import { LOCALES, type Locale } from '@/i18n';

/**
 * Switches language while staying on the same page AND the same product
 * version: the query string (e.g. ?finish=natural&fabric=sand-linen) and hash are kept.
 */
export default function LanguageSwitch({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname() || `/${locale}`;
  const router = useRouter();

  const hrefFor = (l: Locale) => pathname.replace(/^\/(vi|en)(?=\/|$)/, `/${l}`);

  return (
    <div className="lang-switch" role="group" aria-label={label}>
      {LOCALES.map((l) => (
        <a
          key={l}
          href={hrefFor(l)}
          lang={l}
          hrefLang={l}
          aria-current={l === locale ? 'true' : undefined}
          onClick={(e) => {
            e.preventDefault();
            if (l === locale) return;
            router.push(hrefFor(l) + window.location.search + window.location.hash, { scroll: false });
          }}
        >
          {l.toUpperCase()}
        </a>
      ))}
    </div>
  );
}
