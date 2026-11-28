import 'server-only';
import { cache } from 'react';
import type { Bi, Locale } from '@/i18n';
import { CATEGORIES, t } from '@/i18n';
import {
  biField,
  cells,
  field,
  fieldAll,
  fileUrl,
  imagesIn,
  listFolders,
  listItems,
  num,
  readDoc,
  sectionOf,
  sectionText,
  slugOf,
  splitBi,
  warn,
  yes,
  zipBi,
  type Block,
  type Doc,
} from './folders';

/**
 * Site content, read at build time from the content/ folder (see HUONG-DAN.txt).
 *
 * Drafts ("Draft: yes") are visible on local and preview builds only. On the
 * production domain they are removed, so nothing unapproved is published.
 */
export const IS_PRODUCTION = process.env.VERCEL_ENV === 'production' || process.env.SHOW_SAMPLES === '0';
const visible = <T extends { sample?: boolean }>(e: T) => !(IS_PRODUCTION && e.sample);

/**
 * Unpublished? "Status: draft | approved | published" (written by /admin);
 * older files use "Draft: yes | no". Only "published" reaches the live site.
 */
const isDraft = (doc: Doc) => {
  const status = field(doc, 'Status').trim().toLowerCase();
  return status ? status !== 'published' : yes(field(doc, 'Draft'));
};

/** "Order: 25" in info.txt, or the position in index.txt (× 10). */
const orderOf = (doc: Doc, position: number) => num(field(doc, 'Order')) ?? position;
const byOrder = <T extends { order: number }>(list: T[]) =>
  list.map((e, i) => ({ e, i })).sort((a, b) => a.e.order - b.e.order || a.i - b.i).map(({ e }) => e);

const EMPTY: Bi = { vi: '', en: '' };
const bi = (vi: string, en: string): Bi => ({ vi, en });

/* --------------------------------------------------------------------------
   Types
   -------------------------------------------------------------------------- */
export type Option = { key: string; name: Bi; detail: Bi; swatchColor: string; swatchImage: string | null };
export type GalleryKind = 'architectural' | 'studio' | 'detail';

export type Product = {
  slug: string;
  name: string;
  nameVi: string;
  sample: boolean;
  category: string;
  collection: string | null;
  order: number;
  featured: boolean;
  typeLabel: Bi;
  summary: Bi;
  story: Bi;
  heroImage: string | null;
  heroStyle: 'cutout' | 'photo';
  cardImage: string | null;
  heroAlt: Bi;
  gallery: { image: string | null; kind: GalleryKind; alt: Bi }[];
  dimensions: { width: number | null; depth: number | null; height: number | null; seatHeight: number | null; approved: boolean };
  features: Bi[];
  materials: { label: Bi; value: Bi }[];
  materialSwatches: { image: string | null; name: Bi }[];
  frameFinishes: Option[];
  upholstery: Option[];
  versionImages: { finish: string; fabric: string; image: string | null }[];
  drawings: { image: string | null; caption: Bi; background: 'light' | 'dark' }[];
  downloads: { label: Bi; kind: 'sheet' | '2d' | '3d'; file: string | null }[];
  collectionImage: string | null;
  prices: { vnd: number | null; usd: number | null; approved: boolean };
  /** glTF/GLB model for the 360° viewer ("Model: chair.glb"), optional USDZ for iPhone AR. */
  model: { src: string; poster: string | null; ios: string | null } | null;
};

export type Collection = {
  slug: string;
  name: string;
  sample: boolean;
  order: number;
  tagline: Bi;
  intro: Bi;
  story: Bi;
  heroImage: string | null;
  heroAlt: Bi;
  sketch: string | null;
  textures: { image: string | null; caption: Bi }[];
  settingImage: string | null;
  settingAlt: Bi;
  /** Where the name sits in the opening image's negative space, and its tone. */
  namePosition: NamePosition;
  nameTone: 'light' | 'dark';
  /** Pieces visible in the opening image: product address + position in % of the photo. */
  hotspots: { slug: string; x: number; y: number }[];
};

