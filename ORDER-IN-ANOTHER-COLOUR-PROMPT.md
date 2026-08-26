# Implementation prompt — "Order in another colour" (cart colour variants)

> Paste this whole file to Claude (or work through it yourself) as the spec for the feature.
> It is written against the **current** state of this repo, with real file paths, real
> identifiers and the real traps. Read section 8 (Hard rules) before writing any code.

---

## 1. What we are building

On the full cart page (`src/app/cart/page.tsx`), every customised line gets a
**"+ Order in another colour"** action. Clicking it reveals a row of colour swatches for
that product's colour family. Clicking a swatch **immediately** inserts a new cart line
directly below the source line, for the same product family in the new colour, carrying:

- the **same branding** (blocking method, foil colour, logo file, logo position, logo scale, corner edges)
- the **same quantity**
- the **same effective unit price** (see §6 — group pricing)
- its **own** preview/proof rendered on that colour's actual photograph

The selling point shown to the customer, copied from the client's reference:
**"Same branding & set-up — no additional set-up fee."**

Behavioural reference: `reference.html` in the repo root (~1.7 MB). Its JS functions
`toggleColourPicker`, `colourPickerRow`, `addColourVariant`, `syncVariantSiblings`,
`amendCustomisation`, `addCurrentToBasket` define the intended **business logic and flow**.

> **`reference.html` is a reading aid only. Its numbers are not our numbers.**
> It uses an SVG-book prototype with its own invented cost model (`setup`, `cornerPerUnit = 0.24`,
> `brandingCost`, `extrasCost`, `total = productsCost + setup + brandingCost + extrasCost`). **None
> of those figures are authoritative for this site and several are simply wrong for us.** Take from
> it *what the feature does* — the picker, the clone-with-same-branding, the group propagation — and
> nothing about *how much anything costs*. All pricing on this site comes exclusively from
> `calculateProductPrice` / `getTierUnitPrice` / `getBulkDiscountRate` in
> `src/features/products/utils/pricing.ts` and the tiers parsed by
> `getProductPricingFromProduct`. Do not copy a price, a fee, a rate or a formula out of
> `reference.html`. In particular this site has **no set-up/origination fee** (there is no `setup`
> field anywhere in our pricing), so reference's `setup: 0` line is not "confirming" anything — it
> has no equivalent here at all.

**Take the business logic from `reference.html`. Take none of its markup, CSS, theme, or pricing.**
Our theme is the one currently in `main` — reuse the existing Tailwind classes and
component patterns already in `src/app/cart/page.tsx` and `src/features/cart/components/CartDrawer.tsx`.

---

## 2. The one thing that makes this harder than the reference

`reference.html` draws the product as an **inline SVG book**. Recolouring is a fill swap,
so it can clone a basket line, change `colourHex`, and the preview is instantly correct.

This site does not do that. Here:

- Each colour is a **separate WooCommerce product** — its own `id`, `slug`, `name`, and its own
  **photograph**. They are grouped only by a shared tag (`product.tags[0].id`); they are *not*
  WooCommerce variations.
- The customisation preview is a **canvas composite over that photograph**. Its geometry comes
  from `getImageBoundingBox()` in `src/features/products/utils/product-helpers.ts`, which
  edge-detects where the book sits inside that specific photo and returns bounds as percentages.
- `leftPercent`, `topPercent`, `widthPercent` and `fullPreviewUrl` on a cart item are all
  **derived from one specific photo's bounds**.

**Therefore: never copy `fullPreviewUrl`, `imageBounds`, `leftPercent`, `topPercent` or
`widthPercent` from the source line to a colour variant.** Two photos in the same family are
often framed differently; reusing the source's numbers puts the logo and the corner edges in the
wrong place — and worse, showing the source's `fullPreviewUrl` shows the customer *the wrong
colour* while telling them it is their proof.

What is safe to copy is the **colour-independent branding spec**. What must be recomputed per
colour is the **geometry and the composite**. That split drives the whole design below.

---

## 3. Decisions already made (and how to flip each one)

These are business calls. They are decided so you can build; each one is a small, isolated change
if the client wants it the other way.

### 3.1 Quantity-break pricing is computed on the **colour-group total**

25 green + 25 blue prices **both** lines at the 50-unit tier, not the 25-unit tier.

*Why:* it is one artwork, one origination, one print run — that is the entire premise of the
feature and of the "no additional set-up fee" line. If splitting 50 units across two colours gave
the customer a *worse* unit price than 50 of one colour, the feature would punish the customer for
using it.

*Flip:* in the new `getGroupQuantity()` helper, return `item.quantity` instead of the group sum.

### 3.2 The 25-unit customisation minimum applies to the **group**, not per line

`CUSTOMIZATION_MIN_QTY = 25` (in `src/features/products/utils/pricing.ts`) is satisfied across the
colour group. So 15 green + 10 blue is valid; 15 green alone is not. Per-line floor is 1.

*Why:* consistent with 3.1 — the minimum exists for the print run, not the colour.

*Flip:* validate `item.quantity >= CUSTOMIZATION_MIN_QTY` per line instead of per group. If the
factory really needs a per-colour minimum (plausible — foil blocking is set up per colour), this is
the knob, and it should probably be a smaller number like 10 rather than the full 25.

