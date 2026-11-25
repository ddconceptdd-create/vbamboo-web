import { config, collection, singleton, fields } from '@keystatic/core';

/**
 * VBamboo content editor.
 *
 * Editors open /keystatic on the site. Locally it writes straight to the
 * `content/` and `public/images/` folders. On Vercel it is switched to GitHub
 * mode (see README) so every save becomes a commit and the site redeploys.
 */

const CATEGORY_OPTIONS = [
  { label: 'Sofas / Sofa', value: 'sofas' },
  { label: 'Chairs / Ghế', value: 'chairs' },
  { label: 'Lounge chairs / Ghế thư giãn', value: 'lounge-chairs' },
  { label: 'Ottomans / Đôn', value: 'ottomans' },
  { label: 'Tables / Bàn', value: 'tables' },
  { label: 'Coffee tables / Bàn trà', value: 'coffee-tables' },
  { label: 'Lamps / Đèn', value: 'lamps' },
  { label: 'Shelving / Kệ', value: 'shelving' },
  { label: 'Umbrellas / Dù', value: 'umbrellas' },
] as const;

/** A text field that is filled in both languages. */
const bi = (label: string, opts: { multiline?: boolean; description?: string } = {}) =>
  fields.object(
    {
      vi: fields.text({ label: 'Tiếng Việt', multiline: opts.multiline }),
      en: fields.text({ label: 'English', multiline: opts.multiline }),
    },
    { label, description: opts.description },
  );

const img = (label: string, dir: string, description?: string) =>
  fields.image({ label, directory: `public/images/${dir}`, publicPath: `/images/${dir}/`, description });

const sampleFlag = fields.checkbox({
  label: 'Sample content (hidden on the live site)',
  description:
    'Tick for placeholder entries. Sample entries are shown on preview links only and never on the production domain.',
  defaultValue: false,
});

const optionSchema = (dir: string) =>
  fields.object({
    key: fields.text({
      label: 'Code',
      description: 'Short code used in links, e.g. "natural" or "sand-linen". Lowercase, no spaces.',
      validation: { length: { min: 1 } },
    }),
    name: bi('Name'),
    detail: bi('Detail', { description: 'e.g. "100% linen, 450 g/m²" or "Smoked bamboo, matte lacquer"' }),
    swatchColor: fields.text({ label: 'Swatch colour (hex)', description: 'Used when there is no swatch photo, e.g. #C9B38C' }),
    swatchImage: img('Swatch photo', dir),
  });