export type NamePosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
const POSITIONS: NamePosition[] = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];

export type Store = {
  slug: string;
  name: string;
  sample: boolean;
  kind: 'showroom' | 'dealer';
  order: number;
  city: Bi;
  country: Bi;
  address: Bi;
  hours: Bi;
  phone: string;
  email: string;
  mapsUrl: string | null;
  appointmentRequired: boolean;
  bookingUrl: string | null;
  image: string | null;
};

/* --------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */
const both = (doc: Doc, pick: (b: Block) => string): Bi => bi(pick(doc.vi), pick(doc.en));
const url = (v: string) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : null);
const kindOf = (file: string): GalleryKind => (/^studio/i.test(file) ? 'studio' : /^detail/i.test(file) ? 'detail' : 'architectural');
const KIND_ORDER: GalleryKind[] = ['architectural', 'studio', 'detail'];
const RESERVED = /^(silhouette|cutout|drawing|swatch|version|cover|card)/i;

function option(doc: Doc, value: string): Option {
  const [key = '', vi = '', en = '', look = ''] = cells(value);
  return {
    key: key.toLowerCase(),
    name: bi(vi, en || vi),
    detail: EMPTY,
    swatchColor: look.startsWith('#') ? look : '',
    swatchImage: look && !look.startsWith('#') ? fileUrl(doc, look) : null,
  };
}

/** "Label: value" lines become label/value rows; plain lines are values only. */
function materialRows(doc: Doc) {
  const names = ['chất liệu', 'vật liệu', 'materials', 'material'];
  const split = (l: string) => {
    const i = l.indexOf(': ');
    return i > 0 ? { label: l.slice(0, i).trim(), value: l.slice(i + 2).trim() } : { label: '', value: l };
  };
  const vi = listItems(sectionOf(doc.vi, names)).map(split);
  const en = listItems(sectionOf(doc.en, names)).map(split);
  return Array.from({ length: Math.max(vi.length, en.length) }, (_, i) => ({
    label: bi(vi[i]?.label ?? '', en[i]?.label ?? ''),
    value: bi(vi[i]?.value ?? '', en[i]?.value ?? ''),
  }));
}

/* --------------------------------------------------------------------------
   Products
   -------------------------------------------------------------------------- */
