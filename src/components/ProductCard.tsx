import Link from 'next/link';
import Media from './Media';
import { categoryLabel, type Locale } from '@/i18n';

export type CardProduct = {
  slug: string;
  title: string;
  category: string;
  collectionName?: string | null;
  image: string | null;
  alt: string;
  sample?: boolean;
};

export default function ProductCard({ p, locale, delay = 0, sizes }: { p: CardProduct; locale: Locale; delay?: number; sizes?: string }) {
  return (
    <article className="product-card" data-reveal style={{ '--d': `${delay}ms` } as React.CSSProperties}>
      <Link href={`/${locale}/products/${p.slug}`} className="product-card__link">
        <Media
          src={p.image}
          alt={p.alt}
          ratio="4 / 5"
          sizes={sizes ?? '(min-width: 1200px) 33vw, (min-width: 700px) 50vw, 100vw'}
          className="product-card__media"
        />
        <div className="product-card__meta">
          {p.collectionName && <span className="eyebrow">{p.collectionName}</span>}
          <h3 className="product-card__title">{p.title}</h3>
          <span className="product-card__type">{categoryLabel(p.category, locale, true)}</span>
        </div>
      </Link>
    </article>
  );
}
