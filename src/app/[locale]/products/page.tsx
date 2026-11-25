import type { Metadata } from 'next';
import ProductCatalog from '@/components/ProductCatalog';
import { getDict, type Locale } from '@/i18n';
import { getCollections, getProducts, toCard } from '@/lib/content';

export async function generateMetadata({ params }: { params: Promise<{ locale: Locale }> }): Promise<Metadata> {
  const { locale } = await params;
  return { title: getDict(locale).products.title };
}

export default async function ProductsPage({ params }: { params: Promise<{ locale: Locale }> }) {
  const { locale } = await params;
  const d = getDict(locale);
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  return (
    <div className="page-enter">
      <header className="page-head container">
        <span className="eyebrow" data-reveal>VBamboo</span>
        <h1 className="page-head__title" data-reveal>{d.products.title}</h1>
        <p className="lead page-head__lead" data-reveal style={{ '--d': '100ms' } as React.CSSProperties}>{d.products.lead}</p>
      </header>
      <section className="container catalog">
        <ProductCatalog
          products={products.map((p) => toCard(p, locale, collections))}
          collections={collections.map((c) => ({ slug: c.slug, name: c.name }))}
          locale={locale}
        />
      </section>
    </div>
  );
}