function readProduct(folder: string, order: number): Product | null {
  const doc = readDoc(`products/${folder}`);
  if (!doc) return null;
  const nameBi = biField(doc, 'Name');
  const name = nameBi.en || nameBi.vi || folder;
  const category = field(doc, 'Category').toLowerCase();
  if (!CATEGORIES.some((c) => c.slug === category)) warn(`content/${doc.dir}: unknown Category "${category}"`);

  const photoFile = field(doc, 'Photo');
  const style = /^photo/i.test(field(doc, 'PhotoStyle')) ? 'photo' : 'cutout';
  const drawingsRaw = fieldAll(doc, 'Drawing').map(cells);
  const swatchesRaw = fieldAll(doc, 'Swatch').map(cells);
  const finishes = fieldAll(doc, 'Finish').map((v) => option(doc, v));
  const fabrics = fieldAll(doc, 'Fabric').map((v) => option(doc, v));
  const versions = fieldAll(doc, 'VersionPhoto').map((v) => {
    const [combo = '', file = ''] = cells(v);
    const [finish = '', fabric = ''] = combo.split('+').map((s) => s.trim().replace(/^\*$/, '').toLowerCase());
    return { finish, fabric, image: fileUrl(doc, file) };
  });

  // Gallery: photos by role (Hero/Room/Studio/Detail, written by /admin), or the
  // files listed in Images, or "all" = every photo in the folder, architectural → studio → detail.
  const roles: { file: string; kind: GalleryKind }[] = [
    ...fieldAll(doc, 'Hero').map((file) => ({ file, kind: 'architectural' as const })),
    ...fieldAll(doc, 'Room').map((file) => ({ file, kind: 'architectural' as const })),
    ...fieldAll(doc, 'Studio').map((file) => ({ file, kind: 'studio' as const })),
    ...fieldAll(doc, 'Detail').map((file) => ({ file, kind: 'detail' as const })),
  ];
  const roleKind = new Map(roles.map((r) => [r.file, r.kind]));
  const imagesField = field(doc, 'Images');
  let files: string[];
  if (roles.length) {
    files = roles.map((r) => r.file);
  } else if (!imagesField || /^all$/i.test(imagesField)) {
    const used = new Set([photoFile, ...drawingsRaw.map((d) => d[0]), ...swatchesRaw.map((s) => s[0])].map((f) => f?.toLowerCase()));
    files = imagesIn(doc)
      .filter((f) => !used.has(f.toLowerCase()) && !RESERVED.test(f))
      .sort((a, b) => KIND_ORDER.indexOf(kindOf(a)) - KIND_ORDER.indexOf(kindOf(b)) || a.localeCompare(b, 'en', { numeric: true }));
  } else {
    files = imagesField.split(',').map((f) => f.trim()).filter(Boolean);
  }
  const altFor: Record<GalleryKind, Bi> = {
    architectural: bi(`${name} trong không gian kiến trúc`, `${name} in an architectural setting`),
    studio: bi(`${name}, ảnh studio`, `${name}, studio view`),
    detail: bi(`Chi tiết ${name}`, `${name}, detail`),
  };
  const gallery = files
    .map((f) => {
      const kind = roleKind.get(f) ?? kindOf(f);
      return { image: fileUrl(doc, f), kind, alt: altFor[kind] };
    })
    .filter((g) => g.image);

  const [width = null, depth = null, height = null] = (field(doc, 'Size').match(/\d+/g) ?? []).map(Number);
  const heroImage = fileUrl(doc, photoFile) ?? gallery[0]?.image ?? null;
  const card = fileUrl(doc, field(doc, 'CardPhoto')) ?? gallery.find((g) => g.kind === 'architectural')?.image ?? null;

  const intro = (b: Block) => b.paragraphs;
  const features = zipBi(
    listItems(sectionOf(doc.vi, ['đặc điểm thiết kế', 'đặc điểm', 'design features', 'features'])),
    listItems(sectionOf(doc.en, ['design features', 'features', 'đặc điểm thiết kế', 'đặc điểm'])),
  );

  return {
    slug: slugOf(doc),
    name,
    nameVi: nameBi.vi !== nameBi.en ? nameBi.vi : '',
    sample: isDraft(doc),
    category,
    collection: field(doc, 'Collection').toLowerCase().replace(/^\d+[-_ .]*/, '') || null,
    order: orderOf(doc, order),
    featured: yes(field(doc, 'Featured')),
    typeLabel: biField(doc, 'Type'),
    summary: bi(intro(doc.vi)[0] ?? '', intro(doc.en)[0] ?? ''),
    story: bi(intro(doc.vi).slice(1).join('\n\n'), intro(doc.en).slice(1).join('\n\n')),
    heroImage,
    heroStyle: style,
    cardImage: card,
    heroAlt: bi(`${name}, toàn bộ sản phẩm`, `${name}, full view`),
    gallery,
    dimensions: { width, depth, height, seatHeight: num(field(doc, 'SeatHeight')), approved: yes(field(doc, 'SizeApproved')) },
    features,
    materials: materialRows(doc),
    materialSwatches: swatchesRaw.map(([f = '', vi = '', en = '']) => ({ image: fileUrl(doc, f), name: bi(vi, en || vi) })),
    frameFinishes: finishes,
    upholstery: fabrics,
    versionImages: versions,
    drawings: drawingsRaw.map(([f = '', vi = '', en = '', colour = '']) => ({
      image: fileUrl(doc, f),
      caption: bi(vi, en || vi),
      background: /^(green|xanh|dark|tối)/i.test(colour) ? 'dark' : 'light',
    })),
    downloads: fieldAll(doc, 'Download').map((v) => {
      const [f = '', kind = 'sheet', vi = '', en = ''] = cells(v);
      const k = (['sheet', '2d', '3d'] as const).find((x) => x === kind.toLowerCase()) ?? 'sheet';
      return { label: bi(vi, en || vi), kind: k, file: fileUrl(doc, f) };
    }),
    collectionImage: fileUrl(doc, field(doc, 'CollectionPhoto')),
    prices: { vnd: num(field(doc, 'PriceVND')), usd: num(field(doc, 'PriceUSD')), approved: yes(field(doc, 'PriceApproved')) },
    model: (() => {
      const src = fileUrl(doc, field(doc, 'Model'));
      if (!src) return null;
      if (!/\.(glb|gltf)$/i.test(src)) {
        warn(`content/${doc.dir}: Model must be a .glb or .gltf file`);
        return null;
      }
      return { src, poster: fileUrl(doc, field(doc, 'ModelPoster')) ?? heroImage, ios: fileUrl(doc, field(doc, 'ModelIOS')) };
    })(),
  };
}

