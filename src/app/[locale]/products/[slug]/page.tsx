import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Media from '@/components/Media';
import ProductCard from '@/components/ProductCard';
import ProductGallery from '@/components/ProductGallery';
import ProductConfigurator, { type Option } from '@/components/ProductConfigurator';
import EnquireButton from '@/components/EnquireButton';
import TechnicalDrawings from '@/components/TechnicalDrawings';
import { LOCALES, categoryLabel, getDict, t, type Bi, type Locale } from '@/i18n';
import { dimensionsState, getCollections, getProduct, getProducts, getSite, IS_PRODUCTION, productName, toCard } from '@/lib/content';

export async function generateStaticParams() {
  const products = await getProducts();
  return LOCALES.flatMap((locale) => products.map((p) => ({ locale, slug: p.slug })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale; slug: string }> }): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = await getProduct(slug);
  if (!p) return {};
  return {
    title: productName(p, locale),
    description: t(p.summary, locale),
    openGraph: { images: p.heroImage && !p.heroImage.endsWith('.svg') ? [p.heroImage] : ['/brand/cover.webp'] },
    alternates: { languages: { vi: `/vi/products/${slug}`, en: `/en/products/${slug}` } },
  };
}

const fmt = (n: number) => n.toLocaleString('en-US').replace(/,/g, ' ');

