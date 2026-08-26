# Prompt — Digital proof: add "Download proof (PDF)" to the cart, and make the Colour dynamic

Two related changes to the **customer-facing PDF proof**, both on branch `cart-customisation-logic`:

- **Part A** — add the existing product-page "Download proof (PDF)" button to each customised **cart**
  line.
- **Part B** — fix the generator's **hard-coded `Colour: Black`** so the proof always shows the
  item's **real** colour. The generator is shared, so this repairs the **product-page** proof at the
  same time — not only the cart.

Both are **customer-only**: the PDF is built in the browser and downloaded locally. Nothing is sent to
the manufacturer and nothing about checkout or the WooCommerce payload changes.

**Why "dynamic" matters (the point that motivated this):** the proof must reflect the *current* item.
It is generated on demand from the line's **current** `customization` and colour — so after a customer
**amends** the branding (which regenerates `fullPreviewUrl`) or picks a different colour, the next
download shows the new proof and the correct colour. Nothing is cached or baked in.

---

## PART A — Download proof in the cart

### A1. Reuse what already exists (don't rebuild)

- **`generateDigitalProof(product, customization, quantity, unitPrice)`** —
  `src/features/products/utils/generate-pdf.ts`. Builds an A4 PDF with jsPDF, returns an
  `ArrayBuffer`. Already used on the product page.
- **The product-page button** — `src/features/products/components/ProductCustomizer.tsx` (~lines
  675–712). Its handler is the exact pattern to copy (dynamic `import()` keeps jsPDF out of the main
  bundle — keep it dynamic):
  ```tsx
  const { generateDigitalProof } = await import('../utils/generate-pdf');
  const pdfBuffer = await generateDigitalProof(product, customization, quantity, priceDetails.unitPrice);
  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'proof-' + product.slug + '.pdf';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  ```

### A2. What the generator reads (so the cart can supply it)

From **product** (`StoreProduct`): `product.name`, `product.categories` (`{name}[]`, joined into the
subtitle — **must be an array**, it calls `.map`), `product.sku` (falls back to `'N/A'`).
From **customization** (`CustomizationState`): `fullPreviewUrl` (the composed proof image — the main
picture), `blockingType`, `foilColor` (only when `blockingType === 'Foil blocked'`),
`logoPosition?.label`, `cornerEdges`. Plus `quantity` and `unitPrice`.
It reads **no** logo size/scale/geometry — and it must stay that way (Hard rules).

### A3. The shape trap — the cart stores `LogoCustomization`, not `CustomizationState`

The cart line's `customization` is `LogoCustomization`
(`src/features/products/types/store-product.ts`), with different field names:

| Generator wants (`CustomizationState`) | Cart line has (`LogoCustomization`)     |
|----------------------------------------|-----------------------------------------|
| `blockingType`                         | `choice`                                |
| `logoPosition.label`                   | `positionLabel` (fallback `position`)   |
| `foilColor`                            | `foilColor` (same)                      |
| `cornerEdges`                          | `cornerEdges` (same; optional string)   |
| `fullPreviewUrl`                       | `fullPreviewUrl` (same)                 |

The cart line also has no `StoreProduct` (it has `item.name`, `item.slug`, `item.categorySlugs`, but
no `sku`/`categories` objects). So we need a **tiny adapter**. (This mapping already exists in the
codebase: `addColourVariant`/`propagateAmendToGroup` feed `blockingType: customization.choice` into
`composeProof`, and `CartContext` builds a throwaway `{ categories } as StoreProduct` for shipping.)

### A4. Pricing — use what the cart already computed, do NOT recalculate

The cart renders `pricedItems` (aliased `items`), so every line already has `item.unitPrice`,
`item.lineTotal`, `item.groupQuantity` — the group-tiered price the customer sees. Pass
**`item.unitPrice`** and **`item.quantity`** straight in. Do **not** call `calculateProductPrice`, and
do **not** touch `pricing.ts` or the `pricedItems` memo. The PDF's subtotal (`quantity * unitPrice`)
will then equal the `item.lineTotal` shown on the line.

### A5. Add the helper — `src/features/cart/utils/download-proof.ts` (new file)

