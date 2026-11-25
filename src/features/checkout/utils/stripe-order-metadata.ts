import type { CheckoutQuoteLine } from '../types/quote';

const MAX_STRIPE_DESCRIPTION_LENGTH = 200;
const MAX_STRIPE_METADATA_LENGTH = 500;

function truncateWithEllipsis(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 3).trimEnd()}...`;
}

/**
 * Formats checkout line items into a compact human-readable string safe for Stripe metadata limits.
 */
export function buildStripeItemsSummary(lines: CheckoutQuoteLine[]): string {
  if (!Array.isArray(lines) || lines.length === 0) return '';
  const summary = lines
    .map((line) => `${line.quantity}x ${line.name}`.trim())
    .filter(Boolean)
    .join(', ');
  return truncateWithEllipsis(summary, MAX_STRIPE_METADATA_LENGTH);
}

/**
 * Builds initial Stripe description and metadata before the WooCommerce order ID exists.
 */
export function buildStripePrePaymentInfo(sessionId: string, lines: CheckoutQuoteLine[]) {
  const itemsSummary = buildStripeItemsSummary(lines);
  const description = itemsSummary
    ? truncateWithEllipsis(`Abbeygate Checkout - ${itemsSummary}`, MAX_STRIPE_DESCRIPTION_LENGTH)
    : `Abbeygate Checkout (${sessionId.slice(0, 8)})`;

  const metadata: Record<string, string> = {
    checkoutSessionId: sessionId,
    ...(itemsSummary ? { items: itemsSummary } : {}),
  };

  return { description, metadata };
}

export type StripeOrderInfoParams = {
  sessionId: string;
  orderId: number | string;
  orderNumber?: string | number | null;
  customerName?: string;
  customerEmail?: string;
  lines: CheckoutQuoteLine[];
};

/**
 * Builds Stripe PaymentIntent and Charge fields so WooCommerce order numbers appear
 * directly in Stripe Dashboard tables, details, and exports.
 */
export function buildStripeOrderInfo({
  sessionId,
  orderId,
  orderNumber,
  customerName,
  customerEmail,
  lines,
}: StripeOrderInfoParams) {
  const resolvedOrderNumber = String(orderNumber || orderId).trim();
  const cleanName = (customerName || '').replace(/\s+/g, ' ').trim();
  const cleanEmail = (customerEmail || '').trim();
  const customerLabel = cleanName || cleanEmail;
  const itemsSummary = buildStripeItemsSummary(lines);

  const description = truncateWithEllipsis(
    customerLabel ? `Order #${resolvedOrderNumber} - ${customerLabel}` : `Order #${resolvedOrderNumber}`,
    MAX_STRIPE_DESCRIPTION_LENGTH,
  );

  const metadata: Record<string, string> = {
    checkoutSessionId: sessionId,
    order_id: String(orderId),
    order_number: resolvedOrderNumber,
    ...(cleanName ? { customer_name: truncateWithEllipsis(cleanName, MAX_STRIPE_METADATA_LENGTH) } : {}),
    ...(cleanEmail ? { customer_email: truncateWithEllipsis(cleanEmail, MAX_STRIPE_METADATA_LENGTH) } : {}),
    ...(itemsSummary ? { items: itemsSummary } : {}),
  };

  return { description, metadata };
}
