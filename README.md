# Abbeygate England — Next.js Frontend

Headless Next.js storefront for [corporate.abbeygate-england.com](https://corporate.abbeygate-england.com/), connected to the existing **WordPress + WooCommerce** backend.

This doc is a handoff for developers: what was built, where the code lives, and how to run it.

---

## Quick start

```bash
npm install
cp .env.example .env.local
# Edit .env.local with your WooCommerce keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables (`.env.local`)

```env
# Site origin ONLY — do NOT include /wp-json/wc/v3
WOOCOMMERCE_STORE_URL=https://corporate.abbeygate-england.com
WOOCOMMERCE_CONSUMER_KEY=ck_xxxxxxxx
WOOCOMMERCE_CONSUMER_SECRET=cs_xxxxxxxx
```

| Variable | Required? | Purpose |
|---|---|---|
| `WOOCOMMERCE_STORE_URL` | Recommended | Site origin. Defaults to Abbeygate URL if missing. |
| `WOOCOMMERCE_CONSUMER_KEY` | For B2B tier pricing | WooCommerce REST API key |
| `WOOCOMMERCE_CONSUMER_SECRET` | For B2B tier pricing | WooCommerce REST API secret |

**Important:** `WOOCOMMERCE_STORE_URL` must be `https://corporate.abbeygate-england.com` — **not** `.../wp-json/wc/v3`. Pasting the full API path causes Store API 404s.

Generate keys in WP: **WooCommerce → Settings → Advanced → REST API**.

Product listing / PDP work without keys (public Store API). Keys unlock accurate **B2B King** tier pricing on PDP.

---

## Architecture overview

```
WordPress / WooCommerce (source of truth)
        │
        ├── Store API  /wp-json/wc/store/v1/*   (public — products, categories, attributes)
        └── REST API   /wp-json/wc/v3/*         (auth — meta/B2B pricing)
        │
Next.js App (this repo)
        ├── PLP (category pages + filters)
        ├── PDP (customisation + tier pricing)
        ├── Cart (localStorage + shipping calculator)
        └── Mega-menu (static nav → category routes)
```

Folder rules (see `.agents/AGENTS.md`):

| Path | Role |
|---|---|
| `src/app/` | Routes only — thin page composers |
| `src/features/` | Domain logic (products, cart, enquiry) |
| `src/lib/` | Third-party clients (WooCommerce) |
| `src/components/` | Shared UI (layout, home, ui) |
| `src/data/` | Static data (nav, category route map) |

---

## What was built (commerce layer)

Ported from the live WordPress site’s custom PHP/JS:

1. **Product fetching by category** (all WC category IDs mapped)
2. **Shopify-style filters** (Collection / Colour / Layout / Size + cross-filtering)
3. **PDP Abbey customisation UI** (logo upload, blocking type, position, qty ≥ 25)
4. **Pricing logic** (B2B tiers / bulk discount / £0.52 logo fee)
5. **Hybrid shipping calculator** (carton / pallet rules from WP)
6. **Cart** (drawer + `/cart` page, localStorage persistence)
7. **Mega-menu destinations** wired to real category pages

---

## File map — where everything lives

### WooCommerce clients

| File | What it does |
|---|---|
| `src/lib/woocommerce/config.ts` | Normalises store URL (strips accidental `/wp-json/...`) |
| `src/lib/woocommerce/store-api.ts` | **Public** Store API fetch (`wc/store/v1`) — products, categories, attributes |
| `src/lib/woocommerce/client.ts` | **Authenticated** REST client (`wc/v3`) + `woocommerceApi` helper — server-only |

Usage (server components / services only — never in client components):

```ts
import { woocommerceApi } from "@/lib/woocommerce/client";
import { getStoreProducts } from "@/features/products/services/store-products";

// Public listing
const { products } = await getStoreProducts({ categoryId: 19, perPage: 50 });

// Authenticated REST (needs keys)
const product = await woocommerceApi.getProductById(1285);
```

### Products feature

| File | What it does |
|---|---|
| `src/features/products/services/store-products.ts` | `getStoreProducts`, `getStoreProductBySlug`, categories, attributes |
| `src/features/products/services/pricing.ts` | B2B King meta → tier table (falls back to default tiers) |
| `src/features/products/services/category-page.ts` | Loads PLP data (products + filters) for a route |
| `src/features/products/services/products.ts` | Older REST helpers (`getProducts` via `wc/v3`) |
| `src/features/products/types/store-product.ts` | Store API TypeScript types |
| `src/features/products/types/product.ts` | REST API product types |
| `src/features/products/utils/pricing.ts` | Unit price, logo fee (£0.52), bulk discounts, gifts exclusion |
| `src/features/products/utils/shipping.ts` | Carton/pallet shipping formula (from WP `wrnxt_hybrid_shipping`) |
| `src/features/products/utils/product-helpers.ts` | Filter matching, HTML strip/entity decode, display price |
| `src/features/products/components/CategoryPage.tsx` | Server wrapper for PLP |
| `src/features/products/components/CategoryPageContent.tsx` | PLP layout (title, filters, grid) |
| `src/features/products/components/ProductFilters.tsx` | Filter bar (matches WP `abbeygate_filters` plugin) |
| `src/features/products/components/ProductGrid.tsx` | Product cards grid |
| `src/features/products/components/ProductDetailClient.tsx` | PDP layout (gallery + details + ATC) |
| `src/features/products/components/ProductCustomizer.tsx` | Abbey PDP customisation UI (from WP PHP/JS) |

### Cart feature

| File | What it does |
|---|---|
| `src/features/cart/context/CartContext.tsx` | Cart state, localStorage (`abbeygate-cart`), shipping totals |
| `src/features/cart/components/CartDrawer.tsx` | Slide-out bag UI |

**Note:** Logo file previews are **not** stored in localStorage (they blew the 5MB quota). Only metadata (blocking type, position, filename) is persisted.

### Category route map

| File | What it does |
|---|---|
| `src/data/category-routes.ts` | Maps Next.js paths → WooCommerce category IDs + filter disable rules |
| `src/data/navigation.ts` | Mega-menu labels/links (Navbar) |

### App routes

| Route | File | Purpose |
|---|---|---|
| `/diaries`, `/diaries/a5`, … | `src/app/diaries/[[...slug]]/page.tsx` | Diary PLPs |
| `/notebooks`, `/notebooks/a5`, … | `src/app/notebooks/[[...slug]]/page.tsx` | Notebook PLPs |
| `/custom-gifts/...` | `src/app/custom-gifts/[[...slug]]/page.tsx` | Gifts PLPs |
| `/collection/...` | `src/app/collection/[[...slug]]/page.tsx` | Collection PLPs |
| `/product/[slug]` | `src/app/product/[slug]/page.tsx` | Product detail page |
| `/cart` | `src/app/cart/page.tsx` | Full cart page |
| `/` | `src/app/page.tsx` | Homepage (featured products from WC) |

---

## Category ID reference

From WooCommerce (used in `src/data/category-routes.ts`):

| Category | ID | Slug |
|---|---|---|
| Diaries | 18 | `diaries` |
| — A4 Diary | 42 | `a4-diary` |
| — A5 Diary | 40 | `a5-diary` |
| — — DPP | 129 | `dpp` |
| — — WTV | 128 | `wtv` |
| — Pocket Diaries | 39 | `pocket-diaries` |
| — Quarto Diary | 41 | `quarto-diary` |
| — — Quarto DPP | 131 | `quarto-dpp` |
| — — Quarto WTV | 130 | `quarto-wtv` |
| — Faux Leather Diaries | 44 | `faux-leather-diaries` |
| — Real Leather | 43 | `real-leather` |
| Notebooks | 17 | `notebooks` |
| — A5 Notebooks | 19 | `a5-notebooks` |
| — A6 Notebooks | 45 | `a6-notebooks` |
| — Eco | 46 | `eco` |
| — Faux Leather Notebooks | 48 | `faux-leather-notebooks` |
| — Real Leather Notebooks | 47 | `real-leather-notebooks` |
| Chelsea Collection | 49 | `chelsea-collection` |
| Dorchester Collection | 50 | `dorchester-collection` |
| Harrogate Collection | 51 | `harrogate-collection` |
| Lewes Collection | 52 | `lewes-collection` |
| Richmond Collection | 53 | `richmond-collection` |
| Conscious Collection | 55 | `conscious-collection` |
| Graphic Print Collection | 54 | `graphic-print-collection` |
| Windsor Collection | 140 | `windsor-collection` |
| Gifts | 126 | `gifts` |
| Card Holder | 152 | `card-holder` |
| Luggage Tag | 144 | `luggage-tag` |
| Keychains | 149 | `keychains` |
| Wallets | 153 | `wallets` |
| Foil blocked | 125 | `foil-blocked` |
| Embossed | 124 | `embossed` |

---

## Business logic ported from WordPress

### PDP customisation (`ProductCustomizer.tsx`)

Mirrors the WP `abbey-pdp` snippet:

- Default qty **25** (gifts excluded)
- Customisation UI hidden when qty **&lt; 25**
- Logo blocking types: Foil blocked / Embossed
- Logo positions: top-center, center, bottom-center, top-right, bottom-right
- **Gifts category** (`slug: gifts`) → no customisation UI
- Logo fee **£0.52** included when customisation on; subtracted when off

### Pricing (`utils/pricing.ts` + `services/pricing.ts`)

- Tries B2B King tiers from REST `meta_data`
- If no keys / no meta → default tier table (1–24, 25–49, 50–99, 100+)
- Bulk discount labels when using percentage fallback (20% / 25% / 35%)

### Filters (`ProductFilters.tsx`)

Mirrors WP plugin `Abbeygate AJAX Filters`:

- Attributes: `pa_collection`, `pa_colour`, `pa_layout`, `pa_size`
- Cross-filtering with live counts
- Disable rules (e.g. hide Size on notebook sub-pages, hide Collection on collection pages)

### Shipping (`utils/shipping.ts`)

Mirrors WP `wrnxt_hybrid_shipping`:

- Per-category carton weights / boxes-per-pallet
- Min shipping £15.75 under 20kg
- Formula rate vs pallet rate (£96/pallet) when weight/boxes high
- Free shipping coupon: `abbeygate100`

---

## How to add / change things

### Add a new category page

1. Add WC category ID to `src/data/category-routes.ts`
2. Add mega-menu link in `src/data/navigation.ts` if needed
3. Route file already exists via `[[...slug]]` under diaries/notebooks/etc.

### Change PDP customisation rules

Edit `src/features/products/utils/pricing.ts` and `ProductCustomizer.tsx`.

### Change shipping rules

Edit `src/features/products/utils/shipping.ts` (`CATEGORY_SHIPPING_RULES`).

### Fetch products in a new page

```ts
import { getAllStoreProductsByCategory } from "@/features/products/services/store-products";

const products = await getAllStoreProductsByCategory(19); // A5 Notebooks
```

---

## Known limitations / still to do

| Item | Status |
|---|---|
| Checkout / payment | Not built — cart is local only |
| Logo file upload to WordPress on order | Not built — filename stored in cart only |
| Search page | Navbar search UI exists, no results page yet |
| Bespoke section pages | Nav links exist, pages not built |
| WooCommerce Store API cart sync | Cart is localStorage, not WC session |
| Product photo black studio backgrounds | In the image files themselves (same as WP) |

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `Store API error (404) rest_no_route` | `WOOCOMMERCE_STORE_URL` must be site origin only (no `/wp-json`) |
| `QuotaExceededError` on cart | Run `localStorage.removeItem('abbeygate-cart')` in DevTools, refresh |
| Black page background | Hard refresh; theme is forced light in `layout.tsx` + `globals.css` |
| Slow PDP | Thumbnails are preferred; REST pricing skipped when keys missing |
| Hydration warning `cz-shortcut-listen` | Browser extension — ignore / disable ColorZilla |

---

## Scripts

```bash
npm run dev      # development server
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

---

## Related PRs / branches

- `cursor/woocommerce-api-client-91f3` — initial REST client
- `cursor/woocommerce-commerce-layer-91f3` — PLP, PDP, filters, cart, shipping

Live WordPress reference: https://corporate.abbeygate-england.com/
