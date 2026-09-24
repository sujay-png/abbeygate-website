# Next.js checkout implementation plan

## Decision

## Continuation handoff / delivery tracker

This document is the source of truth for continuing the checkout work in a later Codex/AI session. Read this file and `.agents/AGENTS.md` before making changes. Preserve the existing WordPress checkout redirect as fallback until the launch checklist is complete.

### Completed

- [x] Audited live WooCommerce gateways through the existing REST credentials: WooPayments card, Apple Pay, Google Pay, and BACS are enabled; WooPayments is in test mode; PayPal and the separate WordPress Stripe gateway are disabled.
- [x] Chosen payment direction: direct Stripe SDK for the custom Next.js checkout; WooCommerce remains the order/fulfilment/email back office; BACS remains an offline WooCommerce payment method.
- [x] Added `implementation_plan.md` and committed it (`56bdcac`).
- [x] Built the responsive `/checkout` UI, simplified checkout-only header, compact footer, cart summary, and empty-cart state. The normal site chrome is hidden only for `/checkout` (`c299e89`).
- [x] Added blank Stripe environment-variable placeholders in `.env` and `.env.example`.
- [x] Installed official Stripe dependencies: `stripe`, `@stripe/stripe-js`, and `@stripe/react-stripe-js`.
- [x] Added the initial server-side quote endpoint (`POST /api/checkout/quote`). It validates cart shape, reloads current WooCommerce products and B2B tier metadata, and recalculates customisation, shipping and VAT on the server. It is not yet connected to the customer UI or payment flow.
- [x] Added a Redis-backed checkout-session API (`POST`/`GET /api/checkout/session`) with opaque IDs and a ten-minute expiry. It persists the server-generated quote; no browser-submitted totals are stored as authoritative payment data.
- [x] Added initial server-side coupon lookup and validation to the quote flow (existence, expiry, global usage limit, minimum/maximum cart value, percentage/fixed-cart discount, and free shipping). WooCommerce must still re-validate all coupon constraints at order creation.

### Current state and intentional limits

- `/checkout` is visual/form-only; it must not place an order or collect card details yet.
- The current cart CTA still redirects to WordPress checkout. Keep it as a fallback until payment and order creation pass staging tests.
- Browser cart prices, shipping, VAT and coupon state are display-only. They are not authoritative enough to charge a customer.
- Never expose `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, WooCommerce secrets, or WordPress credentials to client components.

### Immediate next implementation sequence

1. Add a durable checkout-session store (database preferred; Redis/KV only if persistence/expiry are explicitly suitable).
2. Add server-side quote validation: retrieve WooCommerce product/variation data, validate stock/options/quantities/customisation, calculate final price/shipping/tax/coupon totals, and return an expiring quote ID.
3. Replace the UI totals with the returned quote only after its server contract and tests are complete.
4. Create WooCommerce orders from the server quote, with line-item customisation metadata and safely uploaded logo/proof assets.
5. Add Stripe PaymentIntent creation plus the Stripe Payment Element. Confirm payment only from the verified signed webhook, then update the WooCommerce order status.
6. Add BACS `on-hold` order creation and payment instructions; add PayPal only if the client confirms it should be active.
7. Add success/retry states, observability, staging test cases, then feature-flag the cart CTA to `/checkout`.

### Required environment variables

```dotenv
# Browser-safe Stripe key only
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Server only — never prefix with NEXT_PUBLIC and never commit values
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Already present; server only
WOOCOMMERCE_STORE_URL=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
```

### Credentials and access rules

- Do not paste credentials in chat. Use the local `.env` or a secure secret manager.
- A WordPress application password is not currently needed. Create a temporary least-privilege user only if an audit requires WordPress-only settings not covered by WooCommerce REST.
- Use Stripe test-mode keys first. Production keys/webhook endpoint are a launch-stage change, not an early-development change.

Yes, a full Next.js checkout is feasible. The optimal implementation is a **headless checkout with WooCommerce retained as the commerce back office**:

- Next.js owns the checkout design and customer experience.
- WooCommerce remains the source of truth for products, orders, stock, taxes, coupons, shipping, customer records, admin fulfilment, and transactional order emails.
- Stripe is used for card payments (including debit cards). PayPal is handled by its own supported PayPal integration. Direct bank transfer remains a WooCommerce-style offline payment method.

This is not overly heavy if we deliberately avoid rebuilding WooCommerce inside Next.js. It is a medium-sized, security-sensitive feature; the payment UI is the straightforward part, while reliably creating orders, handling asynchronous payment confirmation, coupons, shipping, custom uploads, and emails is the important work.

## What exists today

The storefront already has the right foundations:

- The cart is stored locally in Next.js.
- `src/app/api/checkout/route.ts` creates a WooCommerce cart session, sends customisation fields/files using the current WooCommerce AJAX endpoint, and redirects to WordPress checkout.
- WooCommerce REST access is already configured server-side.
- Product tier pricing is read from B2BKing metadata, with a local fallback.
- A local shipping calculation mirrors the current WooCommerce shipping formula.
- WooCommerce currently receives and preserves the custom logo/proof files during the redirect flow.

The present route is a bridge to the WordPress checkout, not a headless checkout API. It must not become the permanent payment implementation.

## Target architecture

```text
Next.js checkout UI
  -> server-side checkout API (validates cart and recomputes all money)
      -> WooCommerce order service (orders, coupons, tax/shipping, custom order metadata)
      -> Stripe Payment Intents (card payment)
      -> PayPal Orders API / official PayPal checkout (PayPal payment)
      -> bank-transfer order (awaiting payment)

