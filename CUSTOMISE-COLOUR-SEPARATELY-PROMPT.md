# Implementation prompt — "Customise this colour separately" (the "No, just this one" path)

> Companion to `ORDER-IN-ANOTHER-COLOUR-PROMPT.md`, which is **already implemented**. Read that
> first for the data model; this prompt adds one capability on top of it.
>
> **Status: ready to build. Design decided.** The separate-customisation path is the **restored
> "No, just this one" button** in the amend dialog, wired to **detach + reprice** (pricing model A1
> below). The only still-open item is whether the client *also* wants an explicit fixed fee on top of
> the emergent price change (§3.1, A2) — not required to ship this.

---

## 1. What we are building

Colour variants in the cart **share one branding job**. "Order in another colour" clones a line's
customisation onto a new colour, and "Amend customisation" edits the branding and applies it to
**all** colours in the group (see §2). They stay identical and are priced together as one combined
quantity.

The client wants an escape hatch: let a customer give **one colour its own, different customisation**
— but make clear that is a *new, separately-priced* customisation, not a free tweak of the shared
job.

**The decided mechanism:** when a customer amends a colour and saves, the existing **"Apply to all
colours?"** dialog is the gate. It offers two choices:

- **Yes, apply to all** → the edit propagates to every colour; the group stays identical and stays
  combined-priced (unchanged, existing behaviour).
- **No, just this one** → this colour **keeps the new branding, leaves the group, and is priced on
  its own quantity** from then on. The other colours are untouched.

So the "separate charge" is surfaced *at save time*, as the explicit choice between the two buttons —
"just this one" is the customer knowingly opting into a separate, individually-priced customisation.

> Note on the client's original wording: they described a warning *before* opening the customiser.
> We're placing the choice at *save time* instead, because that is exactly where the "No, just this
> one" button lives and where the branding actually diverges. The dialog copy (§4.3) carries the
> "this will be priced separately" warning, so the intent is preserved. If the client insists the
> warning must appear before any editing, add a pre-customiser confirm as a follow-up — not covered
> here.

---

## 2. Current state (what you're changing)

Verified in the repo (branch `cart-customisation-logic`):

- **`CartItem`** (`src/features/cart/context/CartContext.tsx`) carries `colourGroupId`, `colour`,
  `colourOptions`, `proofStatus`, `basePrice`, `priceTiers`, `isGifts`, `proofGeometry`.
- **`pricedItems`** (same file, `useMemo`) computes each line's `groupQuantity` as the sum of
  `quantity` over items sharing `(colourGroupId ?? key)`, picks the tier from that group total, and
  bills `lineTotal = unitPrice * item.quantity`. **This is the entire pricing mechanism we rely on —
  we do not touch it.**
- **"Amend customisation"** — `amendLine(item)` in `src/app/cart/page.tsx` writes
  `sessionStorage['abbeygate-amend-<key>']` and navigates to `/product/<slug>?amend=<key>`.
  `ProductDetailClient` reads the `amendKey` prop, hydrates the customiser, and on "Update Basket":
  1. **applies the new branding to the amended line first** — `updateItem(amendKey, { quantity,
     price, customization, proofStatus: 'ready' })` (`ProductDetailClient.tsx` ~line 487);
  2. **then**, if the line has siblings, opens the **"Apply to all colours?"** dialog —
     `setPendingPropagate({ amendKey, customization, siblingsCount })` (~line 499).
- **The dialog today (~line 1300) has only ONE button, "Yes, apply to all"**, which calls
  `propagateAmendToGroup(...)` (`src/features/cart/utils/amend-group.ts`) to copy the branding onto
  every sibling, then goes to `/cart`. **The old "No, just this one" button was removed** (it used to
  leave a divergent line inside the group at the combined price — a pricing loophole). This prompt
  **re-adds "No, just this one" with correct detach logic.**
- **There is no set-up / origination fee anywhere in the codebase.** Customisation cost is the
  per-unit blocking fee inside `pricing.ts`. Do not add a fee unless §3.1 A2 is chosen by the client.

Key consequence of step 1 above: **by the time the dialog appears, the amended line already has its
new branding and a freshly composed proof for its own colour.** So "No, just this one" does not need
to re-apply anything — it only needs to **detach** the line from the group. That is the whole change.

---

