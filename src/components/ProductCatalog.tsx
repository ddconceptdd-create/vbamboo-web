'use client';

import { useEffect, useMemo, useState } from 'react';
import ProductCard, { type CardProduct } from './ProductCard';
import { CATEGORIES, getDict, type Locale } from '@/i18n';

type Card = CardProduct & { collection: string | null };

/** Browse by furniture type or filter by collection. Filters are kept in the URL. */
export default function ProductCatalog({
  products,
  collections,
  locale,
}: {
  products: Card[];
  collections: { slug: string; name: string }[];
  locale: Locale;
}) {
  const dict = getDict(locale).products;
  const [category, setCategory] = useState<string | null>(null);
  const [collection, setCollection] = useState<string | null>(null);

  useEffect(() => {
    const read = () => {
      const sp = new URLSearchParams(window.location.search);
      setCategory(sp.get('category'));
      setCollection(sp.get('collection'));
    };
    read();
    window.addEventListener('popstate', read);
    return () => window.removeEventListener('popstate', read);
  }, []);

  const update = (next: { category?: string | null; collection?: string | null }) => {
    const url = new URL(window.location.href);
    for (const [k, v] of Object.entries(next)) {
      if (v) url.searchParams.set(k, v);
      else url.searchParams.delete(k);
    }
    window.history.replaceState(window.history.state, '', url);
    if ('category' in next) setCategory(next.category ?? null);
    if ('collection' in next) setCollection(next.collection ?? null);
  };

  const available = useMemo(() => new Set(products.map((p) => p.category)), [products]);
  const list = products.filter((p) => (!category || p.category === category) && (!collection || p.collection === collection));

  return (
    <>
      <div className="filters">
        <div className="filters__row" role="group" aria-label={dict.byCategory}>
          <span className="filters__label eyebrow">{dict.byCategory}</span>
          <div className="filters__chips">
            <button type="button" className="chip" aria-pressed={!category} onClick={() => update({ category: null })}>
              {dict.all}
            </button>
            {CATEGORIES.filter((c) => available.has(c.slug)).map((c) => (
              <button key={c.slug} type="button" className="chip" aria-pressed={category === c.slug} onClick={() => update({ category: c.slug })}>
                {c[locale]}
              </button>
            ))}
          </div>
        </div>
        <div className="filters__row" role="group" aria-label={dict.byCollection}>
          <span className="filters__label eyebrow">{dict.byCollection}</span>
          <div className="filters__chips">
            <button type="button" className="chip" aria-pressed={!collection} onClick={() => update({ collection: null })}>
              {dict.allCollections}
            </button>
            {collections.map((c) => (
              <button key={c.slug} type="button" className="chip" aria-pressed={collection === c.slug} onClick={() => update({ collection: c.slug })}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <p className="catalog__count" aria-live="polite">{dict.count(list.length)}</p>

      {list.length ? (
        <div className="product-grid catalog__grid" key={`${category}-${collection}`}>
          {list.map((p, i) => (
            <ProductCard key={p.slug} p={p} locale={locale} delay={(i % 3) * 90} />
          ))}
        </div>
      ) : (
        <p className="catalog__empty">{dict.empty}</p>
      )}
    </>
  );
}
