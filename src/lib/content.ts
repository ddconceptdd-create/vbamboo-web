import 'server-only';
import { cache } from 'react';
import { createReader } from '@keystatic/core/reader';
import keystaticConfig from '../../keystatic.config';
import type { Locale } from '@/i18n';
import { t } from '@/i18n';

const reader = createReader(process.cwd(), keystaticConfig);

/**
 * Sample (placeholder) entries are visible on local and preview builds only.
 * On the production domain they are removed, so nothing unapproved is published.
 */
export const IS_PRODUCTION = process.env.VERCEL_ENV === 'production' || process.env.SHOW_SAMPLES === '0';
const visible = <T extends { sample?: boolean }>(e: T) => !(IS_PRODUCTION && e.sample);

type Unwrap<T> = T extends Promise<infer U> ? U : T;
type ProductEntry = NonNullable<Unwrap<ReturnType<typeof reader.collections.products.read>>>;
type CollectionEntry = NonNullable<Unwrap<ReturnType<typeof reader.collections.collections.read>>>;
type StoreEntry = NonNullable<Unwrap<ReturnType<typeof reader.collections.stores.read>>>;

export type Product = ProductEntry & { slug: string };
export type Collection = CollectionEntry & { slug: string };
export type Store = StoreEntry & { slug: string };

export const getProducts = cache(async (): Promise<Product[]> => {
  const all = await reader.collections.products.all();
  return all
    .map(({ slug, entry }) => ({ ...entry, slug }))
    .filter(visible)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
});

export const getProduct = cache(async (slug: string) => (await getProducts()).find((p) => p.slug === slug) ?? null);

export const getCollections = cache(async (): Promise<Collection[]> => {
  const all = await reader.collections.collections.all();
  return all
    .map(({ slug, entry }) => ({ ...entry, slug }))
    .filter(visible)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
});

export const getCollection = cache(async (slug: string) => (await getCollections()).find((c) => c.slug === slug) ?? null);

export const getStores = cache(async (): Promise<Store[]> => {
  const all = await reader.collections.stores.all();
  return all
    .map(({ slug, entry }) => ({ ...entry, slug }))
    .filter(visible)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
});

export const getHome = cache(() => reader.singletons.home.read());
export const getAbout = cache(() => reader.singletons.about.read());
export const getSite = cache(() => reader.singletons.site.read());

export const productName = (p: Pick<Product, 'name' | 'nameVi'>, locale: Locale) =>
  locale === 'vi' && p.nameVi ? p.nameVi : p.name;

/** Dimensions may be published when approved, or on preview builds (marked as sample). */
export const dimensionsState = (p: Product): 'approved' | 'sample' | 'hidden' => {
  const d = p.dimensions;
  if (!d || !(d.width || d.depth || d.height)) return 'hidden';
  if (d.approved) return 'approved';
  return IS_PRODUCTION ? 'hidden' : 'sample';
};

export type SearchItem = { kind: 'product' | 'collection'; slug: string; title: string; sub: string; image: string | null; terms: string };

export const getSearchIndex = cache(async (locale: Locale): Promise<SearchItem[]> => {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  const cName = new Map(collections.map((c) => [c.slug, c.name]));
  return [
    ...collections.map((c) => ({
      kind: 'collection' as const,
      slug: c.slug,
      title: c.name,
      sub: t(c.tagline, locale),
      image: c.heroImage,
      terms: [c.name, c.tagline.vi, c.tagline.en].join(' '),
    })),
    ...products.map((p) => ({
      kind: 'product' as const,
      slug: p.slug,
      title: productName(p, locale),
      sub: (p.collection && cName.get(p.collection)) || '',
      image: p.heroImage,
      terms: [p.name, p.nameVi, p.category, p.collection, p.summary.vi, p.summary.en].join(' '),
    })),
  ];
});

export const toCard = (p: Product, locale: Locale, collections: Collection[]) => ({
  slug: p.slug,
  title: productName(p, locale),
  category: p.category,
  collection: p.collection,
  collectionName: collections.find((c) => c.slug === p.collection)?.name ?? null,
  image: p.heroImage,
  alt: t(p.heroAlt, locale) || productName(p, locale),
  sample: p.sample,
});