### 3.3 A colour variant renders **its own** proof, asynchronously, and never falls back to the source's

The line is inserted **instantly** with `proofStatus: 'pending'`. The composite runs in the
background and patches the line when done. On failure the line shows a retry, not a wrong preview.

*Why:* correctness beats speed on a proof — the customer approves artwork off this image. But
blocking the click for the 1–7 s a cold image fetch can take would feel broken. Async + explicit
status gets both.

*Flip:* if the client wants a blocking spinner instead, `await` the compose call inside the click
handler and keep `proofStatus` as the failure signal only.

### 3.4 Amending customisation propagates to the whole colour group, **with a confirm**

Editing branding on any line in a group offers "Apply to all N colours in this group?" (default:
yes). Reference's `syncVariantSiblings` does this silently.

*Why:* the group exists because it is one branding job, so silent divergence between colours is
the surprising outcome. But silently overwriting a colour the customer deliberately differentiated
is worse than asking. One confirm covers both.

*Flip:* drop the confirm and always sync (matches reference exactly), or scope the edit to the
single line and remove the propagation.

### 3.5 Removing the source line does **not** remove its colour siblings

The group id lives on every member, so the group survives losing any member. Branding is identical
across members by construction, so any surviving member can act as the group's source of truth.

---

## 4. Data model changes

### 4.1 `LogoCustomization` — `src/features/products/types/store-product.ts`

Two fields are currently **not persisted** but are required to re-derive a proof for a different
photo. This is the blocker for the whole feature — add them first.

```ts
export type LogoCustomization = {
  enabled: boolean;
  choice: string;
  foilColor?: string;
  cornerEdges?: string;
  fileUrl?: string;
  fileName?: string;
  logoFile?: File;
  position: string;              // display form, e.g. "Top Right" — keep, it is rendered in the cart
  logoPreviewUrl?: string;
  fullPreviewUrl?: string;
  leftPercent?: number;          // DERIVED from this photo's bounds — never copy across colours
  topPercent?: number;           // DERIVED
  widthPercent?: number;         // DERIVED
  imageBounds?: { top: number; bottom: number; left: number; right: number };  // DERIVED

  // NEW — colour-independent inputs, required to recompute the above for another photo.
  // INTERNAL ONLY: used to render the proof; never displayed in the cart or sent to checkout (§8 rule 8).
  positionLabel?: string;        // raw anchor: 'top-left' | 'top-center' | ... | 'center'
  logoScale?: number;            // defaults to 1
};
```

`positionLabel` matters because `generateProof` branches on the raw
`customization.logoPosition?.label` (`'top-right'`), while the cart only stores the prettified
`"Top Right"`. Don't reverse-engineer the string — store the raw label.

In `ProductDetailClient.handleAddToCart` (~line 700), populate both:

```ts
positionLabel: customization.logoPosition?.label || 'center',
logoScale: customization.logoScale ?? 1,
```

### 4.2 `ColorVariant` — `src/features/products/components/ProductDetailClient.tsx` (~line 44)

The cart needs the sibling's WooCommerce **product id** (checkout posts `product_id`) and its full
product **name** (the cart line title). Neither is currently carried.

```ts
export type ColorVariant = {
  productId: string;   // NEW — String(sibling.id); /api/checkout needs this
  productName: string; // NEW — sibling.name, the full WooCommerce title used as the cart line name
  name: string;        // colour label only, e.g. "Green" (already used by the PDP swatch tooltip)
  slug: string;
  hex: string;
  imageSrc?: string;
};
```

Populate in `src/app/product/[slug]/page.tsx` (~line 118, in the `siblings.map`):

```ts
return {
  productId: String(sibling.id),
  productName: sibling.name,
  name: colorName,
  slug: sibling.slug,
  hex: COLOR_HEX_MAP[colorSlug] || '#cccccc',
  imageSrc: sibling.images?.[0]?.src,
};
```

Everything else in that mapping (the `specificSlug` / `attrSlug` hex resolution) stays as-is — it
already handles the "Biscuit is tagged as Brown" case and is easy to break.

### 4.3 `CartItem` — `src/features/cart/context/CartContext.tsx`

```ts
export type CartColourOption = {
  productId: string;
  productName: string;
  name: string;
  slug: string;
  hex: string;
  imageSrc?: string;
};

export type ProofStatus = 'ready' | 'pending' | 'failed';

export interface CartItem {
  key: string;
  productId: string;
  slug?: string;
  variationId?: string;
  name: string;
  image: string;
  price: number;                 // keep for back-compat; no longer the source of truth (§6)
  quantity: number;
  attributes?: { name: string; value: string }[];
  customization?: LogoCustomization;
  categorySlugs?: string[];

  // NEW — colour group
  colourGroupId?: string;        // === the originating line's `key`
  colour?: { name: string; slug: string; hex: string };
  colourOptions?: CartColourOption[];  // snapshot of the family, taken at add-to-basket time
  proofStatus?: ProofStatus;

  // NEW — pricing inputs, so the cart can re-tier without another network call (§6)
  basePrice?: number;
  priceTiers?: PriceTier[];
  isGifts?: boolean;

  // NEW — geometry inputs, so the cart can recompute a proof without the StoreProduct (§5.2)
  proofGeometry?: { widthMm: number; heightMm: number; isDiary: boolean };
}
```