Stripe/PayPal webhook -> server-side verification -> WooCommerce order status
WooCommerce status transition -> existing WooCommerce email templates and fulfilment
```

Do **not** trust product prices, discounts, shipping, tax, coupon validity, or payment status supplied by the browser. The server must re-fetch products and calculate/reconcile the final totals before every order is created.

## Payment-method recommendation

| Customer method | Recommended implementation | Notes |
| --- | --- | --- |
| Credit/debit cards | Stripe Payment Element + Payment Intents | PCI card data remains with Stripe; supports SCA/3DS. |
| PayPal | PayPal JavaScript SDK + server-created PayPal order | Do not attempt to process PayPal through Stripe unless the business deliberately adopts a Stripe-supported PayPal product and its regional constraints are confirmed. |
| Direct bank transfer (BACS) | Create WooCommerce order as `on-hold`; show bank instructions | This is an offline payment method, no payment webhook. |
| Any existing additional gateway | Audit its API/headless support first | A WooCommerce-only gateway may require a redirect fallback or replacement. |

Stripe is not a universal replacement for every existing WordPress payment plugin. Stripe handles cards very well; PayPal and BACS should remain explicit separate flows. Before build, we need the exact active WooCommerce payment gateways and their settings from **WooCommerce -> Settings -> Payments**.

## Implementation phases

### 1. Checkout discovery and parity contract

Use a staging site where possible. Record the current checkout behaviour before implementation:

- Active payment gateways, order statuses, gateway fees, required billing/shipping fields, countries/currencies, tax configuration, and shipping methods.
- Coupon rules: fixed/percentage/free-shipping, expiry, minimum spend, individual-use/exclusions, and B2B/customer restrictions.
- WooCommerce email recipients/templates and any plugins that act on new/paid/on-hold orders.
- Custom product fields/plugins, especially the current logo/proof upload fields and their order-item metadata.
- B2BKing rules that influence prices, taxes, payment methods, shipping, or customer roles (not only visible price tiers).
- Required privacy, terms, marketing-consent, VAT/company fields, fraud checks, analytics, and order-number conventions.

Output: a signed-off parity checklist and test cases, including representative guest, logged-in/B2B, coupon, custom-logo, BACS, card, PayPal, failed-payment, and webhook-retry orders.

### 2. Define the server-side commerce boundary

Create a `checkout` feature in the project’s existing feature-sliced structure:

```text
src/features/checkout/
  components/        # checkout form, order summary, payment panels
  services/          # quote, coupon, order and payment provider adapters
  types/             # checkout request/quote/order types
  utils/             # validation and money helpers
src/app/api/checkout/
  quote/route.ts
  coupon/route.ts
  payment-intent/route.ts
  paypal/route.ts
  place-order/route.ts
src/app/api/webhooks/
  stripe/route.ts
  paypal/route.ts
