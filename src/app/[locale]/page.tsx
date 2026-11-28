import Link from 'next/link';
import Media from '@/components/Media';
import CollectionShowcase from '@/components/CollectionShowcase';
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

      {/* 2 — Collections, straight after the film: the line, then the looping slider of sketches */}
      <section className="home-intro" id="collections">
        <div className="container">
          <p className="home-lede" data-reveal>{d.home.heroLine}</p>
        </div>
      </section>
      <CollectionShowcase
        eyebrow={d.home.collectionsEyebrow}
        title={d.home.collectionsTitle}
        labels={{ discover: d.home.discover, pause: d.home.slidesPause, play: d.home.slidesPlay, prev: d.home.slidesPrev, next: d.home.slidesNext, show: d.home.slidesShow }}
        slides={collections.map((c) => ({
          slug: c.slug,
          href: `/${locale}/collections/${c.slug}`,
          name: c.name,
          tagline: t(c.tagline, locale),
          count: d.common.pieces(count(c.slug)),
          pieces: products.filter((p) => p.collection === c.slug).map((p) => p.name).slice(0, 5),
          image: c.opening ?? c.heroImage,
          focus: c.opening ? c.openingFocus : '50% 50%',
        }))}
      />

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