`colourGroupId` is the **originating cart line's own key**, matching reference's
`groupId: source.groupId || source.id`. Do **not** derive it from the WooCommerce tag id — if the
customer customises the same product twice with two different logos, a tag-derived id would merge
them into one group and cross-contaminate edits and pricing.

Wire it in `addItem` (one line, right after `key` is computed):

```ts
const safeItem = { ...item, key, colourGroupId: item.colourGroupId ?? key };
```

Everything is persisted to IndexedDB via `src/lib/idb.ts`, so `File` objects and
`colourOptions` arrays survive a reload. Keep `colourOptions` lean — no data URLs in it.

`CartContext.tsx` does not currently import `PriceTier`; add
`import type { PriceTier } from '@/features/products/types/store-product'` for the new
`priceTiers?: PriceTier[]` field.

### 4.4 New CartContext methods

```ts
updateItem: (key: string, patch: Partial<CartItem>) => Promise<void>;
insertItemAfter: (afterKey: string, item: Omit<CartItem, 'key'> & { key?: string }) => Promise<string>;
```

`insertItemAfter` must `splice` at `sourceIndex + 1` (reference does the same) so the colour sits
next to its sibling instead of at the bottom of the basket. It returns the new key so the caller
can patch the line when the proof lands.

`updateItem` is what the async proof patch uses. Make it a no-op if the key is gone (the customer
may have removed the line while the composite was running).

Also: `addItem` currently calls `openCart()` and fires a toast. `insertItemAfter` should do
**neither** — the customer is already on the cart page looking at the line.

---

## 5. Phase 1 — colour picker + variant creation

Ship this first; it is the actual ask. Phases 2 and 3 are independently shippable.

### 5.1 Carry the colour family into the basket

Everything needed is **already in scope** in `ProductDetailClient`: `basePrice` and `tiers` are
props (`ProductDetailClientProps`, ~line 51), `isGifts = isGiftsProduct(product)` is at ~line 86,
and `colorVariants` is a prop that already includes the current product. No extra fetch.

Add to the `addItem({...})` call in `handleAddToCart`:

```ts
const activeColour = colorVariants.find(c => c.slug === product.slug);
// ...
colour: activeColour
  ? { name: activeColour.name, slug: product.slug, hex: activeColour.hex }
  : undefined,
colourOptions: colorVariants.length > 1 ? colorVariants : undefined,
basePrice,                 // existing prop
priceTiers: tiers,         // existing prop
isGifts,                   // existing derived value
proofGeometry: (() => {
  const { width, height } = getProductPhysicalDimensionsMm(product);
  return {
    widthMm: width,
    heightMm: height,
    isDiary: product.categories?.some(c =>
      c.name.toLowerCase().includes('diar') || c.slug.toLowerCase().includes('diar')) ?? false,
  };
})(),
proofStatus: 'ready',
```

Guard `colourOptions` on `length > 1` — a single-colour product should not show the picker. Two
constraints inherited from `app/product/[slug]/page.tsx`: siblings are fetched only when
`product.tags.length > 0`, so an untagged product has no `colourOptions` (feature simply doesn't
appear — acceptable); and the fetch uses `perPage: 20`, so a family larger than 20 colours is
capped. Neither needs fixing now; just don't assume every product has a family.

**Assumption to confirm with the client:** colour variants in a family share the same
`basePrice` and tier table, so a colour line inherits the source's. This is almost certainly true
(same product, different cover colour) but it is an assumption, because `ColorVariant` carries no
price and per-sibling pricing would mean N calls to
`getProductPricingFromProduct` (`src/features/products/services/pricing.ts`) on every product page
render. If prices *can* differ by colour, the fix is a small `GET /api/product-pricing?slug=` route
called once when the picker opens, not N server-side calls up front. Verify by comparing two
colours of the same diary on the live site before assuming.

`CartDrawer` has **no** add-to-cart path of its own (it only reads `items`, `removeItem`,
`updateQuantity` from context), so there is nothing to change there for add. It does, however, read
`item.price * item.quantity` directly — that is handled by the Phase 2 `pricedItems` switch (§6.1),
not here.

### 5.2 Extract the proof composer into a pure module

Create `src/features/products/utils/generate-proof.ts`.

Move the body of `generateProof` (currently `ProductDetailClient.tsx` lines ~302–605) into:

```ts
export type BrandingSpec = {
  blockingType: string;            // 'Foil blocked' | 'UV Print' | 'Embossed' | ...
  foilColor?: string;
  cornerEdges?: string;
  positionLabel: string;           // 'top-right' etc.
  logoScale: number;
  logoPreviewUrl: string;
};

export type ProofGeometry = { widthMm: number; heightMm: number; isDiary: boolean };

export type ProofResult = {
  fullPreviewUrl: string;
  imageBounds: { top: number; bottom: number; left: number; right: number } | null;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
};

export async function composeProof(args: {
  productImageUrl: string;
  branding: BrandingSpec;
  geometry: ProofGeometry;
}): Promise<ProofResult | null>;
```