export const getProducts = cache(async (): Promise<Product[]> => {
  const all = byOrder(
    listFolders('products')
      .map((f, i) => readProduct(f, (i + 1) * 10))
      .filter((p): p is Product => Boolean(p)),
  );
  const seen = new Set<string>();
  return all.filter(visible).filter((p) => {
    if (seen.has(p.slug)) {
      warn(`two products use the address "${p.slug}"; the second is skipped`);
      return false;
    }
    seen.add(p.slug);
    return true;
  });
});

export const getProduct = cache(async (slug: string) => (await getProducts()).find((p) => p.slug === slug) ?? null);

/* --------------------------------------------------------------------------
   Collections
   -------------------------------------------------------------------------- */
export const getCollections = cache(async (): Promise<Collection[]> => {
  const list = listFolders('collections')
    .map((folder, i): Collection | null => {
      const doc = readDoc(`collections/${folder}`);
      if (!doc) return null;
      const name = field(doc, 'Name') || folder;
      const quote = ['trích dẫn', 'quote'];
      return {
        slug: slugOf(doc),
        name,
        sample: isDraft(doc),
        order: orderOf(doc, (i + 1) * 10),
        tagline: biField(doc, 'Tagline'),
        intro: both(doc, (b) => b.paragraphs.join('\n\n')),
        story: both(doc, (b) => sectionText(sectionOf(b, quote))),
        heroImage: fileUrl(doc, field(doc, 'Photo')),
        heroAlt: field(doc, 'PhotoAlt') ? biField(doc, 'PhotoAlt') : bi(`Không gian mở đầu bộ sưu tập ${name}`, `Opening view of the ${name} collection`),
        sketch: fileUrl(doc, field(doc, 'Sketch')),
        textures: fieldAll(doc, 'Texture').map((v) => {
          const [f = '', vi = '', en = ''] = cells(v);
          return { image: fileUrl(doc, f), caption: bi(vi, en || vi) };
        }),
        settingImage: fileUrl(doc, field(doc, 'Setting')),
        settingAlt: bi(`Các thiết kế ${name} trong không gian`, `${name} pieces in their setting`),
        namePosition: POSITIONS.find((p) => p === field(doc, 'NamePosition').trim().toLowerCase()) ?? 'bottom-left',
        nameTone: /^(dark|tối|toi)/i.test(field(doc, 'NameTone')) ? 'dark' : 'light',
        hotspots: fieldAll(doc, 'Hotspot')
          .map(cells)
          .map(([slug = '', x = '', y = '']) => ({ slug: slug.toLowerCase().replace(/^\d+[-_ .]*/, ''), x: parseFloat(x.replace(",", ".")), y: parseFloat(y.replace(",", ".")) }))
          .filter((h) => h.slug && h.x >= 0 && h.x <= 100 && h.y >= 0 && h.y <= 100),
      };
    })
    .filter((c): c is Collection => Boolean(c))
    .filter(visible);
  return byOrder(list);
});

export const getCollection = cache(async (slug: string) => (await getCollections()).find((c) => c.slug === slug) ?? null);