export default async function ProductPage({ params }: { params: Promise<{ locale: Locale; slug: string }> }) {
  const { locale, slug } = await params;
  const p = await getProduct(slug);
  if (!p) notFound();
  const d = getDict(locale);
  const dp = d.product;
  const [collections, products, site] = await Promise.all([getCollections(), getProducts(), getSite()]);
  // Launch: request-a-quote only. Approved prices appear per market once enabled.
  const price =
    site?.showPrices && p.prices?.approved
      ? locale === 'vi'
        ? p.prices.vnd && `${p.prices.vnd.toLocaleString('vi-VN')} ₫`
        : p.prices.usd && `US$${p.prices.usd.toLocaleString('en-US')}`
      : null;
  const collection = collections.find((c) => c.slug === p.collection) ?? null;
  const name = productName(p, locale);
  const dimState = dimensionsState(p);
  const dims = dimState === 'hidden' ? null : p.dimensions;

  const gallery = p.gallery
    .filter((g) => g.image)
    .map((g) => ({ src: g.image as string, alt: t(g.alt, locale) || name, kind: g.kind, kindLabel: dp.shot[g.kind] ?? g.kind }));

  const opt = (o: { key: string; name: Bi; detail: Bi; swatchColor: string; swatchImage: string | null }): Option => ({
    key: o.key,
    name: t(o.name, locale),
    detail: t(o.detail, locale),
    swatchColor: o.swatchColor || null,
    swatchImage: o.swatchImage,
  });
  const finishes = p.frameFinishes.map(opt);
  const fabrics = p.upholstery.map(opt);
  const versionImages = p.versionImages.filter((v) => v.image).map((v) => ({ finish: v.finish, fabric: v.fabric, image: v.image as string }));
  const studio = p.gallery.find((g) => g.kind === 'studio')?.image ?? p.heroImage;
  const related = products.filter((x) => x.collection === p.collection && x.slug !== p.slug).slice(0, 3).map((x) => toCard(x, locale, collections));
  const downloads = p.downloads.filter((x) => x.file);
  const defaults = { finish: finishes[0]?.key ?? null, fabric: fabrics[0]?.key ?? null };

  return (
    <article className="product page-enter">
      {/* 1 — Introduction */}
      <header className="product-intro">
        <div className="product-intro__media container">
          <Media src={p.heroImage} alt={t(p.heroAlt, locale) || name} ratio="20 / 13" sizes="(min-width: 1440px) 1328px, 100vw" priority />
        </div>
        <div className="container product-intro__text">
          <div data-reveal>
            {!IS_PRODUCTION && p.sample && <span className="badge-sample">{d.common.sample}</span>}
            {collection && (
              <Link href={`/${locale}/collections/${collection.slug}`} className="eyebrow product-intro__collection">
                {collection.name}
              </Link>
            )}
            <h1 className="product-intro__name">{name}</h1>
            <p className="product-intro__type">{categoryLabel(p.category, locale, true)}</p>
          </div>
          <div data-reveal style={{ '--d': '120ms' } as React.CSSProperties}>
            <p className="lead">{t(p.summary, locale)}</p>
            {t(p.story, locale) && <p className="prose product-intro__story">{t(p.story, locale)}</p>}
          </div>
        </div>
      </header>

      {/* 2 — Gallery: architectural → studio → detail */}
      {gallery.length > 0 && (
        <section className="section product-gallery" aria-labelledby="gallery-h">
          <div className="container">
            <h2 id="gallery-h" className="visually-hidden">{dp.gallery}</h2>
            <ProductGallery
              images={gallery}
              labels={{ prev: dp.prev, next: dp.next, enlarge: dp.enlarge, close: d.nav.close, gallery: dp.gallery }}
            />
          </div>
        </section>
      )}

      {/* 3 — Materials and versions (static, for comparison) */}
      <section className="section product-specs" aria-labelledby="specs-h">
        <div className="container">
          <h2 id="specs-h" className="section-head__title product-section-title">{dp.specs}</h2>
          <div className="specs-grid">
            {(finishes.length > 0 || fabrics.length > 0) && (
              <ProductConfigurator
                productName={name}
                finishes={finishes}
                fabrics={fabrics}
                versionImages={versionImages}
                fallbackImage={studio}
                labels={{ finish: dp.finish, upholstery: dp.upholstery, selected: dp.selected, missing: dp.versionPhotoMissing }}
              />
            )}
            {p.materials.length > 0 && (
              <div className="materials">
                <h3 className="eyebrow">{dp.materials}</h3>
                <dl>
                  {p.materials.map((m, i) => (
                    <div key={i}>
                      <dt>{t(m.label, locale)}</dt>
                      <dd>{t(m.value, locale)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4 — Dimensions, drawings and downloads (static) */}
      <section className="section product-tech" aria-labelledby="tech-h">
        <div className="container">
          <h2 id="tech-h" className="section-head__title product-section-title">{dp.drawings}</h2>
          <div className="tech-grid">
            <div className="dims">
              <h3 className="eyebrow">{dp.dimensions}</h3>
              {dims ? (
                <>
                  <p className="dims__headline">
                    {[dims.width, dims.depth, dims.height].map((n) => (n ? fmt(n) : '—')).join(' × ')} <span>{dp.mm}</span>
                  </p>
                  <dl className="dims__list">
                    {dims.width ? <div><dt>{dp.width}</dt><dd>{fmt(dims.width)} {dp.mm}</dd></div> : null}
                    {dims.depth ? <div><dt>{dp.depth}</dt><dd>{fmt(dims.depth)} {dp.mm}</dd></div> : null}
                    {dims.height ? <div><dt>{dp.height}</dt><dd>{fmt(dims.height)} {dp.mm}</dd></div> : null}
                    {dims.seatHeight ? <div><dt>{dp.seatHeight}</dt><dd>{fmt(dims.seatHeight)} {dp.mm}</dd></div> : null}
                  </dl>
                  {dimState === 'sample' && <p className="badge-sample">{dp.dimsSample}</p>}
                </>
              ) : (
                <p className="prose">{dp.dimsPending}</p>
              )}

              <div className="downloads">
                <h3 className="eyebrow">{dp.downloads}</h3>
                {downloads.length ? (
                  <ul>
                    {downloads.map((f, i) => (
                      <li key={i}>
                        <a href={f.file as string} download>
                          <span>{t(f.label, locale) || dp.kind[f.kind]}</span>
                          <span className="downloads__kind">{dp.kind[f.kind]} · {String(f.file).split('.').pop()?.toUpperCase()}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="prose">
                    {dp.noDownloads}{' '}
                    <Link className="inline-link" href={`/${locale}/contact?type=project&product=${p.slug}`}>
                      {dp.requestFiles}
                    </Link>
                  </p>
                )}
              </div>
            </div>
            <TechnicalDrawings
              drawings={p.drawings}
              dims={dims}
              labels={{ front: dp.front, side: dp.side, plan: dp.plan, schematic: dp.schematic, mm: dp.mm }}
            />
          </div>
        </div>
      </section>

      {/* 5 — Collection and purchase enquiry */}
      <section className="product-closing">
        <Media
          src={p.collectionImage ?? collection?.settingImage}
          alt={collection ? `${collection.name}` : name}
          ratio="21 / 9"
          sizes="100vw"
          reveal
          className="product-closing__img"
        />
        <div className="container product-closing__grid">
          <div data-reveal>
            <span className="eyebrow">{dp.inCollection}</span>
            {collection && (
              <>
                <h2 className="section-head__title caps product-closing__name">{collection.name}</h2>
                <Link href={`/${locale}/collections/${collection.slug}`} className="link-line">
                  {d.common.exploreCollection} <span className="arrow" aria-hidden="true">→</span>
                </Link>
              </>
            )}
          </div>
          <div className="enquire" data-reveal style={{ '--d': '120ms' } as React.CSSProperties}>
            {price && <p className="enquire__price">{price}</p>}
            <p className="prose">{dp.enquireNote}</p>
            <EnquireButton locale={locale} slug={p.slug} defaults={defaults} label={dp.enquire} className="btn btn--ghost enquire__btn" />
          </div>
        </div>

        {related.length > 0 && (
          <div className="container related">
            <h3 className="eyebrow">{dp.related}</h3>
            <div className="product-grid">
              {related.map((r, i) => (
                <ProductCard key={r.slug} p={r} locale={locale} delay={i * 100} />
              ))}
            </div>
          </div>
        )}
      </section>
    </article>
  );
}
