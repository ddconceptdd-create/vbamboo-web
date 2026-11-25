# VBamboo website

Bilingual (Vietnamese default, English) catalogue site for VBamboo bamboo furniture.
Next.js 16 (App Router), statically generated, with a built-in content editor (Keystatic).

## Run locally

```bash
npm install
npm run dev          # http://localhost:3000  → redirects to /vi
                     # http://localhost:3000/keystatic  → content editor
npm run build && npm start
```

## Structure

| Area | Where |
| --- | --- |
| Pages | `src/app/[locale]/…` — home, about, products, products/[slug], collections, collections/[slug], stores, contact |
| Content (edited in /keystatic) | `content/products`, `content/collections`, `content/stores`, `content/pages` (JSON) |
| Images & files | `public/images/…`, `public/downloads/…` |
| Content model | `keystatic.config.ts` |
| Interface text (both languages) | `src/i18n/index.ts` |
| Brand assets (traced from the cover) | `public/brand/` — logo SVGs, woven texture |
| Design tokens & styles | `src/styles/globals.css`, `src/styles/site.css` |
| Enquiry endpoint | `src/app/api/enquiry/route.ts` |

### Key behaviours

- **Language switch keeps place**: `/vi/products/sands-sofa?finish=smoked&fabric=clay` ↔ `/en/products/sands-sofa?finish=smoked&fabric=clay`.
- **Product versions live in the URL** (`?finish=&fabric=`), so a version can be shared, and "Enquire to purchase" carries it into the contact form.
- **Drafts never reach production**: tick "Draft (hidden on the live site)" on any product, collection or store that is incomplete or unconfirmed. On the production deployment (`VERCEL_ENV=production`) drafts are removed; preview deployments show them with a "Draft" badge.
- **Dimensions are only published when approved**: tick "Dimensions approved for publication" per product. Until then, previews show them marked "not yet confirmed" and production shows "Dimensions available on request".
- **Prices**: hidden at launch (request a quote). Each product has VND and USD prices plus an "approved" tick; turn on "Show prices publicly" in *Contact details & footer* to show VND on `/vi` and USD on `/en`.
- **Product introduction photo**: choose "Cut-out / studio on white" for a clear silhouette (shown whole on an ivory panel; white studio backgrounds melt into it) or "Full photograph". The architectural photo for product cards appears when a visitor hovers over a card.
- **Technical drawings**: add any number of drawings per product, each with a caption (e.g. Mặt đứng / Front elevation) and a panel colour: ivory for drawings with dark lines, green for drawings with light lines. Visitors can open each drawing full size. If none are uploaded, a scaled schematic is drawn from the dimensions.
- **Motion**: entrance effects and image cross-fades use only opacity/transform and switch off under "reduce motion". Specification, swatch and drawing sections are intentionally static.

## Deploy on Vercel

1. Push this repository to GitHub and import it in Vercel (framework: Next.js, no settings needed).
2. Environment variables (Project → Settings → Environment Variables):

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | e.g. `https://vbamboo.vn` (used for social previews) |
| `RESEND_API_KEY` | Sends enquiry emails via [Resend](https://resend.com). Without it, enquiries are written to the Vercel function log. |
| `ENQUIRY_TO` | Inbox(es) receiving enquiries, comma-separated |
| `ENQUIRY_FROM` | Sender, e.g. `VBamboo website <web@vbamboo.vn>` (domain verified in Resend) |
| `NEXT_PUBLIC_KEYSTATIC_STORAGE` | `github` to enable the online editor (below) |
| `NEXT_PUBLIC_KEYSTATIC_GITHUB_OWNER` / `NEXT_PUBLIC_KEYSTATIC_GITHUB_REPO` | The repository holding this site |
| `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`, `KEYSTATIC_SECRET`, `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | Created by Keystatic's GitHub App setup |

### Online content editor (for the VBamboo team)

1. Set `NEXT_PUBLIC_KEYSTATIC_STORAGE=github` and the owner/repo variables, then run `npm run dev` once and open `/keystatic`. Keystatic walks you through creating a GitHub App and prints the four `KEYSTATIC_*` values; add them to Vercel.
2. Team members sign in at `https://<site>/keystatic` with GitHub (they need write access to the repo).
3. Every save is a commit; Vercel rebuilds and the change is live in about a minute. Editors can add collections, swap product photos, edit both languages and replace drawings or PDFs without touching code.

### Before connecting the domain

- Review the drafts and the items listed under *Content status* below.
- Approve dimensions per product.
- Fill in *Contact details & footer* (enquiries email, social links).

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

`scripts/catalogue/import.py` (Python 3 + Pillow) imported the catalogue export: it picks the clearest image per product, removes near-duplicate photos, sets the drawing panel colours and writes everything into `content/` and `public/images/`. Re-running it overwrites the catalogue entries, so don't run it again once the team has edited content in `/keystatic`.
