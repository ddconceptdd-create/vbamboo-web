# VBamboo website

Bilingual (Vietnamese default, English) catalogue site for VBamboo bamboo furniture.
Next.js 16 (App Router), statically generated. Content is edited as plain folders in `content/` (same layout as the DDConcept v11 site), see `HUONG-DAN.txt`.

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000  → redirects to /vi
npm run build && npm start
```

`npm run dev` and `npm run build` first copy the photos from `content/` to `public/content/` (`scripts/sync-content.mjs`).

## Editing content

All content lives in **`content/`**, organised like the DDConcept v11 site: one folder per item with an `info.txt` and its photos, an `index.txt` per section for the display order, and a `_TEMPLATE` folder to copy. **The Vietnamese guide for the VBamboo team is [`HUONG-DAN.txt`](HUONG-DAN.txt).**

| Section | Where |
| --- | --- |
| Products | `content/products/NN-slug/` — `info.txt`, `silhouette.*`, `hero.jpg`, `room-*`, `studio-*`, `detail-*`, `drawing-*`, `swatch-*` |
| Collections | `content/collections/NN-slug/` — `info.txt`, `hero.jpg`, `sketch.webp`, `texture-*`, `setting.jpg` |
| Stores & dealers | `content/stores/NN-slug/` |
| Home, About, Contact & footer | `content/home/`, `content/about/`, `content/contact/` |

`info.txt`: fields above `---` (`Key: Tiếng Việt | English`), then `[VI]` and `[EN]` text with `## Section` headings and `- ` list items. The folder name without its number is the page address (`01-bosento-sofa` → `/vi/products/bosento-sofa`). The parser is `src/lib/folders.ts` + `src/lib/content.ts`; problems (missing files, unknown folders) are printed as `[content] …` warnings during the build and the affected item is skipped rather than breaking the site.

## Code structure

| Area | Where |
| --- | --- |
| Pages | `src/app/[locale]/…` — home, about, products, products/[slug], collections, collections/[slug], stores, contact |
| Interface text (both languages) | `src/i18n/index.ts` |
| Brand assets | `public/brand/` — the supplied logo files (bamboo-yellow and grey, transparent WebP; the emblem-only files are straight crops), woven texture |
| Design tokens & styles | `src/styles/globals.css`, `src/styles/site.css` |
| Enquiry endpoint | `src/app/api/enquiry/route.ts` |

### Key behaviours

- **Home film**: `Video:` in `content/home/info.txt` (YouTube link or an .mp4/.webm in the folder) plays muted over the poster photo, with a pause button. It never autoplays under "reduce motion" or Save-Data, and pauses when scrolled away (`HeroVideo.tsx`).
- **Collection opening frame**: the photo opens out as you scroll (`ScrollMotion.tsx`, `data-expand`), the name sits where `NamePosition`/`NameTone` say, and `Hotspot: product | x | y` places clickable markers on the pieces (`CollectionHero.tsx`).
- **Home collections showcase** (`CollectionShowcase.tsx`, GSAP Timeline + Flip): the active collection's catalogue opening photo (`Opening`, `OpeningFocus`) fills the screen, three vertical preview cards sit on the right; every 7 s (or on click, arrow keys, a horizontal sweep or swipe) the next card expands into the full hero while the others shift left, titles rise through a vertical mask, with progress bar, counter and pause. Reduced motion: no autoplay, instant changes.
- **Products page**: studio shot by default, room photo on hover; touch screens get a Studio / Room switch per card and a swipe, plus a page-wide switch.
- **Product page** (Norm/Tribù): opening room shot → sticky product bar (form, materials, versions, size & drawings, 3D, enquire) → studio silhouette with design features → wide views interleaved with close-ups → material tiles. Every image opens the zoom viewer (`ZoomLightbox.tsx`, tap to zoom 2.5×, drag to pan).
- **3D**: `Model: file.glb` (+ optional `ModelPoster`, `ModelIOS` .usdz) shows a `<model-viewer>` that loads only when the visitor asks; Draco compression is supported (decoder self-hosted in public/draco). Preview builds show the empty slot.

- **Language switch keeps place**: `/vi/products/sands-sofa?finish=smoked&fabric=clay` ↔ `/en/products/sands-sofa?finish=smoked&fabric=clay`.
- **Product versions live in the URL** (`?finish=&fabric=`), so a version can be shared, and "Enquire to purchase" carries it into the contact form.
- **Drafts never reach production**: `Draft: yes` in an `info.txt` hides the item on the production deployment (`VERCEL_ENV=production`); preview deployments show it with a "Draft" badge.
- **Dimensions are only published when approved** (`SizeApproved: yes`). Until then, previews show them marked "not yet confirmed" and production shows "Dimensions available on request".
- **Prices**: hidden at launch (request a quote). `PriceVND`, `PriceUSD`, `PriceApproved: yes` per product plus `ShowPrices: yes` in `content/contact/info.txt` show VND on `/vi` and USD on `/en`.
- **Product introduction photo**: `PhotoStyle: cutout` shows a cut-out or white-background studio shot whole on an ivory panel; `photo` fills the frame. `CardPhoto` cross-fades in when hovering over a product card.
- **Technical drawings**: any number per product, each with a caption and a panel colour (ivory for dark line work, green for light line work), opening full size. Without drawings, a scaled schematic is drawn from approved dimensions.
- **Motion**: entrance effects and image cross-fades use only opacity/transform and switch off under "reduce motion". Specification, swatch and drawing sections are intentionally static.

## Deploy on Vercel

1. Import the GitHub repository at [vercel.com/new](https://vercel.com/new) (framework: Next.js, no settings needed). Every push to `main` redeploys production; other branches get preview links.
2. Environment variables (Project → Settings → Environment Variables):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://vbamboo.vn` (used for social previews) |
| `RESEND_API_KEY` | Sends enquiry emails via [Resend](https://resend.com). Without it, enquiries are written to the Vercel function log. |
| `ENQUIRY_TO` | Inbox(es) receiving enquiries, comma-separated |
| `ENQUIRY_FROM` | Sender, e.g. `VBamboo website <web@vbamboo.vn>` (domain verified in Resend) |

### Before connecting the domain

- Review the drafts and the items listed under *Content status* below.
- Approve dimensions per product.
- Fill in `content/contact/info.txt` (enquiries email shown in the footer, social links).

## Content status (catalogue import, 25 Nov 2026)

Content comes from the 2026 catalogue (Canva). English is a draft translation for VBamboo to review.

| Item | State on the live site |
| --- | --- |
| Voyager, Oasis Parasol | Drafts: only a small overview photo exists, no product page in the catalogue |
| Borsani, Baroness, Sandy, Captain | Dimensions hidden: the catalogue gives conflicting figures |
| Tabouret Table, Nan, Lotus, Forest, XChair, Baroness, Explorer | No product description (missing or copied from another product in the catalogue) |
| Gentleman seat/back material, Moonlight fibre | Not shown: marked "[xác nhận]" in the catalogue |
| A-Line Bamboo | Opening photo from the catalogue shows the Kink lamp, so it is left out; the studio shot is only 512 px |
| Showroom "VBamboo Hồ Chí Minh" | Draft: address from the catalogue, opening hours and photo still needed |
| Prices, finishes/upholstery options, product sheets, 2D/3D files | Not in the catalogue yet |

Photos are the catalogue exports (mostly 1,376 px wide) and several carry a small sparkle mark in a corner; higher-resolution originals will look sharper on large screens.

## Catalogue import

The 2026 catalogue was imported from the Canva export (scripts in the git history, commit `cf820c3`), then converted into the `content/` folders. Edit `content/` directly from now on.