Rules for this extraction — treat it as a **pure move**:

- **Zero behaviour change.** Same canvas size (`CANVAS_SIZE = 800`), same
  `fetch('/_next/image?url=...&w=828&q=75')`, same
  `getConfiguredImageBounds(src) ?? await getImageBoundingBox(src)` (note: `getConfiguredImageBounds`
  lives in `src/features/products/utils/product-image-bounds.ts`, `getImageBoundingBox` in
  `product-helpers.ts` — import both), same anchor maths, same `marginX = bookWidth * 0.08` /
  `marginY = bookHeight * 0.05`, same `diaryTopOffset = isDiary ? bookHeight * 0.15 : 0`, same
  foil/UV/emboss compositing branches.
- The only substitutions: `activeSrc` → `args.productImageUrl`; `customization.*` →
  `args.branding.*`; `getLogoAnchors(product)` → an overload that takes
  `{ widthMm, heightMm }` instead of a `StoreProduct`; the `isDiary` category sniff →
  `args.geometry.isDiary`.
- `ProductDetailClient.generateProof` becomes a thin wrapper that builds the three args from its
  own state and calls `composeProof`. Its signature and return shape stay identical so
  `handleAddToCart` and the `onGenerateProof={generateProof}` prop (~line 852) are untouched.
- Verify by adding one colour-less product to the basket before and after the refactor and
  confirming `leftPercent`, `topPercent`, `widthPercent` and `imageBounds` are byte-identical.

`getLogoAnchors` in `product-helpers.ts` should gain an mm-based overload rather than being
rewritten. Its current body (lines ~137–159) starts by calling `getProductPhysicalDimensionsMm`;
split at that call so the mm-only maths (lines ~138–159) becomes the shared core:

```ts
export function getLogoAnchorsFromMm(widthMm: number, heightMm: number) {
  const aspectRatio = widthMm / Math.max(heightMm, 1);   // ← everything from line 138 onward
  /* ...unchanged body... */
}
export function getLogoAnchors(product: StoreProduct) {
  const { width, height } = getProductPhysicalDimensionsMm(product);
  return getLogoAnchorsFromMm(width, height);
}
```

### 5.3 `ColourPickerRow` component

Create `src/features/cart/components/ColourPickerRow.tsx`. Behaviour mirrors reference's
`colourPickerRow`, styling comes from our theme.

- Renders only when `item.colourOptions` has more than one entry **and** `item.customization?.enabled`.
- Hide colours already present in the group. Reference only filters the source's own colour
  (`COLOURS.filter(c => c.id !== item.colourId)`) — filter *all* colours already in the group, so
  the customer cannot create a duplicate line and then wonder which one is real.
  If nothing is left, render "All colours in this range are already in your basket."
- Note text under the swatches: **"Same branding & set-up — no additional set-up fee."**
- Swatch markup: reuse the PDP swatch look from `ProductDetailClient.tsx` (~line 1075). There the
  classes are split across a ternary — base `w-7 h-7 rounded-full shadow-sm transition-transform
  hover:scale-110`, with `ring-2 ring-offset-2 ring-black scale-110` when active and
  `border border-gray-300` when not. Reuse the same look, `style={{ backgroundColor: color.hex }}`,
  `title={color.name}` — but render a `<button type="button">`, not a `<Link>` (no navigation; the
  click mutates the cart).
- On **hover** of a swatch, warm exactly that swatch's two optimizer entries (see §8, rule 3):
  `new Image().src = \`/_next/image?url=${encodeURIComponent(imageSrc)}&w=828&q=75\`` and the same
  with `&w=1080&q=75`. One swatch at a time, on hover only — **never prefetch all swatches at once.**
