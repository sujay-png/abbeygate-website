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
    const computed = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computed));
  } catch (err) {
    return false;
  }
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-wc-webhook-signature');
    const topic = req.headers.get('x-wc-webhook-topic') || '';
    const secret = process.env.WOOCOMMERCE_WEBHOOK_SECRET || process.env.WP_HEADLESS_SECRET || '';

    // Verify secret if configured
    const querySecret = req.nextUrl.searchParams.get('secret');
    const headerSecret = req.headers.get('x-headless-secret');

    const isSignatureValid = secret && signature ? verifySignature(rawBody, signature, secret) : false;
    const isTokenValid = (querySecret && querySecret === secret) || (headerSecret && headerSecret === secret);

    // If a secret is configured in .env, enforce validation
    if (secret && !isSignatureValid && !isTokenValid) {
      console.warn('Unauthorized WooCommerce webhook attempt rejected.');
      return NextResponse.json({ error: 'Invalid webhook signature or secret' }, { status: 401 });
    }

    let payload: any = {};
    if (rawBody.trim()) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = {};
      }
    }

    // WooCommerce Webhook Ping Test (sent on initial webhook creation in WordPress admin)
    if (payload.webhook_id && !payload.id && !payload.slug) {
      console.log(`WooCommerce webhook ping test received (Webhook ID: ${payload.webhook_id})`);
      return NextResponse.json({ success: true, message: 'Ping acknowledged' });
    }

    const productId = payload.id;
    const slug = payload.slug;

    console.log(`[Webhook] Invalidation triggered by WooCommerce topic: "${topic}" for product ${productId} (${slug || 'no slug'})`);

    // 1. Invalidate global products tag
    revalidateTag('products', 'max');
    revalidateTag('categories', 'max');

    // 2. Invalidate specific product tags if available
    if (productId) {
      revalidateTag(`product-${productId}`, 'max');
    }

    if (slug) {
      revalidateTag(`product-${slug}`, 'max');
      revalidatePath(`/product/${slug}`);
    }

    // 3. Invalidate key catalog listing pages and sitemap
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
