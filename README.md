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
- **Sample content never reaches production**: every placeholder entry has `sample: true`. On the production deployment (`VERCEL_ENV=production`) sample entries are removed. Preview deployments show them with a "Sample content" badge.
- **Dimensions are only published when approved**: tick "Dimensions approved for publication" per product. Until then, previews show them marked "Sample figures" and production shows "Dimensions available on request".
- **Prices**: hidden at launch (request a quote). Each product has VND and USD prices plus an "approved" tick; turn on "Show prices publicly" in *Contact details & footer* to show VND on `/vi` and USD on `/en`.
- **Technical drawings**: upload front/side/plan per product. If none are uploaded, a scaled schematic is drawn from the dimensions.
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

- Replace all sample entries with real ones (or untick "Sample content" once an entry is real).
- Approve dimensions per product.
- Fill in *Contact details & footer* (address, email, phone, social links).

## Placeholder imagery

`scripts/placeholders/generate.mjs` produced the labelled illustrations in `public/images` and the sample JSON in `content/`. Re-running it overwrites sample content, so don't run it after real content has been entered.