- Toggle state lives in `app/cart/page.tsx` as `const [pickerFor, setPickerFor] = useState<string | null>(null)`
  (reference's `state.colourPickerFor`), so only one row's picker is open at a time.

### 5.4 The swatch click handler

Put this in a helper — `src/features/cart/utils/add-colour-variant.ts` — so the drawer can reuse it.

```
addColourVariant(source: CartItem, option: CartColourOption, cart):
  1. newKey = await cart.insertItemAfter(source.key, {
       ...source,
       key: undefined,
       productId:      option.productId,
       slug:           option.slug,
       name:           option.productName,
       image:          option.imageSrc,          // NOT source.image (wrong colour). If absent, see note below.
       colour:         { name: option.name, slug: option.slug, hex: option.hex },
       colourGroupId:  source.colourGroupId ?? source.key,
       colourOptions:  source.colourOptions,
       quantity:       source.quantity,          // reference copies qty wholesale
       attributes:     source.attributes,
       customization: {
         ...source.customization,
         // colour-independent branding is copied…
         // …and every derived field is cleared, because they belong to the source's photo:
         fullPreviewUrl: undefined,
         imageBounds:    undefined,
         leftPercent:    undefined,
         topPercent:     undefined,
         widthPercent:   undefined,
       },
       proofStatus: 'pending',
     })

  2. setPickerFor(null)   // close the picker, the new row is already visible

  3. fire-and-forget:
       const branding = brandingSpecFrom(source.customization)   // throws if logoPreviewUrl missing
       const proof = await composeProof({
         productImageUrl: option.imageSrc,
         branding,
         geometry: source.proofGeometry,
       })
       if (proof) cart.updateItem(newKey, {
         proofStatus: 'ready',
         customization: { ...<current line's customization>, ...proof },
       })
       else cart.updateItem(newKey, { proofStatus: 'failed' })
```

Notes:

- Re-read the line from context inside the patch rather than closing over the old object — the
  customer may have changed the quantity while the composite ran.
- Wrap the compose in `try/catch` and set `'failed'` in the catch too. `composeProof` can return
  `null` (no bounds, image fetch failed) *and* throw (canvas unavailable).
- `option.imageSrc` can be `undefined` if the sibling has no images. In that case skip the
  compose and set `proofStatus: 'failed'` immediately — do not fall back to `source.image`, which
  is the wrong colour.
- **Image-URL kinds differ, and it matters for the modal.** `source.image` on a normally-added line
  is a *thumbnail* URL (`product.images[0]?.thumbnail || ...src`), whereas `ColorVariant.imageSrc`
  is the sibling's *full* `src`. Set the variant's `image` to `option.imageSrc` (fall through to
  `'failed'` if absent — see above; do **not** use `source.image`). Be aware that per §8 rule 6 the
  cart preview modal calls `getImageBoundingBox(item.image)` for corner-edge lines, so a variant
  will edge-detect on the full `src` (a different `/_next/image` cache entry than a thumbnail). This
  is fine and correct — the variant's `leftPercent/topPercent/imageBounds` were composed from that
  same `src` in step 3 — just don't be surprised the URLs differ from source lines.
- Copying the same `File` reference into the sibling is fine and intended: `/api/checkout` appends
  it per index, so the same logo uploads once per line.

### 5.5 Cart line rendering (`src/app/cart/page.tsx`)

Inside the existing `item.customization?.enabled` block (~line 115), the "Preview" row is currently
gated on `item.customization.logoPreviewUrl` (~lines 128–133) and only ever renders a `View preview`
button. A colour variant is `pending`/`failed` *before* it has a preview, so you must lift the row
out of that `logoPreviewUrl` conditional and drive it off `proofStatus` instead:

- `ready` → current `View preview` button, unchanged.
- `pending` → `<Loader2 className="w-3 h-3 animate-spin" />` plus "Generating preview…", not clickable.
- `failed` → "Preview unavailable" plus a `Retry` button that re-runs step 3 of §5.4.

Treat a **missing** `proofStatus` as `'ready'` — existing baskets in IndexedDB predate the field.
(`Loader2` is already imported in `cart/page.tsx`.)

Below the quantity stepper, add the trigger:

```tsx
{item.customization?.enabled && (item.colourOptions?.length ?? 0) > 1 && (
  <button type="button" onClick={() => setPickerFor(pickerFor === item.key ? null : item.key)}>
    + Order in another colour
  </button>
)}
{pickerFor === item.key && <ColourPickerRow item={item} onPick={...} />}
```

Also show the colour on the line. The sibling's `productName` already ends with the colour
("…Pocket Week to View, Green"), so **do not** add a redundant `Colour` attribute — it would
render twice via the existing `item.attributes.filter(...)` map.

Give grouped lines a light visual tie — e.g. a `border-l-2` on members of a group with more than
one line, using their shared `colourGroupId`. Keep it subtle; no new design language.

### 5.6 Checkout

`/api/checkout` already posts `product_id` per line and gates the preview upload on
`hasPreview`, so a colour line with its own `productId` and its own `fullPreviewUrl` needs **no
route change**. In `handleCheckout` (`app/cart/page.tsx`):

- If any line is `pending`, keep the existing `isSyncing` spinner and await them (they resolve in
  seconds) before building the FormData.
- If any line is `failed`, `confirm()` that the order will be placed without a visual proof for
  those lines, then proceed. The order is still fully specified by the branding attributes — the
  proof image is a nicety, not the spec.

---

## 6. Phase 2 — group pricing and the minimum

### 6.1 There is an existing bug you have to fix to do this properly

`updateQuantity` in `CartContext.tsx` changes `quantity` and leaves `price` alone. So a basket
line added at 25 units keeps the 25-unit tier price even after the customer raises it to 100 in
the cart. Group pricing cannot be layered on top of a stale snapshot, so fix the root cause:
**make unit price derived, not stored.**

Add to `CartContext`:

```ts
type PricedItem = CartItem & {
  unitPrice: number;
  lineTotal: number;
  groupQuantity: number;   // the quantity the tier was chosen from
};

const pricedItems: PricedItem[] = useMemo(() => { ... }, [items]);
```

For each item:

```
groupQuantity = item.colourGroupId
  ? sum of quantity over items sharing colourGroupId
  : item.quantity

// LEGACY BASKETS FIRST. Items added before this feature have no basePrice/priceTiers.
// Their stored `price` is already a fully-computed unit price (see the warning below),
// so pass it straight through — do NOT feed it back into calculateProductPrice.
if (item.basePrice === undefined) {
  unitPrice = item.price;                     // trust the snapshot for old lines
} else {
  unitPrice = calculateProductPrice({
    quantity: groupQuantity,                  // ← the group total picks the tier
    basePrice: item.basePrice,
    tiers: item.priceTiers ?? [],
    // Mirror the PDP EXACTLY. ProductCustomizer computes:
    //   customizationEnabled = !isGifts && quantity >= CUSTOMIZATION_MIN_QTY && customization.enabled
    // Use the SAME quantity basis the PDP would (the line's own quantity for the min check),
    // or the cart and product page will show different unit prices for a sub-25 line.
    customizationEnabled:
      !(item.isGifts ?? false) &&
      item.quantity >= CUSTOMIZATION_MIN_QTY &&
      !!item.customization?.enabled,
    blockingType: item.customization?.choice,
    isGifts: item.isGifts ?? false,
  }).unitPrice
}

lineTotal = unitPrice * item.quantity          // ← but the line still bills its own quantity
```

`subtotal` becomes `sum(lineTotal)`. `vatCost` and `total` derive from `subtotal` exactly as they do
now (`vatCost = subtotal * VAT_RATE`, `total = subtotal + shippingCost + vatCost`).

**`shippingCost` does NOT derive from `subtotal`** — `calculateShipping` (`CartContext.tsx` ~line 127
→ `src/features/products/utils/shipping.ts`) computes it from each item's `categorySlugs` and
`quantity` (box/weight/pallet logic), independent of price. Leave that calculation exactly as-is; it
already reads `items`, so it keeps working. Only `subtotal` needs the switch to derived unit prices.

Expose `pricedItems` alongside `items` and switch `app/cart/page.tsx` **and `CartDrawer`** to read
it (CartDrawer currently does `item.price * item.quantity` at ~line 213 — that is a stale-price read
and needs `pricedItems` too). Keep the stored `price` field written on add, unchanged, so old
baskets and any other reader still work.

> **Why the legacy branch is not optional.** `CartItem.price` is written on add as
> `priceDetails.unitPrice` — an *already-tiered, already-fee-adjusted* number, not a base price.
> Passing it as `basePrice` to `calculateProductPrice` re-runs the tier lookup on a tiered number,
> and for a line where `customizationEnabled` was false it subtracts the £0.52 blocking fee a
> **second** time. So: new lines (with `basePrice` set) get fully recomputed; legacy lines
> (no `basePrice`) pass their stored `price` through untouched. Never mix the two.

Watch the quirk in `calculateProductPrice`: when `customizationEnabled` is false it *subtracts*
`LOGO_CUSTOMIZATION_FEE` (0.52) from the unit price, because WooCommerce base prices are quoted
**including** the blocking fee. Colour variants of a customised line are always
customisation-enabled, so they must never hit that branch — pass `customizationEnabled` from the
item, never hardcode.

Also note `calculateProductPrice` ignores `getBulkDiscountRate` entirely when explicit
`tiers` exist (`const discountRate = tiers.length ? 0 : getBulkDiscountRate(quantity)`).
That is existing behaviour — do not "fix" it here.

### 6.2 Show the customer why the price moved

When `groupQuantity > item.quantity`, add one small line under the price:
`Priced at your {groupQuantity}-unit total across {n} colours`. Without it, a line showing 25 units
at the 50-unit price looks like a bug.

### 6.3 Minimum quantity

Add a group-aware guard:

```ts
// src/features/cart/utils/colour-group.ts
export function getGroupQuantity(items: CartItem[], item: CartItem): number;
export function getGroupMembers(items: CartItem[], item: CartItem): CartItem[];
export function validateCustomisationMinimums(items: CartItem[]): { groupId: string; shortfall: number }[];
```

`validateCustomisationMinimums` returns a row per customised group whose total is below
`CUSTOMIZATION_MIN_QTY`. Surface it as an inline warning on the affected lines *and* disable
`Proceed to Checkout` with the reason. Do not silently clamp quantities — the customer typed them.

---

## 7. Phase 3 — amend customisation and propagate

### 7.1 Amend

Add an `Amend customisation` action to every customised cart line (reference's row actions are
`Amend customisation | Download proof | + Order in another colour`).

There is already the beginnings of a mechanism: `ProductDetailClient` writes a
`customization_draft_${product.slug}` localStorage key and clears it in the `finally` of
`handleAddToCart`. Extend that:

1. Cart writes the line's branding spec to `sessionStorage` under
   `abbeygate-amend-${item.key}` and navigates to `/product/${item.slug}?amend=${item.key}`.
2. `ProductDetailClient` reads `?amend`, hydrates its customizer state from that payload
   (`blockingType`, `foilColor`, `cornerEdges`, `logoScale`, `logoPosition` from `positionLabel`,
   `logoFile` / `logoPreviewUrl`, `quantity`), and jumps straight to the branding step —
   equivalent to reference's `amendCustomisation` setting `state.editingItemId` and
   `state.editingGroupId`.
3. The primary button becomes **Update basket**. On submit it **replaces** the line by key instead
   of appending, exactly like reference's `addCurrentToBasket` branching on `editingItemId`.

`logoFile` is a `File` and will not survive `sessionStorage`. Read it back out of IndexedDB by cart
key instead of trying to serialise it, and only fall back to a re-upload prompt if it is genuinely
missing.

### 7.2 Propagate

After a successful replace, if the line's group has more than one member, ask
**"Apply this branding to all N colours in this group?"** (default yes). On yes, for each sibling:

- copy the colour-independent branding spec (`choice`, `foilColor`, `cornerEdges`,
  `positionLabel`, `logoScale`, `logoFile`, `logoPreviewUrl`, `fileName`, `position`)
- set `proofStatus: 'pending'`, clear the derived fields, and **re-run `composeProof` against that
  sibling's own image** — this is the step reference does not need and the one most likely to be
  skipped by mistake
- never copy `colour`, `productId`, `slug`, `name`, `image` or `quantity`

Run the sibling composites **sequentially**, not with `Promise.all`. Parallel optimizer fetches are
what caused the `/_next/image` 500s described in §8.

Reference recomputes each sibling's cost against its own quantity using its own invented
`cornerPerUnit = 0.24` figure. **Ignore that number — it is a reference.html invention, not our
pricing.** Our equivalent is automatic once §6.1 is in place: `pricedItems` recomputes every line
from `calculateProductPrice` using each line's own quantity and the group tier. Do not write, copy,
or hand-derive any per-line price here.

---

## 8. Hard rules — do not break these

**1. Never copy a proof or bounds across colours.** Repeated because it is the single easiest way
to ship something that looks fine in dev and is wrong in production. `fullPreviewUrl`,
`imageBounds`, `leftPercent`, `topPercent`, `widthPercent` belong to one photograph.

**2. Do not touch the edge-detection fetch.** The live edge detector is `getImageBoundingBox` in
**`src/features/products/utils/product-helpers.ts`** (line ~162). It must keep using, for external
URLs:

```ts
if (imageUrl.startsWith('http')) {
  img.src = `/_next/image?url=${encodeURIComponent(imageUrl)}&w=1080&q=75`;
} else {
  img.src = imageUrl;                 // local/relative paths load directly
}
```

> **Decoy warning.** There is a *second, unused* `getImageBoundingBox` at
> `src/features/products/utils/image-bounds.ts` that sets `img.src = imageUrl` unconditionally (no
> `/_next/image`). Nothing imports it. If you grep for the symbol you may land there first — the one
> that matters is in **`product-helpers.ts`**. Do not "align" the two; leave the dead one alone (or
> delete it in a separate commit, but that is out of scope here).

Not `/api/proxy-image` (it returns JSON `{dataUrl}`; an `<img>` cannot decode JSON → `onerror`),
and not a different width. `getImageBoundingBox` fails **silently** — it `resolve(null)` on
`img.onerror`, on the canvas `getImageData` CORS `catch`, on a missing 2D context, and on degenerate
bounds (`minX >= maxX`). `null` bounds fall back to the rough estimates in `getLogoAnchors`, which
puts corner edges floating off the side of the product with no error anywhere.

The `w=1080` is also load-bearing in a non-obvious way: the PDP gallery's
`sizes="(max-width: 768px) 100vw, 50vw"` resolves to 1080 on desktop, so edge detection usually
piggybacks on an already-warm optimizer cache entry (which srcset candidate the browser picks is
viewport-dependent, so this is a strong likelihood, not a guarantee). A different width forces a cold
fetch that can exceed Next's ~7 s upstream timeout, 500, and yield null bounds.

Note also that `composeProof` fetches `w=828` while `getImageBoundingBox` fetches `w=1080` — two
separate cache entries for the same photo. That is existing behaviour. **Leave it alone**; it is
why §5.3 warms both widths on swatch hover.

**3. Never fire concurrent optimizer fetches.** The `GET /_next/image?... 500 in 7.1s` /
`TimeoutError code: 23` failures in this project came from mounting many images at once and
saturating the upstream. Warm on hover, one swatch at a time. Composite sibling proofs
sequentially. If you add a queue, cap concurrency at 1.

**4. After any change near the customizer, visually verify** logo *and* corner-edge placement on a
**slim** (80×170 mm) or **pocket** diary, in the PDP customizer, in the cart preview modal, and in
the generated proof. Types compiling proves nothing here. The slim shape is the tell: the
`getLogoAnchors` fallback puts `bookRight` at 70 % and `bookTop` at 7.5 %, so a fallback is
immediately visible as gold corners hanging in the whitespace to the right of the book.

**5. Pricing is correctness-critical.** VAT is applied on the subtotal at `VAT_RATE = 0.20`.
Do not reorder VAT, shipping and discount maths. Add a unit test for `pricedItems` before touching
it (see §9).

**6. `ImagePreviewModal` already has the branch you need.** It prefers `fullPreviewUrl` *unless*
corner edges are on (`useComposedPreview = Boolean(fullPreviewUrl && !hasCornerEdges)`), in which
case it re-derives bounds and draws the corners with CSS/SVG. A colour variant with corner edges
will therefore call `getImageBoundingBox(item.image)` from the modal — which is fine and correct,
and another reason `item.image` must be the **sibling's** photo, not the source's.

**7. Repo hygiene.** `git diff` is unusable here — CRLF/LF churn shows ~135 files changed. Review
with `git diff -w --ignore-cr-at-eol` (note `--name-only` still lists all 135; the count only drops
once you drop `--name-only`). Also check for a UTF-8 BOM after editing
(`head -c3 <file> | xxd -p` should not be `efbbbf`) and for mojibake in `stripHtml`'s
entity replacements in `product-helpers.ts` (`–` must not become `â€“`).

**8. Never surface logo sizing/scale anywhere — not in the cart, not to the manufacturer.**
`logoScale`, `widthPercent`, `leftPercent`, `topPercent` and `imageBounds` are **internal geometry
only**: they exist so `composeProof` can render the proof image. They must **never** be shown as
cart line text, and must **never** be added to the checkout payload / WooCommerce attributes sent to
the factory. This matches today's behaviour — the cart already hides `Logo Scale` (it's in the
filtered-out attribute list in `cart/page.tsx`, and no code even pushes such an attribute), and
`/api/checkout` sends only `blockingType`, `position`, `foilColor`, the logo file and the composited
preview image. Do not introduce any new "Scale: 1.2×", "Logo width", "Size" or percentage field in
UI or payload. The proof image communicates size visually; that is the only representation of it the
customer or manufacturer ever sees.

