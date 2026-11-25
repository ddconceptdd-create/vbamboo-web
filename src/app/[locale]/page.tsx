import Link from 'next/link';
import Media from '@/components/Media';
import HeroImage from '@/components/HeroImage';
import ProductCard from '@/components/ProductCard';
import { getDict, t, type Locale } from '@/i18n';
import { getCollections, getHome, getProducts, toCard } from '@/lib/content';

export default async function HomePage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale);
  const [home, products, collections] = await Promise.all([getHome(), getProducts(), getCollections()]);
  const heroCollection = collections.find((c) => c.slug === home?.heroCollection) ?? collections[0];
  const featured = products.filter((p) => p.featured).slice(0, 6);
  const curated = (featured.length ? featured : products.slice(0, 6)).map((p) => toCard(p, locale, collections));
  const count = (slug: string) => products.filter((p) => p.collection === slug).length;

  return (
    <div className="page-enter">
      {/* 1 — Signature piece in an architectural space */}
      <section className="hero" aria-label={heroCollection?.name}>
        <div className="hero__media">
          <HeroImage src={home?.heroImage ?? heroCollection?.heroImage} mobileSrc={home?.heroImageMobile} alt={t(home?.heroAlt, locale)} />
        </div>
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__content container">
          <p className="hero__eyebrow caps">{d.collections.title}</p>
          <h1 className="hero__title caps">{heroCollection?.name}</h1>
          {heroCollection && <p className="hero__tagline">{t(heroCollection.tagline, locale)}</p>}
          {heroCollection && (
            <Link href={`/${locale}/collections/${heroCollection.slug}`} className="link-line hero__cta">
              {d.common.exploreCollection} <span className="arrow" aria-hidden="true">→</span>
            </Link>
          )}
        </div>
        <span className="hero__scroll caps" aria-hidden="true">
          {d.home.scroll}
        </span>
      </section>

      {/* 2 — Brand introduction: gold emblem on woven green */}
      <section className="intro woven">
        <div className="container intro__grid">
          <span className="logo intro__logo" data-reveal="fade" aria-hidden="true" />
          <div>
            <h2 className="intro__title" data-reveal>
              {t(home?.introTitle, locale)}
            </h2>
            <p className="intro__text" data-reveal style={{ '--d': '120ms' } as React.CSSProperties}>
              {t(home?.introText, locale)}
            </p>
            <Link href={`/${locale}/about`} className="link-line" data-reveal style={{ '--d': '220ms', color: 'var(--gold)' } as React.CSSProperties}>
              {d.common.readMore} <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3 — Curated selection */}
      <section className="section curated">
        <div className="container">
          <header className="section-head">
            <div>
              <span className="eyebrow" data-reveal>{d.home.curatedEyebrow}</span>
              <h2 className="section-head__title" data-reveal>{t(home?.curatedTitle, locale)}</h2>
            </div>
            <Link href={`/${locale}/products`} className="link-line" data-reveal>
              {d.common.viewAll} <span className="arrow" aria-hidden="true">→</span>
            </Link>
          </header>
          <div className="product-grid">
            {curated.map((p, i) => (
              <ProductCard key={p.slug} p={p} locale={locale} delay={(i % 3) * 120} />
            ))}
          </div>
        </div>
      </section>

      {/* 4 — The workshop and the people */}
      <section className="section workshop">
        <div className="container workshop__grid">
          <div className="workshop__text">
            <span className="eyebrow" data-reveal>{d.home.workshopEyebrow}</span>
            <h2 className="section-head__title" data-reveal>{t(home?.workshopTitle, locale)}</h2>
            <p className="prose" data-reveal style={{ '--d': '120ms' } as React.CSSProperties}>
              {t(home?.workshopText, locale)}
            </p>
          </div>
          <div className="workshop__images">
            {(home?.workshopImages ?? []).slice(0, 3).map((w, i) => (
              <figure key={i} className={`workshop__fig workshop__fig--${i + 1}`}>
                <Media src={w.image} alt={t(w.caption, locale)} ratio={i === 0 ? '4 / 5' : '1 / 1'} sizes="(min-width: 960px) 30vw, 50vw" reveal delay={i * 150} />
                <figcaption>{t(w.caption, locale)}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* 5 — Collections */}
      <section className="section collections-teaser">
        <div className="container">
          <header className="section-head">
            <div>
              <span className="eyebrow" data-reveal>{d.home.collectionsEyebrow}</span>
              <h2 className="section-head__title" data-reveal>{d.home.collectionsTitle}</h2>
            </div>
          </header>
          <ul className="collection-list">
            {collections.map((c, i) => (
              <li key={c.slug} className="collection-row" data-flip={i % 2 ? '' : undefined}>
                <Link href={`/${locale}/collections/${c.slug}`} className="collection-row__link">
                  <Media src={c.heroImage} alt={t(c.heroAlt, locale)} ratio="16 / 9" sizes="(min-width: 960px) 60vw, 100vw" reveal />
                  <div className="collection-row__text" data-reveal>
                    <span className="eyebrow">{d.common.pieces(count(c.slug))}</span>
                    <h3 className="collection-row__name caps">{c.name}</h3>
                    <p>{t(c.tagline, locale)}</p>
                    <span className="link-line">
                      {d.common.exploreCollection} <span className="arrow" aria-hidden="true">→</span>
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 6 — Visit */}
      <section className="visit">
        <div className="container visit__inner" data-reveal>
          <h2 className="section-head__title">{d.home.visitTitle}</h2>
          <p className="prose">{d.home.visitText}</p>
          <Link href={`/${locale}/stores`} className="btn btn--ghost">
            {d.home.visitCta}
          </Link>
        </div>
      </section>
    </div>
  );
}
