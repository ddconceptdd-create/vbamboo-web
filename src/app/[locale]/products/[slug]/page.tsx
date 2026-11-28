import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import Media from '@/components/Media';
import ProductCard from '@/components/ProductCard';
import ProductSubnav from '@/components/ProductSubnav';
import ZoomLightbox from '@/components/ZoomLightbox';
import ModelViewer from '@/components/ModelViewer';
import Image from 'next/image';
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
    description: t(p.summary, locale) || `${t(p.typeLabel, locale)} · VBamboo`,
    openGraph: { images: [p.cardImage ?? p.heroImage ?? '/brand/cover.webp'] },
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

  const shots = p.gallery.filter((g) => g.image).map((g) => ({ src: g.image as string, alt: t(g.alt, locale) || name, kind: g.kind }));
  const rooms = shots.filter((g) => g.kind === 'architectural');
  const studios = shots.filter((g) => g.kind === 'studio');
  const details = shots.filter((g) => g.kind === 'detail');
  // Opening frame: the piece in a curated space (falls back to the studio/cut-out photo).
  const opener = rooms[0] ?? null;
  const sequence = Array.from({ length: Math.max(rooms.length - 1, details.length) }, (_, k) => ({ wide: rooms[k + 1] ?? null, close: details[k] ?? null }));

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
  const features = p.features.map((f) => t(f, locale)).filter(Boolean);
  const materials = p.materials.map((m) => ({ label: t(m.label, locale), value: t(m.value, locale) })).filter((m) => m.value);
  const swatches = p.materialSwatches.filter((s) => s.image).map((s) => ({ image: s.image as string, name: t(s.name, locale) }));
  const hasConfigurator = finishes.length > 0 || fabrics.length > 0;
  const cutout = p.heroStyle !== 'photo';
  const summary = t(p.summary, locale);
  const defaults = { finish: finishes[0]?.key ?? null, fabric: fabrics[0]?.key ?? null };

  const sections = [
    { id: 'form', label: dp.nav.form },
    ...(swatches.length || details.length || materials.length ? [{ id: 'materials', label: dp.nav.materials }] : []),
    ...(hasConfigurator ? [{ id: 'versions', label: dp.nav.versions }] : []),
    { id: 'size', label: dp.nav.size },
    ...(p.model || !IS_PRODUCTION ? [{ id: 'model', label: dp.nav.model }] : []),
    { id: 'enquire', label: dp.nav.enquire },
  ];
  const zoom = (src: string, alt: string, caption: string) => ({ 'data-zoom': src, 'data-zoom-alt': alt, 'data-zoom-caption': caption });
  const enquire = (cls: string) => <EnquireButton locale={locale} slug={p.slug} defaults={defaults} label={dp.enquire} className={cls} />;

  return (
    <article className="product page-enter" data-zoom-scope>
      {/* 1 — The piece in a curated space, then what it is and why */}
      <header className="p-open">
        {opener ? (
          <div className="p-open__frame expand" data-expand="hero">
            <Image src={opener.src} alt={opener.alt} fill sizes="100vw" priority />
          </div>
        ) : (
          <div className="p-open__frame p-open__frame--studio container">
            <Media src={p.heroImage} alt={t(p.heroAlt, locale) || name} ratio="16 / 9" contain={cutout} className={cutout ? 'media--silhouette' : ''} sizes="100vw" priority />
          </div>
        )}
        <div className="container p-open__text">
          <div data-reveal>
            {!IS_PRODUCTION && p.sample && <span className="badge-sample">{d.common.sample}</span>}
            {collection && (
              <Link href={`/${locale}/collections/${collection.slug}`} className="eyebrow product-intro__collection">
                {collection.name}
              </Link>
            )}
            <h1 className="p-open__name caps">{name}</h1>
            <p className="product-intro__type">{t(p.typeLabel, locale) || categoryLabel(p.category, locale, true)}</p>
            {price && <p className="enquire__price">{price}</p>}
          </div>
          <div data-reveal style={{ '--d': '120ms' } as React.CSSProperties}>
            {summary && <p className="lead">{summary}</p>}
            {t(p.story, locale) && <p className="prose product-intro__story">{t(p.story, locale)}</p>}
          </div>
        </div>
      </header>

      <ProductSubnav name={name} sections={sections} label={dp.gallery}>
        {enquire('btn p-nav__btn')}
      </ProductSubnav>

      {/* 2 — Form: the whole silhouette in studio light, and what shapes it */}
      <section id="form" className="section p-form" aria-labelledby="form-h">
        <div className="container p-form__grid">
          <button type="button" className="p-form__figure" {...zoom(p.heroImage ?? '', t(p.heroAlt, locale) || name, dp.shot.studio)} aria-label={`${dp.enlarge}: ${name}`}>
            <Media src={p.heroImage} alt={t(p.heroAlt, locale) || name} ratio="4 / 5" contain={cutout} className={cutout ? 'media--silhouette' : ''} sizes="(min-width: 960px) 50vw, 100vw" />
          </button>
          <div className="p-form__text">
            <span className="eyebrow" data-reveal>{dp.nav.form}</span>
            <h2 id="form-h" className="section-head__title" data-reveal>{dp.formTitle}</h2>
            {features.length > 0 && (
              <ul className="p-form__features" data-reveal>
                {features.map((f, i) => (
                  <li key={i}>
                    <span className="p-form__n">{String(i + 1).padStart(2, '0')}</span>
                    {f}
                  </li>
                ))}
              </ul>
            )}
            {studios.length > 0 && (
              <ul className="p-form__studios">
                {studios.map((g, i) => (
                  <li key={g.src}>
                    <button type="button" {...zoom(g.src, g.alt, dp.shot.studio)} aria-label={`${dp.enlarge}: ${g.alt}`}>
                      <Media src={g.src} alt={g.alt} ratio="4 / 5" sizes="(min-width: 960px) 14vw, 30vw" reveal delay={i * 80} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* 3 — Wide views interleaved with close-ups: the whole, then the making */}
      {sequence.length > 0 && (
        <section className="p-seq" aria-label={dp.formTitle}>
          {sequence.map((step, k) => (
            <div key={k} className="p-seq__step">
              {step.wide && (
                <figure className="p-seq__wide expand" data-expand>
                  <button type="button" {...zoom(step.wide.src, step.wide.alt, dp.wide)} aria-label={`${dp.enlarge}: ${step.wide.alt}`}>
                    <Media src={step.wide.src} alt={step.wide.alt} ratio="16 / 9" sizes="100vw" />
                  </button>
                </figure>
              )}
              {step.close && (
                <figure className="p-seq__close container" data-side={k % 2 ? 'left' : 'right'}>
                  <button type="button" {...zoom(step.close.src, step.close.alt, dp.close)} aria-label={`${dp.enlarge}: ${step.close.alt}`}>
                    <Media src={step.close.src} alt={step.close.alt} ratio="4 / 5" sizes="(min-width: 960px) 40vw, 100vw" reveal />
                  </button>
                  <figcaption className="eyebrow">{dp.close} · {String(k + 1).padStart(2, '0')}</figcaption>
                </figure>
              )}
            </div>
          ))}
        </section>
      )}

      {/* 4 — Material close-ups (tap to enlarge) and the material list */}
      {(swatches.length > 0 || details.length > 0 || materials.length > 0) && (
        <section id="materials" className="section p-materials" aria-labelledby="materials-h">
          <div className="container">
            <header className="p-head">
              <span className="eyebrow">{dp.nav.materials}</span>
              <h2 id="materials-h" className="section-head__title">{dp.closeups}</h2>
              <p className="prose">{dp.closeupsLead}</p>
            </header>
            <div className="p-materials__grid">
              <ul className="p-materials__tiles">
                {(swatches.length ? swatches.map((s) => ({ src: s.image, name: s.name })) : details.map((g) => ({ src: g.src, name: g.alt }))).map((s, i) => (
                  <li key={s.src}>
                    <button type="button" {...zoom(s.src, s.name, s.name)} aria-label={`${dp.enlarge}: ${s.name}`}>
                      <Media src={s.src} alt={s.name} ratio="1 / 1" sizes="(min-width: 960px) 22vw, 50vw" reveal delay={(i % 4) * 80} />
                      <span className="p-materials__name">{s.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {materials.length > 0 && (
                <div className="materials">
                  <h3 className="eyebrow">{dp.materials}</h3>
                  <dl>
                    {materials.map((m, i) => (
                      <div key={i} className={m.label ? undefined : 'materials__row--plain'}>
                        {m.label && <dt>{m.label}</dt>}
                        <dd>{m.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 5 — Versions: compare finishes side by side; the choice travels to the enquiry */}
      {hasConfigurator && (
        <section id="versions" className="section p-versions" aria-labelledby="versions-h">
          <div className="container">
            <header className="p-head">
              <span className="eyebrow">{dp.nav.versions}</span>
              <h2 id="versions-h" className="section-head__title">{dp.versionsTitle}</h2>
              <p className="prose">{dp.versionsLead}</p>
            </header>
            <ProductConfigurator
              productName={name}
              finishes={finishes}
              fabrics={fabrics}
              versionImages={versionImages}
              fallbackImage={studio}
              labels={{ finish: dp.finish, upholstery: dp.upholstery, selected: dp.selected, missing: dp.versionPhotoMissing }}
            />
            <div className="p-versions__cta">{enquire('btn')}</div>
          </div>
        </section>
      )}

      {/* 6 — Dimensions, drawings and downloads (static) */}
      <section id="size" className="section product-tech" aria-labelledby="tech-h">
        <div className="container">
          <header className="p-head">
            <span className="eyebrow">{dp.nav.size}</span>
            <h2 id="tech-h" className="section-head__title">{dp.drawings}</h2>
          </header>
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
              drawings={p.drawings.map((x) => ({ image: x.image, caption: t(x.caption, locale), background: x.background }))}
              dims={dims}
              labels={{ front: dp.front, side: dp.side, plan: dp.plan, schematic: dp.schematic, mm: dp.mm, open: dp.openDrawing }}
            />
          </div>
        </div>
      </section>

      {/* 7 — 360° model (glTF/GLB). Preview builds show the empty slot so it can be reviewed. */}
      {(p.model || !IS_PRODUCTION) && (
        <section id="model" className="section p-model" aria-labelledby="model-h">
          <div className="container p-model__grid">
            <header className="p-head">
              <span className="eyebrow">{dp.nav.model}</span>
              <h2 id="model-h" className="section-head__title">{dp.modelTitle}</h2>
              {!p.model && <p className="prose">{dp.modelPendingNote}</p>}
            </header>
            {p.model ? (
              <ModelViewer
                src={p.model.src}
                ios={p.model.ios}
                poster={p.model.poster}
                alt={name}
                labels={{ load: dp.modelLoad, loading: dp.modelLoading, hint: dp.modelHint, ar: dp.modelAr }}
              />
            ) : (
              <div className="model model--pending">
                <div className="model__poster">
                  {p.heroImage && <Image src={p.heroImage} alt="" fill sizes="(min-width: 960px) 60vw, 100vw" />}
                </div>
                <p className="model__badge badge-sample">{dp.modelPending}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* 8 — Collection and purchase enquiry */}
      <section id="enquire" className="product-closing">
        <div className="expand" data-expand>
          <Media src={p.collectionImage ?? collection?.settingImage} alt={collection ? `${collection.name}` : name} ratio="21 / 9" sizes="100vw" className="product-closing__img" />
        </div>
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
            <ol className="enquire__steps">
              {d.contact.steps.map((step, i) => (
                <li key={i}>
                  <span>{String(i + 1).padStart(2, '0')}</span> {step}
                </li>
              ))}
            </ol>
            {enquire('btn enquire__btn')}
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

      <ZoomLightbox labels={{ close: d.nav.close, prev: dp.prev, next: dp.next, zoomIn: dp.zoomIn, zoomOut: dp.zoomOut, hint: dp.zoomHint }} />
    </article>
  );
}