src/app/checkout/page.tsx
src/app/checkout/success/page.tsx
```

Use a small server-side `checkout_session` record (database or durable KV) with an opaque ID, cart snapshot, quoted totals, customer/order IDs, provider IDs, idempotency keys, and status. This prevents duplicate orders and allows payment returns/retries. Do not place payment secrets or the authoritative quote in localStorage.

### 3. Build the authoritative quote and coupon APIs

- Convert the local cart item IDs/options into a server-side quote.
- Fetch current product/variation data from WooCommerce; validate availability, min/max quantities, and customisation rules.
- Calculate the selected B2B tier/customisation price server-side using a single shared calculation module; eliminate divergent browser-only pricing before launch.
- Implement shipping/tax calculation through WooCommerce or a shared, thoroughly tested pricing engine. WooCommerce is preferred whenever its configuration is the authority.
- Validate and apply coupons through WooCommerce, preserving current rules rather than duplicating them by hand.
- Return an immutable quote ID, line-item breakdown, totals, accepted coupon(s), shipping options, and expiry time to the UI.

### 4. Create WooCommerce orders correctly

- On the server, create a WooCommerce order with billing/shipping data, line items, shipping lines, coupon lines, tax lines, customer ID where applicable, and the selected payment method.
- Attach customisation selections, uploaded logo, and generated proof to the relevant **order item**, not only an order note.
- Move uploads to server/object storage or the WordPress media endpoint before order creation; avoid relying on client-held blobs after payment redirect.
- Save provider IDs as order metadata and use idempotency keys for every create/update operation.
- Start card/PayPal orders as `pending` (or the status expected by existing plugins), BACS as `on-hold`, and only move a paid order to `processing` after verified payment.

### 5. Add payment providers and webhooks

**Stripe:** create the PaymentIntent from the final server quote; confirm it with Stripe Elements in the browser; verify the signed `payment_intent.succeeded` webhook before marking the WooCommerce order paid. Support 3DS, declined cards, cancellations, and a safe retry without duplicating the order.

**PayPal:** server creates the PayPal order for the quoted total; the browser approves it using the PayPal SDK; server captures and verifies it. Confirm payment through a verified PayPal webhook as the durable source of truth.

**BACS:** server creates the WooCommerce `on-hold` order; show the bank details and order reference from controlled configuration; preserve the normal WooCommerce `on-hold` email. Payment reconciliation remains an admin process unless a bank-feed integration is later required.

All webhook routes must verify provider signatures, be idempotent, log safely, and respond quickly. A scheduled reconciliation/admin recovery screen is sensible for rare cases where a provider payment succeeds but a webhook is delayed.

### 6. Deliver the checkout UI and migration path

- Build the new responsive `/checkout` page from the supplied reference after the contract/API work is stable.
- Include contact, billing/shipping, delivery method, coupon, order summary, payment-method selector, terms/privacy consent, inline errors, and accessible loading states.
- Change the cart CTA to `/checkout` only when the new checkout is enabled by a feature flag.
- Retain the current WordPress checkout redirect as a production fallback during rollout; do not remove it initially.
- Add a clear success page that reads verified order state from the server, not URL parameters alone.

### 7. Email, admin, observability, and launch

- Keep WooCommerce responsible for normal order emails. Creating/updating an order through its API and status transitions triggers the existing email workflow in most setups; verify every installed mail/custom-order plugin during discovery.
- Use Stripe/PayPal emails only as payment receipts if desired; avoid duplicate customer order emails.
- Add Sentry/error monitoring for API failures and alerts for failed webhook verification, orders stuck in pending, and payment/order total mismatches.
- Test in Stripe and PayPal sandbox plus WooCommerce staging; perform a controlled real low-value production transaction before switching traffic.
- Roll out with a feature flag, monitor conversion/error metrics, and leave the WordPress fallback available until parity is demonstrated.

## Security and operational requirements

- Never send WordPress application passwords, WooCommerce REST secrets, Stripe secret keys, PayPal client secrets, or webhook secrets to the browser or commit them to `.env`.
- Prefer a WooCommerce REST API key with only the required permissions for the final integration. An application password may help audit WordPress/plugin settings, but it is not the preferred long-term checkout credential.
- Use server-only environment variables, signed webhook verification, CSRF/origin checks where applicable, input validation, rate limiting, audit logs, and idempotency keys.
- Card details must be captured only by Stripe’s hosted Elements/SDK. This keeps the project out of direct PCI card-data handling.
- Treat payment success redirects as untrusted UX events; only a verified provider webhook (or verified provider API lookup) may mark an order paid.

## What I need before implementation

1. A staging WordPress/WooCommerce URL and a least-privilege API credential (not a production administrator password in chat).
2. Screenshots/export of **WooCommerce -> Settings -> Payments**, Shipping, Tax, Emails, and Coupons, plus the active-plugin list.
3. Stripe account access for test-mode keys/webhook configuration and PayPal sandbox credentials, if PayPal remains enabled.
4. The desired checkout design reference, required fields, countries/currencies, and the business decision on whether WooCommerce or Next.js sends each email.
5. Confirmation of the current live checkout URL/domain and whether the Next.js site and WordPress site will remain on the same parent domain.

## Scope and risk estimate

For the stated requirements, this is a practical medium project, not a platform rewrite. The main risk is hidden WordPress plugin behaviour: gateway plugins, B2BKing role rules, shipping/tax customisations, and custom logo upload/order-meta logic. The discovery phase avoids discovering those differences only after customers have paid.

The lean first release should cover: card, PayPal, BACS, exact current coupon/shipping/tier-price parity, custom uploads, WooCommerce orders/emails, and monitored webhooks. Add unusual gateways, subscriptions, account credit, quotes, or ERP integrations only after that baseline is live and stable.