/* --------------------------------------------------------------------------
   Stores
   -------------------------------------------------------------------------- */
export const getStores = cache(async (): Promise<Store[]> => {
  const list = listFolders('stores')
    .map((folder, i): Store | null => {
      const doc = readDoc(`stores/${folder}`);
      if (!doc) return null;
      const lines = (b: Bi): Bi => ({ vi: b.vi.replace(/\s*;\s*/g, '\n'), en: b.en.replace(/\s*;\s*/g, '\n') });
      return {
        slug: slugOf(doc),
        name: field(doc, 'Name') || folder,
        sample: isDraft(doc),
        kind: /^dealer|đại lý/i.test(field(doc, 'Kind')) ? 'dealer' : 'showroom',
        order: orderOf(doc, (i + 1) * 10),
        city: biField(doc, 'City'),
        country: biField(doc, 'Country'),
        address: lines(biField(doc, 'Address')),
        hours: lines(biField(doc, 'Hours')),
        phone: field(doc, 'Tel') || field(doc, 'Phone'),
        email: field(doc, 'Email'),
        mapsUrl: url(field(doc, 'Map')),
        appointmentRequired: yes(field(doc, 'Appointment')),
        bookingUrl: url(field(doc, 'Booking')),
        image: fileUrl(doc, field(doc, 'Photo')),
      };
    })
    .filter((s): s is Store => Boolean(s))
    .filter(visible);
  return byOrder(list);
});

/* --------------------------------------------------------------------------
   Pages
   -------------------------------------------------------------------------- */
/** "Video: https://youtu.be/ID" (or a YouTube watch/embed link), or a file in the folder (hero.mp4). */
function videoOf(doc: Doc, value: string): { kind: 'youtube'; id: string } | { kind: 'file'; src: string } | null {
  const v = value.trim();
  if (!v) return null;
  const yt = v.match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/))([\w-]{11})/i);
  if (yt) return { kind: 'youtube', id: yt[1] };
  if (/^[\w-]{11}$/.test(v) && !/\./.test(v)) return { kind: 'youtube', id: v };
  const src = fileUrl(doc, v);
  if (src && /\.(mp4|webm)$/i.test(src)) return { kind: 'file', src };
  warn(`content/${doc.dir}: Video "${v}" is not a YouTube link or an .mp4/.webm file in the folder`);
  return null;
}

export const getHome = cache(async () => {
  const doc = readDoc('home');
  if (!doc) return null;
  const text = (names: string[]) => both(doc, (b) => sectionText(sectionOf(b, names)));
  return {
    heroCollection: field(doc, 'Collection').toLowerCase().replace(/^\d+[-_ .]*/, '') || null,
    heroImage: fileUrl(doc, field(doc, 'Photo')),
    heroImageMobile: fileUrl(doc, field(doc, 'PhotoMobile')),
    heroAlt: biField(doc, 'PhotoAlt'),
    video: videoOf(doc, field(doc, 'Video')),
    introTitle: biField(doc, 'IntroTitle'),
    introText: text(['giới thiệu', 'introduction', 'intro']),
    curatedTitle: biField(doc, 'CuratedTitle'),
    workshopTitle: biField(doc, 'WorkshopTitle'),
    workshopText: text(['xưởng', 'xưởng & con người', 'workshop']),
    workshopImages: fieldAll(doc, 'Workshop').map((v) => {
      const [f = '', vi = '', en = ''] = cells(v);
      return { image: fileUrl(doc, f), caption: bi(vi, en || vi) };
    }),
  };
});

