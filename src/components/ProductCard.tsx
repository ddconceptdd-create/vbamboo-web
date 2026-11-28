import Link from 'next/link';
import Media from './Media';
import CardViewToggle from './CardViewToggle';
import SwipeView from './SwipeView';
import { categoryLabel, type Locale } from '@/i18n';

export type CardProduct = {
  slug: string;
  title: string;
  category: string;
  collectionName?: string | null;
  typeLabel?: string;
  image: string | null;
  imageStyle?: 'cutout' | 'photo';
  hoverImage?: string | null;
  alt: string;
  sample?: boolean;
};

/**
 * The piece shown whole on ivory (studio shot, to compare forms); on hover
 * (pointer devices) it cross-fades to the same piece in a room or on a patio,
 * to judge its scale. On touch screens: the Studio / Room button or a swipe.
 */
export type CardLabels = { studio: string; room: string; toggle: string };

export default function ProductCard({
  p,
  locale,
  delay = 0,
  sizes,
  labels,
}: {
  p: CardProduct;
  locale: Locale;
  delay?: number;
  sizes?: string;
  labels?: CardLabels;
}) {
  const s = sizes ?? '(min-width: 1200px) 33vw, (min-width: 700px) 50vw, 100vw';
  const cutout = p.imageStyle !== 'photo';
  return (
    <article className="product-card" data-reveal style={{ '--d': `${delay}ms` } as React.CSSProperties}>
      <Link href={`/${locale}/products/${p.slug}`} className="product-card__link">
        <div className={`product-card__media${p.hoverImage ? ' product-card__media--hover' : ''}`}>
          <Media src={p.image} alt={p.alt} sizes={s} contain={cutout} className={cutout ? 'media--silhouette' : ''} />
          {p.hoverImage && <Media src={p.hoverImage} alt="" sizes={s} className="product-card__hover" />}
          {p.hoverImage && labels && <SwipeView />}
        </div>
        <div className="product-card__meta">
          {p.collectionName && <span className="eyebrow">{p.collectionName}</span>}
          <h3 className="product-card__title">{p.title}</h3>
          <span className="product-card__type">{p.typeLabel || categoryLabel(p.category, locale, true)}</span>
        </div>
      </Link>
      {p.hoverImage && labels && <CardViewToggle labels={labels} />}
    </article>
  );
}
