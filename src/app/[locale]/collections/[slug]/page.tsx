import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Media from '@/components/Media';
import CollectionHero from '@/components/CollectionHero';
import { LOCALES, categoryLabel, getDict, t, type Locale } from '@/i18n';
import { getCollection, getCollections, getProducts, IS_PRODUCTION, productName } from '@/lib/content';

export async function generateStaticParams() {
  const cs = await getCollections();
  return LOCALES.flatMap((locale) => cs.map((c) => ({ locale, slug: c.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const c = await getCollection(slug);
  return c ? { title: c.name, description: t(c.intro, locale) } : {};
}

/**
 * A collection is told as a sequence: wide landscape → introduction →
 * close-up textures → the pieces in their setting → each piece.
 */
export default async function CollectionPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const c = await getCollection(slug);
  if (!c) notFound();
  const d = getDict(locale);
  const products = (await getProducts()).filter((p) => p.collection === c.slug);

  return (
    <div className="collection page-enter">
      <CollectionHero
        locale={locale}
        name={c.name}
        tagline={t(c.tagline, locale)}
        eyebrow={d.collections.title}
        image={c.heroImage}
        alt={t(c.heroAlt, locale)}
        position={c.namePosition}
        tone={c.nameTone}
        pieces={c.hotspots
          .map((h) => {
            const p = products.find((x) => x.slug === h.slug);
            return p
              ? { slug: p.slug, name: productName(p, locale), type: t(p.typeLabel, locale) || categoryLabel(p.category, locale, true), x: h.x, y: h.y, thumb: p.heroStyle === 'cutout' ? p.heroImage : null }
              : null;
          })
          .filter((x) => x !== null)}
        labels={{ inFrame: d.collections.inFrame, view: d.common.viewProduct }}
        badge={!IS_PRODUCTION && c.sample ? <span className="badge-sample">{d.common.sample}</span> : null}
      />

      <section className="collection-title woven" id="story">
        <div className="container collection-title__grid">
          <div>
            <p className="eyebrow" data-reveal>{c.name}</p>
            <p className="collection-title__lede" data-reveal>{t(c.tagline, locale)}</p>
          </div>
          <div className="collection-title__side">
            {c.sketch && (
              <div className="collection-title__sketch" aria-hidden="true" data-reveal="fade">
                <Image src={c.sketch} alt="" fill sizes="(min-width: 960px) 40vw, 80vw" />
              </div>
            )}
            <p className="collection-title__intro" data-reveal style={{ '--d': '150ms' } as React.CSSProperties}>{t(c.intro, locale)}</p>
          </div>
        </div>
      </section>

      {c.textures.length > 0 && (
        <section className="section textures" aria-label={d.collections.textures}>
          <div className="container">
            <div className="textures__grid">
              {c.textures.map((x, i) => (
                <figure key={i} className={`textures__fig textures__fig--${i + 1}`}>
                  <Media src={x.image} alt={t(x.caption, locale)} ratio={i === 0 ? '4 / 5' : '1 / 1'} sizes="(min-width: 960px) 33vw, 100vw" reveal delay={i * 140} />
                  <figcaption>{t(x.caption, locale)}</figcaption>
                </figure>
              ))}
            </div>
            {t(c.story, locale) && (
              <blockquote className="textures__story" data-reveal>
                <p>{t(c.story, locale)}</p>
              </blockquote>
            )}
          </div>
        </section>
      )}

      {c.settingImage && (
        <section className="setting expand" data-expand>
          <Media src={c.settingImage} alt={t(c.settingAlt, locale)} ratio="21 / 9" sizes="100vw" />
        </section>
      )}

      <section className="section">
        <div className="container">
          <header className="section-head">
            <div>
              <span className="eyebrow" data-reveal>{c.name}</span>
              <h2 className="section-head__title" data-reveal>{d.collections.pieces}</h2>
            </div>
          </header>
          <ol className="pieces">
            {products.map((p, i) => (
              <li key={p.slug} className="piece" data-reveal style={{ '--d': `${(i % 2) * 120}ms` } as React.CSSProperties}>
                <Link href={`/${locale}/products/${p.slug}`} className="piece__link">
                  <Media src={p.gallery.find((g) => g.kind === 'architectural')?.image ?? p.heroImage} alt={productName(p, locale)} ratio="3 / 2" sizes="(min-width: 960px) 50vw, 100vw" />
                  <div className="piece__meta">
                    <span className="piece__num">{String(i + 1).padStart(2, '0')}</span>
                    <div>
                      <h3 className="piece__name">{productName(p, locale)}</h3>
                      <p className="piece__type">{t(p.typeLabel, locale) || categoryLabel(p.category, locale, true)}</p>
                    </div>
                    <span className="link-line piece__cta">{d.common.viewProduct} <span className="arrow" aria-hidden="true">→</span></span>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