---

## 9. Acceptance tests

Manual, on a slim or pocket diary with a real logo, foil blocked, gold, top-right, corner edges on:

1. Customise, add 25 to basket, open the full cart. `+ Order in another colour` appears; the
   current colour is not offered.
2. Pick a colour. A new line appears **immediately below** the source, with the sibling's real
   product name, the sibling's photo, quantity 25, and "Generating preview…".
3. Within a few seconds the preview becomes available. Open it: the logo sits **on the new
   colour's book**, corner edges on the book's actual corners — not in the whitespace.
4. The source's preview is unchanged.
5. Open the picker again on either line: the colour you just added is no longer offered.
6. Both lines show the 50-unit tier price and the "Priced at your 50-unit total across 2 colours"
   note. Subtotal, VAT and total are consistent.
7. Drop the green line to 10, leaving 35 in the group. Both lines re-price off the 35-unit group
   total (the 25+ bracket, 20 %), and the note now reads "35-unit total". No stale prices anywhere.
8. Drop both to 5 each (10 in the group). The minimum warning appears and checkout is disabled.
9. Remove the source line. The colour line survives, keeps its preview, and re-prices off its own
   quantity alone.
10. Reload the page. Everything above survives (IndexedDB), including previews and `colourOptions`.
11. Proceed to checkout. WooCommerce receives two lines with the two **different** `product_id`s,
    each with its own `abbey_preview_image` and identical branding fields.