```ts
import type { PricedItem } from '../context/CartContext';
import type { StoreProduct } from '@/features/products/types/store-product';
import type { CustomizationState } from '@/features/products/components/ProductCustomizer';

/** True only when a proof image exists to put in the PDF. */
export function canDownloadProof(item: PricedItem): boolean {
  return Boolean(item.customization?.enabled && item.customization.fullPreviewUrl);
}

/**
 * Generate + download the customer-facing PDF proof for one cart line.
 * Built on demand from the line's CURRENT customization, so amended branding
 * and the correct per-line colour always appear. Client-only — sent nowhere.
 */
export async function downloadCartItemProof(item: PricedItem): Promise<void> {
  const c = item.customization;
  if (!c?.fullPreviewUrl) return; // proof not ready (pending/failed) — nothing to render

  const product = {
    name: item.name,
    slug: item.slug ?? 'item',
    sku: '', // cart lines carry no SKU; generator falls back to 'N/A'
    categories: (item.categorySlugs ?? []).map((slug) => ({ id: 0, name: slug, slug, link: '' })),
  } as StoreProduct;

  const customization = {
    enabled: true,
    blockingType: c.choice,
    foilColor: c.foilColor,
    cornerEdges: (c.cornerEdges as CustomizationState['cornerEdges']) ?? 'None',
    logoPosition: { x: 0, y: 0, label: c.positionLabel ?? c.position },
    fullPreviewUrl: c.fullPreviewUrl,
    logoScale: c.logoScale ?? 1, // required by the type; NOT printed by the PDF
  } as CustomizationState;

  const { generateDigitalProof } = await import('@/features/products/utils/generate-pdf');
  // 5th arg (colourName) is added in Part B — pass the line's real colour:
  const pdfBuffer = await generateDigitalProof(
    product, customization, item.quantity, item.unitPrice, item.colour?.name,
  );

  const blob = new Blob([pdfBuffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `proof-${product.slug}.pdf`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
```

> The `as StoreProduct` / `as CustomizationState` casts are safe **only because** the generator reads
> just the fields in A2 — which we all provide. Don't trim fields on the assumption they're unused.

### A6. Wire the button — `src/app/cart/page.tsx`

The customised-line action row (~lines 223–246) already holds **"Amend customisation"** and
**"+ Order in another colour"**. Add a third action there, gated on the proof being ready:

```tsx
{canDownloadProof(item) && (
  <>
    <span className="text-gray-300">|</span>
    <button type="button" onClick={() => downloadCartItemProof(item)} className="hover:underline">
      Download proof (PDF)
    </button>
  </>
)}
```

- Import: `import { downloadCartItemProof, canDownloadProof } from '@/features/cart/utils/download-proof';`
- `item` is a `PricedItem` (the row maps from `pricedItems`), so `item.unitPrice` is present.
- Match the surrounding cart styling (`hover:underline`, text-black), not the product page's purple.
- **Gate on `canDownloadProof`** (i.e. `fullPreviewUrl` present). While a colour variant's proof is
  `pending`/`failed`, `fullPreviewUrl` is absent and the button correctly does not show — and this
  also prevents downloading a stale proof mid-regeneration during an amend.

---

## PART B — Make the "Colour" dynamic (fixes the hard-coded "Black")

Today `generate-pdf.ts` (~line 106) does `addSpecRow('Colour', 'Black');` — every proof says Black,
which is wrong for every non-black item on **both** the product page and the cart. Make it use the
real colour, passed in by the caller.

### B1. Generator — add an optional `colourName` and render the real value

`src/features/products/utils/generate-pdf.ts`

Change the signature to accept the colour:

```ts
export const generateDigitalProof = async (
  product: StoreProduct,
  customization: CustomizationState,
  quantity: number,
  unitPrice: number,
  colourName?: string,
) => {
```

Replace the hard-coded row:

```ts
  // Color is just "Black" for now or pull from product
  addSpecRow('Colour', 'Black');
```

with — render the row only when we actually know the colour (no more false "Black"; no ugly "N/A"):

```ts
  if (colourName && colourName.trim()) {
    addSpecRow('Colour', colourName.trim());
  }
```

