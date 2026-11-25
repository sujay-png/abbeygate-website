import crypto from 'crypto';

export function getHeadlessStoreUrl(): string {
  return (
    process.env.WOOCOMMERCE_STORE_URL ||
    process.env.NEXT_PUBLIC_WOOCOMMERCE_STORE_URL ||
    'https://dashboard.abbeygate-business.com'
  ).replace(/\/$/, '');
}

export function getRequiredHeadlessSecret(): string {
  const secret = process.env.WP_HEADLESS_SECRET;
  if (!secret) {
    throw new Error('WP_HEADLESS_SECRET is not configured.');
  }
  return secret;
}

function getTicketSigningSecret(): string {
  return process.env.SESSION_SECRET || getRequiredHeadlessSecret();
}

export function signTicketToken(ticketId: number | string): string {
  return crypto
    .createHmac('sha256', getTicketSigningSecret())
    .update(`chat-ticket:${String(ticketId)}`)
    .digest('hex');
}

export function verifyTicketToken(ticketId: number | string, token: string | null | undefined): boolean {
  if (!token || typeof token !== 'string') return false;
  try {
    const expected = signTicketToken(ticketId);
    const expectedBuf = Buffer.from(expected, 'utf8');
    const actualBuf = Buffer.from(token.trim(), 'utf8');
    if (expectedBuf.length !== actualBuf.length) return false;
    return crypto.timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}
