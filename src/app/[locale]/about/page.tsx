import type { Metadata } from 'next';
import Link from 'next/link';
import Media from '@/components/Media';
import { getDict, t, type Locale } from '@/i18n';
import { getAbout } from '@/lib/content';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(locale).nav.about };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale);
  const a = await getAbout();
  return (
    <div className="about page-enter">
      <section className="hero hero--about" aria-label={t(a?.title, locale)}>
        <div className="hero__media">
          <Media src={a?.heroImage} alt="" sizes="100vw" priority className="hero__img" />
        </div>
        <div className="hero__shade" aria-hidden="true" />
        <div className="hero__content container">
          <p className="hero__eyebrow caps">{d.nav.about}</p>
          <h1 className="hero__title hero__title--sentence">{t(a?.title, locale)}</h1>
        </div>
      </section>

      <section className="section about-lead">
        <div className="container">
          <p className="about-lead__text" data-reveal>{t(a?.lead, locale)}</p>
        </div>
      </section>

      <div className="chapters">
        {(a?.chapters ?? []).map((c, i) => (
          <section key={i} className="chapter container" data-flip={i % 2 ? '' : undefined}>
            <Media src={c.image} alt={t(c.alt, locale)} ratio="4 / 5" sizes="(min-width: 960px) 45vw, 100vw" reveal className="chapter__img" />
            <div className="chapter__text">
              <span className="eyebrow" data-reveal>{String(i + 1).padStart(2, '0')} · {t(c.eyebrow, locale)}</span>
              <h2 className="section-head__title" data-reveal>{t(c.title, locale)}</h2>
              <p className="prose" data-reveal style={{ '--d': '120ms' } as React.CSSProperties}>{t(c.text, locale)}</p>
            </div>
          </section>
        ))}
      </div>

      {(a?.principles?.length ?? 0) > 0 && (
        <section className="section principles woven">
          <div className="container">
            <span className="logo logo--emblem principles__mark" aria-hidden="true" data-reveal="fade" />
            <ol className="principles__list">
              {a!.principles.map((p, i) => (
                <li key={i} data-reveal style={{ '--d': `${i * 120}ms` } as React.CSSProperties}>
                  <h3 className="caps">{t(p.title, locale)}</h3>
                  <p>{t(p.text, locale)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      )}

      <section className="visit">
        <div className="container visit__inner" data-reveal>
          <h2 className="section-head__title">{d.home.collectionsTitle}</h2>
          <Link href={`/${locale}/collections`} className="btn btn--ghost">{d.nav.collections}</Link>
        </div>
      </section>
    </div>
  );
}