export default config({
  storage:
    process.env.NEXT_PUBLIC_KEYSTATIC_STORAGE === 'github'
      ? {
          kind: 'github',
          repo: {
            owner: process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_OWNER ?? 'vbamboo',
            name: process.env.NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO ?? 'vbamboo-web',
          },
        }
      : { kind: 'local' },
  ui: {
    brand: { name: 'VBamboo' },
    navigation: {
      Catalogue: ['products', 'collections'],
      Places: ['stores'],
      Pages: ['home', 'about', 'site'],
    },
  },
  collections: {
    products: collection({
      label: 'Products',
      slugField: 'name',
      path: 'content/products/*',
      format: { data: 'json' },
      columns: ['name', 'category'],
      schema: {
        name: fields.slug({
          name: { label: 'Product name (English)', description: 'The web address is created from this name.' },
        }),
        nameVi: fields.text({ label: 'Product name (Tiếng Việt)' }),
        sample: sampleFlag,
        category: fields.select({ label: 'Furniture type', options: [...CATEGORY_OPTIONS], defaultValue: 'chairs' }),
        collection: fields.relationship({ label: 'Collection', collection: 'collections' }),
        order: fields.integer({ label: 'Sort order', defaultValue: 10 }),
        featured: fields.checkbox({ label: 'Show on the home page', defaultValue: false }),
        summary: bi('What distinguishes the design', { multiline: true, description: 'One short paragraph under the product name.' }),
        story: bi('Design narrative', { multiline: true }),
        heroImage: img('Introduction photo (clear silhouette)', 'products'),
        heroAlt: bi('Introduction photo description (for screen readers)'),
        gallery: fields.array(
          fields.object({
            image: img('Photo', 'products'),
            kind: fields.select({
              label: 'Shot type',
              options: [
                { label: 'Architectural setting', value: 'architectural' },
                { label: 'Studio', value: 'studio' },
                { label: 'Detail close-up', value: 'detail' },
              ],
              defaultValue: 'architectural',
            }),
            alt: bi('Description'),
          }),
          { label: 'Image gallery (architectural → studio → detail)', itemLabel: (p) => p.fields.kind.value },
        ),
        dimensions: fields.object(
          {
            width: fields.integer({ label: 'Width (mm)' }),
            depth: fields.integer({ label: 'Depth (mm)' }),
            height: fields.integer({ label: 'Height (mm)' }),
            seatHeight: fields.integer({ label: 'Seat height (mm), if relevant' }),
            approved: fields.checkbox({
              label: 'Dimensions approved for publication',
              description: 'Dimensions only appear on the live site once this is ticked.',
              defaultValue: false,
            }),
          },
          { label: 'Dimensions' },
        ),
        materials: fields.array(fields.object({ label: bi('Label'), value: bi('Value') }), {
          label: 'Material specifications',
          itemLabel: (p) => p.fields.label.fields.en.value || 'Material',
        }),
        frameFinishes: fields.array(optionSchema('products/swatches'), {
          label: 'Frame finishes',
          itemLabel: (p) => p.fields.name.fields.en.value || p.fields.key.value,
        }),
        upholstery: fields.array(optionSchema('products/swatches'), {
          label: 'Upholstery / colour options',
          description: 'Leave empty for pieces without fabric.',
          itemLabel: (p) => p.fields.name.fields.en.value || p.fields.key.value,
        }),
        versionImages: fields.array(
          fields.object({
            finish: fields.text({ label: 'Frame finish code (blank = any)' }),
            fabric: fields.text({ label: 'Upholstery code (blank = any)' }),
            image: img('Photo of this version', 'products/versions'),
          }),
          {
            label: 'Photos per version',
            description: 'Shown when a visitor selects that combination of finish and upholstery.',
            itemLabel: (p) => `${p.fields.finish.value || 'any'} / ${p.fields.fabric.value || 'any'}`,
          },
        ),
        drawings: fields.object(
          {
            front: img('Front view', 'drawings'),
            side: img('Side view', 'drawings'),
            plan: img('Plan view', 'drawings'),
          },
          { label: 'Technical drawings' },
        ),
        downloads: fields.array(
          fields.object({
            label: bi('Label'),
            kind: fields.select({
              label: 'Type',
              options: [
                { label: 'Product sheet (PDF)', value: 'sheet' },
                { label: '2D drawing (DWG/DXF/PDF)', value: '2d' },
                { label: '3D model (OBJ/FBX/SKP/3DS)', value: '3d' },
              ],
              defaultValue: 'sheet',
            }),
            file: fields.file({ label: 'File', directory: 'public/downloads', publicPath: '/downloads/' }),
          }),
          { label: 'Downloads for architects', itemLabel: (p) => p.fields.label.fields.en.value || 'Download' },
        ),
        collectionImage: img('Closing photo with the rest of the collection', 'products'),
        prices: fields.object(
          {
            vnd: fields.integer({ label: 'Price in VND (Vietnam market)' }),
            usd: fields.integer({ label: 'Price in USD (international market)' }),
            approved: fields.checkbox({ label: 'Prices are from the approved price list', defaultValue: false }),
          },
          {
            label: 'Prices (not shown at launch)',
            description: 'Prices appear only when "Show prices publicly" is ticked in Contact details & footer AND the prices here are approved.',
          },
        ),
      },
    }),
    collections: collection({
      label: 'Collections',
      slugField: 'name',
      path: 'content/collections/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Collection name', description: 'Usually the same in both languages, e.g. "The Sands".' } }),
        sample: sampleFlag,
        order: fields.integer({ label: 'Sort order', defaultValue: 10 }),
        tagline: bi('Tagline'),
        intro: bi('Introduction', { multiline: true }),
        story: bi('Story', { multiline: true }),
        heroImage: img('Opening wide photograph', 'collections'),
        heroAlt: bi('Opening photo description'),
        textures: fields.array(
          fields.object({ image: img('Texture close-up', 'collections'), caption: bi('Caption') }),
          { label: 'Texture close-ups', itemLabel: (p) => p.fields.caption.fields.en.value || 'Texture' },
        ),
        settingImage: img('Furniture in the setting', 'collections'),
        settingAlt: bi('Setting photo description'),
      },
    }),
    stores: collection({
      label: 'Stores & dealers',
      slugField: 'name',
      path: 'content/stores/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({ name: { label: 'Name' } }),
        sample: sampleFlag,
        kind: fields.select({
          label: 'Type',
          options: [
            { label: 'VBamboo showroom', value: 'showroom' },
            { label: 'Authorised dealer', value: 'dealer' },
          ],
          defaultValue: 'showroom',
        }),
        order: fields.integer({ label: 'Sort order', defaultValue: 10 }),
        city: bi('City'),
        country: bi('Country'),
        address: bi('Address', { multiline: true }),
        hours: bi('Opening hours', { multiline: true }),
        phone: fields.text({ label: 'Phone' }),
        email: fields.text({ label: 'Email' }),
        mapsUrl: fields.url({ label: 'Google Maps link (for directions)' }),
        appointmentRequired: fields.checkbox({ label: 'Visits by appointment', defaultValue: false }),
        bookingUrl: fields.url({
          label: 'External booking link (optional)',
          description: 'Leave empty to use the built-in appointment request form.',
        }),
        image: img('Photo', 'stores'),
      },
    }),
  },
  singletons: {
    home: singleton({
      label: 'Home page',
      path: 'content/pages/home',
      format: { data: 'json' },
      schema: {
        heroCollection: fields.relationship({ label: 'Collection shown in the opening image', collection: 'collections' }),
        heroImage: img('Opening full-width image', 'pages'),
        heroImageMobile: img('Opening image for phones (portrait crop, optional)', 'pages'),
        heroAlt: bi('Opening image description'),
        introTitle: bi('Introduction title'),
        introText: bi('Introduction text', { multiline: true }),
        curatedTitle: bi('Curated selection title'),
        workshopTitle: bi('Workshop title'),
        workshopText: bi('Workshop text', { multiline: true }),
        workshopImages: fields.array(
          fields.object({ image: img('Photo', 'pages'), caption: bi('Caption') }),
          { label: 'Workshop & people photos', itemLabel: (p) => p.fields.caption.fields.en.value || 'Photo' },
        ),
      },
    }),
    about: singleton({
      label: 'About page',
      path: 'content/pages/about',
      format: { data: 'json' },
      schema: {
        title: bi('Title'),
        lead: bi('Opening statement', { multiline: true }),
        heroImage: img('Opening image (bamboo grove)', 'pages'),
        chapters: fields.array(
          fields.object({
            eyebrow: bi('Small heading'),
            title: bi('Title'),
            text: bi('Text', { multiline: true }),
            image: img('Image', 'pages'),
            alt: bi('Image description'),
          }),
          { label: 'Chapters (origins, craft, materials, responsibility)', itemLabel: (p) => p.fields.title.fields.en.value || 'Chapter' },
        ),
        principles: fields.array(fields.object({ title: bi('Title'), text: bi('Text', { multiline: true }) }), {
          label: 'Philosophy',
          itemLabel: (p) => p.fields.title.fields.en.value || 'Principle',
        }),
      },
    }),
    site: singleton({
      label: 'Contact details & footer',
      path: 'content/pages/site',
      format: { data: 'json' },
      schema: {
        email: fields.text({ label: 'Enquiries email' }),
        phone: fields.text({ label: 'Phone' }),
        address: bi('Head office address', { multiline: true }),
        instagram: fields.url({ label: 'Instagram' }),
        facebook: fields.url({ label: 'Facebook' }),
        linkedin: fields.url({ label: 'LinkedIn' }),
        footerNote: bi('Footer note'),
        showPrices: fields.checkbox({
          label: 'Show prices publicly',
          description: 'Off at launch (request a quote). When on, approved prices show in VND on the Vietnamese site and USD on the English site.',
          defaultValue: false,
        }),
      },
    }),
  },
});

export { CATEGORY_OPTIONS };
