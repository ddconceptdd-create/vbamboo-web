import type { Metadata } from 'next';
import Link from 'next/link';
import Media from '@/components/Media';
import { getDict, t, type Locale } from '@/i18n';
import { getCollections, getProducts } from '@/lib/content';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(locale).collections.title };
}

export default async function CollectionsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale);
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);
  return (
    <div className="page-enter">
      <header className="page-head container">
        <span className="eyebrow" data-reveal>VBamboo</span>
        <h1 className="page-head__title" data-reveal>{d.collections.title}</h1>
        <p className="lead page-head__lead" data-reveal style={{ '--d': '100ms' } as React.CSSProperties}>{d.collections.lead}</p>
      </header>
      <ul className="container collections-index">
        {collections.map((c, i) => (
          <li key={c.slug}>
            <Link href={`/${locale}/collections/${c.slug}`} className="collections-index__item">
              <Media src={c.heroImage} alt={t(c.heroAlt, locale)} ratio="21 / 9" sizes="(min-width: 1440px) 1328px, 100vw" reveal priority={i === 0} />
              <div className="collections-index__text" data-reveal>
                <span className="eyebrow">{d.common.pieces(products.filter((p) => p.collection === c.slug).length)}</span>
                <h2 className="caps collections-index__name">{c.name}</h2>
                <p className="prose">{t(c.tagline, locale)}</p>
                <span className="link-line">{d.common.exploreCollection} <span className="arrow" aria-hidden="true">→</span></span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