That is the only change to `generate-pdf.ts`. Do **not** touch anything else in it (layout, pricing,
image handling).

### B2. Cart caller — already done in Part A

`downloadCartItemProof` passes `item.colour?.name` (A5). This is set for the original customised line
(`ProductDetailClient` ~line 516) and for every "Order in another colour" variant
(`add-colour-variant.ts` ~line 23), so each cart line prints its own colour. If a line has no colour
(single-colour product), the row is simply omitted — never "Black".

### B3. Product-page caller — pass the active colour into the customiser

The product-page button lives in `ProductCustomizer`, which currently receives `activeColorHex` but
not the colour **name**. Thread the name through, parallel to the hex.

1. **`ProductCustomizer.tsx`** — add a prop (next to `activeColorHex?: string`, ~line 53):
   ```tsx
   activeColorName?: string;
   ```
   Destructure it (~line 68, next to `activeColorHex`), and in the download handler (~line 691) pass
   it as the 5th argument:
   ```tsx
   const pdfBuffer = await generateDigitalProof(product, customization, quantity, priceDetails.unitPrice, activeColorName);
   ```

2. **`ProductDetailClient.tsx`** — you already compute `activeColorHex` (~line 92). Add the name
   beside it:
   ```tsx
   const activeColorName = colorVariants.find(c => c.slug === product.slug)?.name;
   ```
   and pass it where `<ProductCustomizer .../>` is rendered (~line 655, next to `activeColorHex={activeColorHex}`):
   ```tsx
   activeColorName={activeColorName}
   ```

Use `ColorVariant.name` (authoritative, matches the colour swatches). Do **not** read `pa_colour`
attributes — the codebase notes they're unreliable (e.g. "Biscuit" is tagged "Brown").

---

## Hard rules

1. **Never show logo sizing/scale** in the PDF — keep printing only Colour/SKU/Branding/Foil/Position/
   Corner Edges + pricing. Do not add `logoScale`, `widthPercent`, `leftPercent`, `topPercent`, or
   `imageBounds`.
2. **Only edit `generate-pdf.ts` for the `colourName` param** (B1). No layout/pricing/image changes.
3. **Do not touch pricing** — no `pricing.ts`, no `pricedItems`. Use `item.unitPrice`/`item.quantity`.
4. **Do not touch the edge-detection fetch** (`getImageBoundingBox` in `product-helpers.ts`) or proof
   composition (`composeProof`). This feature only *reads* an already-composed `fullPreviewUrl`; it
   never regenerates a proof.
5. **Nothing new leaves the browser** — no checkout / WooCommerce / API changes.
6. Repo has heavy CRLF churn — review with `git diff -w --ignore-cr-at-eol`; confirm no UTF-8 BOM
   (`efbbbf`) was introduced.

---

## Verification

1. `npx tsc --noEmit` passes (the new optional param and the casts type-check).
2. **Cart download:** add a customised item (≥ min qty) → the line shows **Download proof (PDF)**;
   clicking downloads `proof-<slug>.pdf` that opens and shows the proof image, spec, and a pricing
   block whose subtotal equals the line total in the cart.
3. **Real colour:** for a **non-black** product/variant, the PDF's **Colour** row shows the actual
   colour (e.g. "Navy"), **not** "Black" — verify on **both** a product-page download and a cart
   download.
4. **Per-variant colour:** add a second colour via "Order in another colour"; its proof shows that
   colour's image and that colour's name; the first line still shows its own colour.
5. **Dynamic after amend:** amend a colour's branding and apply to all → each line's downloaded proof
   reflects the **new** branding (image + spec), colour unchanged and still correct.
6. **Gating:** while a variant's preview says "Generating…", the Download button is absent on that
   line; a non-customised line never shows it.
7. The downloaded PDF contains **no** logo size/scale text anywhere.
8. `git diff -w --ignore-cr-at-eol` shows only: new `download-proof.ts`, the cart button block, the
   one-line `generate-pdf.ts` change, and the `activeColorName` threading.

---

## Branch & commit

On `cart-customisation-logic`:

```
feat(cart): download PDF proof from cart + show real colour in proof (customer-only)
```
