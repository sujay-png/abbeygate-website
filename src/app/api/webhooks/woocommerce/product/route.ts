import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Verify WooCommerce HMAC-SHA256 webhook signature.
 */
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  try {
    const cleanSecret = secret.trim().replace(/^["']|["']$/g, '');
    const computed = crypto
      .createHmac('sha256', cleanSecret)
      .update(payload, 'utf8')
      .digest('base64');

    const sigBuf = Buffer.from(signature.trim());
    const compBuf = Buffer.from(computed);
    if (sigBuf.length !== compBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, compBuf);
  } catch (err) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-wc-webhook-signature');
    const topic = req.headers.get('x-wc-webhook-topic') || '';
    const rawSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || process.env.WP_HEADLESS_SECRET || '';
    const secret = rawSecret.trim().replace(/^["']|["']$/g, '');

    let payload: any = {};
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = {};
      }
    }

    // 1. WooCommerce Webhook Ping Test (sent by WordPress on clicking "Save Webhook")
    const isPing = topic.includes('ping') || (payload.webhook_id !== undefined && !payload.id);
    if (isPing) {
      console.log(`[Webhook] WooCommerce ping test acknowledged (Webhook ID: ${payload.webhook_id || 'unknown'})`);
      return NextResponse.json({ success: true, message: 'Ping acknowledged' });
    }

    // 2. Verify signature or secret token
    const querySecret = (req.nextUrl.searchParams.get('secret') || '').trim();
    const headerSecret = (req.headers.get('x-headless-secret') || '').trim();

    const isSignatureValid = secret && signature ? verifySignature(rawBody, signature, secret) : false;
    const isTokenValid = (querySecret && querySecret === secret) || (headerSecret && headerSecret === secret);

    // Enforce authorization if secret is configured
    if (secret && !isSignatureValid && !isTokenValid) {
      console.warn('Unauthorized WooCommerce webhook attempt rejected.');
      return NextResponse.json({ error: 'Invalid webhook signature or secret' }, { status: 401 });
    }

    const productId = payload.id;
    const slug = payload.slug;

    console.log(`[Webhook] Invalidation triggered by WooCommerce topic: "${topic}" for product ${productId} (${slug || 'no slug'})`);

    // 3. Invalidate global products and categories tag
    revalidateTag('products', 'max');
    revalidateTag('categories', 'max');

    // 4. Invalidate specific product tags if available
    if (productId) {
      revalidateTag(`product-${productId}`, 'max');
    }

    if (slug) {
      revalidateTag(`product-${slug}`, 'max');
      revalidatePath(`/product/${slug}`);
    }

    // 5. Invalidate key catalog listing pages and sitemap
    revalidatePath('/diaries');
    revalidatePath('/notebooks');
    revalidatePath('/custom-gifts');
    revalidatePath('/collection');
    revalidatePath('/');

    return NextResponse.json({
      success: true,
      revalidated: {
        productId,
        slug,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('WooCommerce webhook processing error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
