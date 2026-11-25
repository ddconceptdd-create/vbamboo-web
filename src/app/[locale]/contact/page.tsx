import type { Metadata } from 'next';
import EnquiryForm from '@/components/EnquiryForm';
import { getDict, t, type Locale } from '@/i18n';
import { getCollections, getProducts, getSite, productName } from '@/lib/content';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(locale).contact.title };
}

export default async function ContactPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale);
  const [products, collections, site] = await Promise.all([getProducts(), getCollections(), getSite()]);
  const formProducts = products.map((p) => ({
    slug: p.slug,
    name: productName(p, locale),
    image: p.heroImage,
    cutout: p.heroStyle !== 'photo',
    collection: collections.find((c) => c.slug === p.collection)?.name ?? null,
    finishes: p.frameFinishes.map((f) => ({ key: f.key, name: t(f.name, locale) })),
    fabrics: p.upholstery.map((f) => ({ key: f.key, name: t(f.name, locale) })),
  }));

  return (
    <div className="page-enter">
      <header className="page-head container">
        <span className="eyebrow" data-reveal>VBamboo</span>
        <h1 className="page-head__title" data-reveal>{d.contact.title}</h1>
        <p className="lead page-head__lead" data-reveal style={{ '--d': '100ms' } as React.CSSProperties}>{d.contact.lead}</p>
      </header>
      <section className="container contact">
        <div className="contact__form">
          <EnquiryForm products={formProducts} locale={locale} dict={d.contact} labels={{ finish: d.product.finish, upholstery: d.product.upholstery }} />
        </div>
        <aside className="contact__aside">
          <ol className="steps">
            {d.contact.steps.map((s, i) => (
              <li key={i}>
                <span className="steps__n">{String(i + 1).padStart(2, '0')}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
          <div className="contact__direct">
            <h2 className="eyebrow">{d.contact.direct}</h2>
            {site?.email && <p><a className="inline-link" href={`mailto:${site.email}`}>{site.email}</a></p>}
            {site?.phone && <p><a className="inline-link" href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a></p>}
            {site?.address && <p style={{ whiteSpace: 'pre-line' }}>{t(site.address, locale)}</p>}
          </div>
        </aside>
      </section>
    </div>
  );
}