12. Phase 3: amend the blue line's foil colour to Silver, apply to all. Both lines show Silver, and
    **both previews are regenerated on their own photos** — not one copied to the other.

Automated (the repo has `vitest` configured and one test, `generate-pdf.test.ts`, but **the suite
cannot currently run**: there is no `test` script in `package.json` and `vitest.config.ts` points
`setupFiles` at `./src/test/setup.ts`, which does not exist. Add the `test` script and create that
setup file as a prerequisite before writing these):

- `getGroupQuantity` / `validateCustomisationMinimums` — grouping, missing `colourGroupId`,
  single-line groups.
- `pricedItems` — tier selection from the group total while the line total uses the line quantity;
  the `customizationEnabled: false` fee-subtraction branch; the `tiers.length ? 0 : bulkDiscount`
  branch; a legacy item with no `basePrice`/`priceTiers`.
- `composeProof` — a golden-value test asserting `leftPercent`/`topPercent`/`widthPercent` for a
  fixed fixture image and each of the nine position labels, so the §5.2 extraction is provably
  behaviour-preserving.

---

## 10. Branch and commit strategy

Do **not** commit each tiny step. Work on a dedicated feature branch and commit only at the phase
checkpoints below — each is a coherent, reviewable, independently-testable unit.

```bash
git switch -c cart-customisation-logic
```

Commit at these checkpoints (not more often):

1. **Data model + proof extraction** — types (`positionLabel`/`logoScale`, `ColorVariant` fields,
   `CartItem` fields), the `composeProof` extraction, and `insertItemAfter`/`updateItem`. Land the
   `composeProof` golden-value test in this commit so the refactor is provably behaviour-preserving.
2. **Phase 1 — colour picker works end-to-end** — `ColourPickerRow`, `addColourVariant`, the cart
   trigger + status-aware preview row, checkout awaiting pending proofs. **Stop here and test the
   full flow before going further.**
3. **Phase 2 — derived group pricing + minimums** — the `pricedItems` switch, `colour-group.ts`,
   the pricing note and checkout gating, and the CartDrawer `pricedItems` swap. This commit changes
   money for **every existing basket**, not just the new feature — test legacy baskets (no
   `basePrice`, no tiers, customisation off) explicitly before committing.
4. **Phase 3 — amend + propagate** — the amend flow and group propagation.

Keep `git diff -w --ignore-cr-at-eol` clean at each checkpoint (the repo has heavy CRLF churn; see
§8 rule 7). Open the PR from `cart-customisation-logic`; do not merge Phase 3 until Phases 1–2 have
been reviewed, since they are independently shippable.
