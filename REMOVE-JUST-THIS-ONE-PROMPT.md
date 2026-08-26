# Prompt — safely remove "No, just this one" (amend = apply-to-all only)

## Goal

When a customer amends a colour that belongs to a colour group, the **"Apply to all colours?"**
dialog currently shows two buttons: **"Yes, apply to all"** and **"No, just this one."** Remove the
**"No, just this one"** button so that amending a grouped colour **always applies the change to every
colour in the group.** For now, per-colour divergence is **not allowed**.

**Do NOT build any "separate product / separate charge / detach" behaviour.** That is a *future*
feature, documented for reference only in `CUSTOMISE-COLOUR-SEPARATELY-PROMPT.md`. **Do not implement
that file.** This task only removes the "No, just this one" option.

## Why a naive delete caused a problem (read before editing)

In `src/features/products/components/ProductDetailClient.tsx`, the amend save flow does this order:

1. **The amended line is written with its NEW branding first** — `updateItem(amendKey, {...})` at
   **~line 487**.
2. **Then**, if the line has siblings, the "Apply to all colours?" dialog opens
   (`setPendingPropagate(...)`, ~line 499).

"Yes, apply to all" copies the new branding onto the siblings (`propagateAmendToGroup`). "No, just
this one" just navigated to the cart **without** propagating — leaving that one line with different
branding but still inside the group, so it kept the group's combined quantity price. That
divergent-but-grouped line is the bug.

Because the line is **already updated before the dialog**, the only safe way to finish a grouped
amend is to apply the change to all colours. **So the dialog must not offer any path that closes
without propagating** — no "just this one", and (important) **no "Cancel" button either**, since a
cancel would leave the already-written line divergent. The remaining flow is: grouped amend → one
button → applies to all.

## The change — one file only: `src/features/products/components/ProductDetailClient.tsx`

### Step 1 — Delete the "No, just this one" button

Remove this entire block (currently ~lines 1133–1143):

```tsx
              <button
                type="button"
                disabled={isPropagating}
                onClick={() => {
                  sessionStorage.removeItem(`abbeygate-amend-${pendingPropagate.amendKey}`);
                  window.location.href = '/cart';
                }}
                className="w-full h-12 bg-gray-100 text-gray-900 font-medium rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                No, just this one
              </button>
```

Leave the **"Yes, apply to all"** button (and its `onClick`, spinner, and `disabled={isPropagating}`)
exactly as they are.

### Step 2 — Reword so a single action reads correctly

A yes/no question with only a "Yes" button looks broken. Change the heading, body, and the remaining
button label (do **not** touch its `onClick`):

Replace:

```tsx
            <h3 className="text-xl font-bold text-gray-900 mb-2">Apply to all colours?</h3>
            <p className="text-gray-600 mb-8">
              Would you like to apply these branding changes to all {pendingPropagate.siblingsCount} other {pendingPropagate.siblingsCount === 1 ? 'colour' : 'colours'} in this group?
            </p>
```

with:

```tsx
            <h3 className="text-xl font-bold text-gray-900 mb-2">Update all colours</h3>
            <p className="text-gray-600 mb-8">
              These branding changes will be applied to all {pendingPropagate.siblingsCount} other {pendingPropagate.siblingsCount === 1 ? 'colour' : 'colours'} in this group, so every colour matches.
            </p>
```

And change the remaining button's label only:

```
Yes, apply to all   →   Apply to all colours
```

### Step 3 — Do NOT change anything else

- Keep `updateItem(amendKey, {...})` at ~line 487 and the `siblingsCount` / `setPendingPropagate`
  gate at ~498 exactly as-is.
- Keep the **non-grouped** path (`siblingsCount === 0` → straight to cart) unchanged.
- `pendingPropagate` and `isPropagating` are still used by the remaining button — **do not remove
  them**, and do not add a "Cancel" or backdrop-click-to-close (that would reintroduce divergence).
- Do **not** touch pricing (`pricing.ts`, the `pricedItems` memo), the edge-detection fetch
  (`getImageBoundingBox`), or add any logo size/scale to the cart or checkout payload.

## Verification (do all of these before committing)

1. The dialog now shows exactly **one** button ("Apply to all colours") plus the heading/body — no
   second button, no leftover `</button>` or dangling commas/brackets.
2. Type-check/build passes with no unused-variable or JSX errors (`npx tsc --noEmit`, then your build).
3. `grep -rn "just this one" src` returns **nothing**.
4. Manual: amend a colour in a 2-colour group → dialog shows one "Apply to all colours" button →
   clicking it updates **both** colours and returns to the cart; both stay at the combined group
   price; there is no way to end up with one colour different from the other.
5. Manual: amend a **standalone** customised line (not in a group) → **no dialog**, saves straight to
   the cart (unchanged behaviour).
6. Review the diff with `git diff -w --ignore-cr-at-eol` (repo has CRLF churn) and confirm no UTF-8
   BOM (`efbbbf`) was introduced.

## Commit (branch `cart-customisation-logic`)

```
fix(cart): amend applies to all colours — remove "just this one" divergence
```

---

### Future note (not part of this task)

If the client later confirms they want per-colour divergence, the plan is to bring back a
"just this colour" action that turns that colour into a **separate product** — its quantity no longer
counts toward the group, it re-prices on its own quantity, and any set-up cost would change. That is
specified in `CUSTOMISE-COLOUR-SEPARATELY-PROMPT.md`. **Do not implement it until the client signs
off.**