## 3. Pricing

### 3.1 What the "separate charge" is

**A1 — the model this spec implements: the charge is emergent, not a new fee.** Once the line
detaches, its `colourGroupId` no longer matches its old siblings, so `pricedItems` prices it on its
**own** quantity and re-prices the remaining group on the reduced total. Losing the shared volume
discount *is* the extra cost. **No pricing code changes, no invented number.**

Worked example (existing tiers): 25 Navy + 25 Burgundy share the 50-unit tier. Detach Burgundy →
Burgundy prices at the 25-unit tier, and Navy falls back to the 25-unit tier too. Both now pay the
higher per-unit price. That difference is the "separate charge," produced entirely by code that
already ships.

**A2 — optional, only if the client also wants an explicit fee:** add a one-off origination fee to
the detached line. This is a **new pricing concept** and needs (a) the £ amount and (b) whether it is
per line or per unique artwork. If chosen, surface it as a **separate line-level field** in the order
summary — do **not** fold it into the per-unit price. **Do not implement A2 unless the client gives a
number.** It is not required to ship the feature.

### 3.2 Do not build pricing here

The re-pricing is a pure consequence of the `colourGroupId` change (§4.4). If you find yourself
editing `pricing.ts` or the `pricedItems` memo, stop — A1 needs zero pricing changes.

---

## 4. Implementation

All changes are in **`ProductDetailClient.tsx`**, in the `pendingPropagate` dialog (~line 1300). No
cart-page changes, no new buttons elsewhere.

### 4.1 Re-add the "No, just this one" button

Inside the dialog's button column (the `flex flex-col w-full gap-3` div), **after** the existing
"Yes, apply to all" button, add a secondary button:

```tsx
<button
  type="button"
  disabled={isPropagating}
  onClick={async () => {
    // Detach this colour from its group. Its new branding is ALREADY applied
    // (updateItem ran at ~line 487 before this dialog opened), so we only need
    // to break it out of the group so pricedItems re-prices it on its own quantity.
    await updateItem(pendingPropagate.amendKey, {
      colourGroupId: `solo-${pendingPropagate.amendKey}-${Date.now()}`,
    });
    sessionStorage.removeItem(`abbeygate-amend-${pendingPropagate.amendKey}`);
    window.location.href = '/cart';
  }}
  className="w-full h-12 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
>
  No, just this colour (priced separately)
</button>
```

That is the entire behavioural change. Crucially, this branch **does not call
`propagateAmendToGroup`** — the siblings are left exactly as they were.

> **Trap — the new `colourGroupId` must be a fresh unique id, NEVER the line's own `key`.** For the
> **source** line of a group, `key === colourGroupId` already, and the siblings point at that same
> value. If you "detach" the source by setting its group id to its key, the siblings still match it
> and stay grouped **with** it — the opposite of detaching. Always mint a brand-new id
> (`solo-<key>-<timestamp>`). This makes detach behave identically whether the customer amended the
> source line or a sibling. (Optionally extract this into a tiny helper
> `detachFromColourGroup(key, updateItem)` for unit testing — see §6.)

### 4.2 Do not clear `colourOptions` on the detached line

Leave `colour` and `colourOptions` intact. The detached line stays a valid, standalone customised
product that can itself later seed a *new* colour group via "Order in another colour" off its new
branding. Only `colourGroupId` changes.

### 4.3 Reword the dialog copy so "just this one" reads as a priced choice

The current copy assumes a single outcome. With two buttons it must present the trade-off and carry
the client's "separately charged" warning. Replace the `<h3>` + `<p>`:

```tsx
<h3 className="text-xl font-bold text-gray-900 mb-2">Apply to all colours?</h3>
<p className="text-gray-600 mb-8">
  This colour is part of a group with {pendingPropagate.siblingsCount} other{' '}
  {pendingPropagate.siblingsCount === 1 ? 'colour' : 'colours'}. Applying to all keeps every colour
  identical and priced together on the combined quantity. Choosing just this colour makes it a
  separate customisation — it leaves the group and is priced on its own quantity.
</p>
```

Keep the wording free of any £ figure (pricing is emergent under A1). Do **not** mention logo size or
scale (rule 1).

### 4.4 Re-pricing is automatic — verify it, don't build it

After the `colourGroupId` change, `pricedItems` recomputes on the next render:

- the detached line's `(colourGroupId ?? key)` is now unique → its `groupQuantity` is just its own
  `quantity` → it prices on its own tier;
- every remaining old-group member re-sums a smaller group total → they re-price too.

### 4.5 The minimum-quantity consequence (surface it, don't block silently)

A colour that was only valid because the **group** met `CUSTOMIZATION_MIN_QTY = 25` may fall below
the minimum once standalone (e.g. 10 units, valid inside a 50-unit group, invalid alone). The
existing `validateCustomisationMinimums` already drives an inline warning and disables checkout, so
this surfaces automatically. Do **not** auto-clamp the quantity.

---

## 5. Hard rules

1. **Never show logo sizing/scale** in the cart, the dialog, or the checkout payload. `logoScale`,
   `widthPercent`, `leftPercent`, `topPercent`, `imageBounds` are internal geometry only.
2. **Do not touch the edge-detection fetch** (`getImageBoundingBox` in `product-helpers.ts` — the
   live one, not the dead copy in `image-bounds.ts`). It must keep using
   `/_next/image?url=...&w=1080&q=75` for `http` URLs. It fails silently to `null` bounds, which
   misplaces corner edges with no error.
3. **No new pricing code under model A1.** The charge is emergent. Touching `pricing.ts` /
   `pricedItems` is out of scope unless the client picks A2 and supplies a number.
4. **Detach must use a fresh unique group id**, never the line's own key (§4.1 trap).
5. **The "No, just this one" branch must NOT call `propagateAmendToGroup`.** Siblings keep their old
   branding and their old proofs; only their price re-tiers because the group total dropped.
6. **"Yes, apply to all" is unchanged.** Do not alter the propagate path.
7. **A colour that differs from its group must never keep the group's combined price.** Detaching is
   the only mechanism that makes a colour different, and it always re-prices it standalone.
8. Repo has heavy CRLF churn — review with `git diff -w --ignore-cr-at-eol`; check no UTF-8 BOM
   (`efbbbf`) after edits.

---

## 6. Acceptance tests

On a slim/pocket diary, foil blocked, with a real logo:

1. Add 25 units in **Navy**, then "Order in another colour" → add **Burgundy** at 25. Both show the
   50-unit tier price and the "priced across 2 colours" note.
2. In the cart, click **Amend customisation** on Burgundy → the product page opens in amend mode.
3. Change the foil to **Silver**, click **Update Basket** → the "Apply to all colours?" dialog appears
   with **both** buttons.
4. Pick **Yes, apply to all** → back in cart: **both** colours are now Silver, still grouped, still
   50-tier. (Shared-edit path, unchanged.)
5. Reset, repeat to the dialog, then pick **No, just this colour** → back in cart: Burgundy shows
   Silver **on its own photo**, has **left the group** (no combined-price note), and **both lines now
   show the 25-unit tier price**. Navy is **unchanged** (old foil) and did **not** become Silver.
6. Detaching the **source** line (Navy, added first) behaves identically — Navy leaves cleanly with a
   fresh `solo-…` group id and Burgundy remains intact and re-prices on its own quantity.
7. Reduce the detached line to 10 units → the minimum-quantity warning appears on it and checkout is
   disabled (it can no longer borrow the group's quantity).
8. Reload → all of the above persists (IndexedDB).
9. Checkout → WooCommerce receives the detached line as its own `product_id` with its own preview,
   independent of the old group; no sizing/scale field is sent.

Automated:

- **detach helper** — for both a source line and a sibling line, assigns a fresh unique
  `colourGroupId` that is **not** the line's own key and does not collide with the old group id;
  leaves all other items untouched.
- **`pricedItems` after detach** — the detached line prices on its own quantity; remaining members
  re-tier on the reduced total. (No pricing code changes; the test just proves the emergent
  behaviour.)
- **"No, just this one" branch** — does **not** call `propagateAmendToGroup`; siblings' `customization`
  is unchanged after the branch runs.

---

## 7. Branch & commits

Continue on `cart-customisation-logic`. This is a small, cohesive change — a single checkpoint commit:

```
feat(cart): re-add "just this colour" — detach from group and price standalone
```

Do not commit until acceptance tests 1–6 pass end-to-end, because detaching touches the grouping the
pricing engine reads live.