export const getAbout = cache(async () => {
  const doc = readDoc('about');
  if (!doc) return null;
  const special = ['trích dẫn', 'quote', 'giá trị cốt lõi', 'core values', 'values'];
  const chapters = (b: Block) =>
    b.sections
      .filter((s) => !special.includes(s.heading.toLowerCase()))
      .map((s) => {
        const [eyebrow, title] = s.heading.includes('|') ? cells(s.heading) : ['', s.heading];
        const img = s.lines.map((l) => l.match(/^\s*(?:Ảnh|Anh|Photo|Image)\s*:\s*(.+)$/i)?.[1]).find(Boolean) ?? '';
        const lines = s.lines.filter((l) => !/^\s*(?:Ảnh|Anh|Photo|Image)\s*:/i.test(l));
        return { eyebrow, title, img, text: sectionText({ heading: '', lines }) };
      });
  const vi = chapters(doc.vi);
  const en = chapters(doc.en);
  const values = (b: Block) =>
    listItems(sectionOf(b, ['giá trị cốt lõi', 'core values', 'values'])).map((l) => {
      const i = l.indexOf(': ');
      return i > 0 ? { title: l.slice(0, i), text: l.slice(i + 2) } : { title: l, text: '' };
    });
  const vv = values(doc.vi);
  const ve = values(doc.en);
  return {
    title: biField(doc, 'Title'),
    lead: both(doc, (b) => b.paragraphs.join('\n\n')),
    heroImage: fileUrl(doc, field(doc, 'Photo')),
    chapters: Array.from({ length: Math.max(vi.length, en.length) }, (_, i) => ({
      eyebrow: bi(vi[i]?.eyebrow ?? '', en[i]?.eyebrow ?? ''),
      title: bi(vi[i]?.title ?? '', en[i]?.title ?? ''),
      text: bi(vi[i]?.text ?? '', en[i]?.text ?? ''),
      image: fileUrl(doc, vi[i]?.img || en[i]?.img || ''),
      alt: bi(vi[i]?.title ?? '', en[i]?.title ?? ''),
    })),
    quote: both(doc, (b) => sectionText(sectionOf(b, ['trích dẫn', 'quote']))),
    quoteImage: fileUrl(doc, field(doc, 'QuotePhoto')),
    principles: Array.from({ length: Math.max(vv.length, ve.length) }, (_, i) => ({
      title: bi(vv[i]?.title ?? '', ve[i]?.title ?? ''),
      text: bi(vv[i]?.text ?? '', ve[i]?.text ?? ''),
    })),
  };
});

export const getSite = cache(async () => {
  const doc = readDoc('contact');
  if (!doc) return null;
  return {
    company: field(doc, 'Company') || 'VBamboo',
    email: field(doc, 'Email').split(',')[0]?.trim() ?? '',
    phone: field(doc, 'Tel') || field(doc, 'Phone'),
    address: splitBi(field(doc, 'Address')),
    instagram: url(field(doc, 'Instagram')),
    facebook: url(field(doc, 'Facebook')),
    linkedin: url(field(doc, 'LinkedIn')),
    footerNote: biField(doc, 'Footer'),
    showPrices: yes(field(doc, 'ShowPrices')),
  };
});

/* --------------------------------------------------------------------------
   Derived
   -------------------------------------------------------------------------- */
export const productName = (p: Pick<Product, 'name' | 'nameVi'>, locale: Locale) =>
  locale === 'vi' && p.nameVi ? p.nameVi : p.name;

/** Dimensions may be published when approved, or on preview builds (marked as unconfirmed). */
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
      terms: [p.name, p.nameVi, p.category, p.collection, p.typeLabel.vi, p.typeLabel.en, p.summary.vi, p.summary.en].join(' '),
    })),
  ];
});

export const toCard = (p: Product, locale: Locale, collections: Collection[]) => ({
  slug: p.slug,
  title: productName(p, locale),
  category: p.category,
  collection: p.collection,
  collectionName: collections.find((c) => c.slug === p.collection)?.name ?? null,
  typeLabel: t(p.typeLabel, locale),
  image: p.heroImage,
  imageStyle: p.heroStyle,
  hoverImage: p.cardImage && p.cardImage !== p.heroImage ? p.cardImage : null,
  alt: t(p.heroAlt, locale) || productName(p, locale),
  sample: p.sample,
});

/** Categories that currently have at least one visible product, in menu order. */
export const getCategoriesInUse = cache(async () => new Set((await getProducts()).map((p) => p.category)));
