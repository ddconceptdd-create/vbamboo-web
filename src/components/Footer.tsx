import Link from 'next/link';
import { getDict, t, CATEGORIES, type Locale } from '@/i18n';
import type { getSite } from '@/lib/content';

type Site = Awaited<ReturnType<typeof getSite>>;

export default function Footer({ locale, site, categories }: { locale: Locale; site: Site; categories: string[] }) {
  const d = getDict(locale);
  const year = new Date().getFullYear();
  return (
    <footer className="site-footer woven">
      <div className="container site-footer__grid">
        <div className="site-footer__brand">
          <Link href={`/${locale}`} aria-label="VBamboo">
            <span className="logo site-footer__logo" aria-hidden="true" />
          </Link>
          <p>{d.footer.tagline}</p>
        </div>

        <nav className="site-footer__col" aria-label={d.footer.explore}>
          <h2 className="eyebrow">{d.footer.explore}</h2>
          <ul>
            <li><Link href={`/${locale}/about`}>{d.nav.about}</Link></li>
            <li><Link href={`/${locale}/products`}>{d.nav.products}</Link></li>
            <li><Link href={`/${locale}/collections`}>{d.nav.collections}</Link></li>
            <li><Link href={`/${locale}/stores`}>{d.nav.stores}</Link></li>
            <li><Link href={`/${locale}/contact`}>{d.nav.contact}</Link></li>
          </ul>
        </nav>

        <nav className="site-footer__col" aria-label={d.nav.products}>
          <h2 className="eyebrow">{d.nav.products}</h2>
          <ul className="site-footer__cats">
            {CATEGORIES.filter((c) => categories.includes(c.slug)).map((c) => (
              <li key={c.slug}>
                <Link href={`/${locale}/products?category=${c.slug}`}>{c[locale]}</Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="site-footer__col">
          <h2 className="eyebrow">{d.contact.direct}</h2>
          <address>
            {site?.address && <p style={{ whiteSpace: 'pre-line' }}>{t(site.address, locale)}</p>}
            {site?.email && <p><a href={`mailto:${site.email}`}>{site.email}</a></p>}
            {site?.phone && <p><a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a></p>}
          </address>
          <ul className="site-footer__social">
            {site?.instagram && <li><a href={site.instagram} rel="noopener" target="_blank">Instagram</a></li>}
            {site?.facebook && <li><a href={site.facebook} rel="noopener" target="_blank">Facebook</a></li>}
            {site?.linkedin && <li><a href={site.linkedin} rel="noopener" target="_blank">LinkedIn</a></li>}
          </ul>
        </div>
      </div>
      <div className="container site-footer__base">
        <span>© {year} VBamboo. {d.footer.rights}</span>
        <span>{site?.footerNote ? t(site.footerNote, locale) : null}</span>
      </div>
    </footer>
  );
}
