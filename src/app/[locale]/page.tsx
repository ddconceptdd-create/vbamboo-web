import Link from 'next/link';
import Media from '@/components/Media';
import HeroImage from '@/components/HeroImage';
import HeroVideo from '@/components/HeroVideo';
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
      {/* 1 — Film: muted, with a pause button; the poster photo is the first frame and the reduced-motion view */}
      <section className="hero hero--home" aria-label="VBamboo">
        <div className="hero__media">
          <HeroImage src={home?.heroImage ?? heroCollection?.heroImage} mobileSrc={home?.heroImageMobile} alt={t(home?.heroAlt, locale)} />
          {home?.video && (
            <HeroVideo
              video={home.video}
              labels={{ pause: d.home.pauseVideo, play: d.home.playVideo, video: d.home.videoLabel, soundOn: d.home.soundOn, soundOff: d.home.soundOff }}
            />
          )}
        </div>
        <div className="hero__shade" aria-hidden="true" />
        <h1 className="hero__title-2026">{t(home?.heroTitle, locale) || '2026 COLLECTION'}</h1>
        <a href="#collections" className="hero__down" aria-label={d.home.toCollections}>
          <svg width="18" height="22" viewBox="0 0 18 22" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
            <path d="M9 1v19M2 13l7 7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      </section>

      {/* 2 — Collections, straight after the film */}
      <section className="section collections-teaser" id="collections">
        <div className="container">
          <p className="home-lede" data-reveal>{d.home.heroLine}</p>
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
                  <div className="expand" data-expand>
                    <Media src={c.heroImage} alt={t(c.heroAlt, locale)} ratio="16 / 9" sizes="(min-width: 960px) 60vw, 100vw" />
                  </div>
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

      {/* 3 — Brand introduction: gold emblem on woven green */}
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

      {/* 4 — Curated selection */}
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

      {/* 5 — The workshop and the people */}
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
