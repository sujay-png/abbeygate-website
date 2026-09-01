import { NextRequest, NextResponse } from 'next/server';
import { checkoutRateLimit } from '@/lib/rate-limit';

const WOOCOMMERCE_STORE_URL = process.env.WOOCOMMERCE_STORE_URL || 'https://corporate.abbeygate-england.com';

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || '127.0.0.1';
    const { success } = await checkoutRateLimit.limit(ip);
    
    if (!success) {
      return NextResponse.json({ error: 'Too many checkout attempts, please try again later.' }, { status: 429 });
    }

    const formData = await request.formData();
    const cartData = formData.get('cart') as string;
    
    if (!cartData) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
    }
    
    const { items } = JSON.parse(cartData);
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
    }

    // 1. Find existing session cookie
    let sessionCookieName = '';
    let sessionCookieValue = '';
    
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith('wp_woocommerce_session_')) {
        sessionCookieName = cookie.name;
        sessionCookieValue = cookie.value;
        break;
      }
    }

    // 2. Clear existing WooCommerce cart (if session exists)
    if (sessionCookieName && sessionCookieValue) {
      const cookieStr = `${sessionCookieName}=${sessionCookieValue}`;
      
      const cartRes = await fetch(`${WOOCOMMERCE_STORE_URL}/wp-json/wc/store/v1/cart`, {
        method: 'GET',
        headers: {
          'Cookie': cookieStr,
        }
      });
      
      if (cartRes.ok) {
        const nonce = cartRes.headers.get('nonce');
        const cartData = await cartRes.json();
        
        if (nonce && cartData.items && cartData.items.length > 0) {
          // Delete each item sequentially
          for (const wcItem of cartData.items) {
            await fetch(`${WOOCOMMERCE_STORE_URL}/wp-json/wc/store/v1/cart/items/${wcItem.key}`, {
              method: 'DELETE',
              headers: {
                'Cookie': cookieStr,
                'Nonce': nonce,
              }
            });
          }
        }
      }
    }

    // 3. Add Next.js cart items sequentially
    let finalSessionCookieStr = sessionCookieName ? `${sessionCookieName}=${sessionCookieValue}` : '';
    
    // Accumulate all cookies received from WooCommerce during the sync
    const accumulatedCookies = new Map<string, string>();

    for (let index = 0; index < items.length; index++) {
      const item = items[index];
      
      const payload = new FormData();
      payload.append('product_id', item.productId);
      if (item.variationId) {
        payload.append('variation_id', item.variationId);
      }
      payload.append('quantity', item.quantity.toString());

      if (item.customization) {
        payload.append('custom_logo_blocking', '1');
        payload.append('custom_logo_blocking_type', item.customization.blockingType);
        payload.append('abbey_logo_position', item.customization.position);
        
        if (item.customization.foilColor) {
           payload.append('custom_foil_colour', item.customization.foilColor);
        }
        
        if (item.customization.cornerEdges && item.customization.cornerEdges !== 'None') {
           payload.append('custom_corner_edges', item.customization.cornerEdges);
        }

        if (item.customization.hasLogo) {
          const logoFile = formData.get(`logo_${index}`);
          if (logoFile instanceof Blob) {
            payload.append('custom_logo_file', logoFile, (logoFile as any).name || 'logo.png');
          }
        }
        
        if (item.customization.hasPreview) {
          const previewFile = formData.get(`preview_${index}`);
          if (previewFile instanceof Blob) {
            payload.append('abbey_preview_image', previewFile, (previewFile as any).name || 'preview.png');
          }
        }
      }

      const headers: Record<string, string> = {};
      
      if (finalSessionCookieStr) {
        headers['Cookie'] = finalSessionCookieStr;
      }

      const addRes = await fetch(`${WOOCOMMERCE_STORE_URL}/?wc-ajax=add_to_cart`, {
        method: 'POST',
        headers,
        body: payload
      });

      // WooCommerce returns Set-Cookie headers for items_in_cart and cart_hash on EVERY successful add.
      // It only returns wp_woocommerce_session if it's establishing a new session.
      const currentSetCookies = addRes.headers.getSetCookie ? addRes.headers.getSetCookie() : [];
      
      for (const cookie of currentSetCookies) {
        const cookieName = cookie.split('=')[0].trim();
        accumulatedCookies.set(cookieName, cookie);
        
        // If we didn't have a session cookie before, capture the new one so subsequent items in the loop use it
        if (!finalSessionCookieStr && cookieName.startsWith('wp_woocommerce_session_')) {
          const match = cookie.match(/(wp_woocommerce_session_[^=]+)=([^;]+)/);
          if (match) {
            sessionCookieName = match[1];
            sessionCookieValue = match[2];
            finalSessionCookieStr = `${sessionCookieName}=${sessionCookieValue}`;
          }
        }
      }
    }

    // 4. If the user is logged into Next.js, sync their saved addresses to the WooCommerce checkout session
    try {
      const { getSession } = await import('@/features/auth/utils/session');
      const { getAddresses } = await import('@/features/account/services/address');
      const session = await getSession();
      
      if (session) {
        const addresses = await getAddresses();
        if (addresses) {
          // Get a fresh nonce for the cart
          const freshCartRes = await fetch(`${WOOCOMMERCE_STORE_URL}/wp-json/wc/store/v1/cart`, {
            method: 'GET',
            headers: finalSessionCookieStr ? { 'Cookie': finalSessionCookieStr } : {}
          });
          const freshNonce = freshCartRes.headers.get('nonce');
          
          if (freshNonce) {
            await fetch(`${WOOCOMMERCE_STORE_URL}/wp-json/wc/store/v1/cart/update-customer`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Nonce': freshNonce,
                ...(finalSessionCookieStr ? { 'Cookie': finalSessionCookieStr } : {})
              },
              body: JSON.stringify({
                billing_address: addresses.billing,
                shipping_address: addresses.shipping
              })
            });
          }
        }
      }
    } catch (addressSyncError) {
      console.error('Failed to sync addresses to WooCommerce checkout:', addressSyncError);
      // Non-fatal, allow checkout to proceed
    }

    // 5. Return success and forward ALL accumulated cookies to the browser
    const response = NextResponse.json({ success: true });
    
    for (const rawCookie of accumulatedCookies.values()) {
      const parts = rawCookie.split(';');
      const nameValue = parts[0].split('=');
      const name = nameValue[0].trim();
      // WooCommerce sends the cookie value already URL-encoded (e.g. %7C instead of |).
      // Next.js response.cookies.set() automatically URL-encodes values.
      // We must decode it first to prevent double-encoding (e.g. %257C).
      const rawValue = nameValue.slice(1).join('=').trim();
      const value = decodeURIComponent(rawValue);
      
      const options: any = {};
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i].trim();
        if (part.toLowerCase().startsWith('expires=')) options.expires = new Date(part.substring(8));
        if (part.toLowerCase().startsWith('max-age=')) options.maxAge = parseInt(part.substring(8));
        if (part.toLowerCase().startsWith('path=')) options.path = part.substring(5);
        if (part.toLowerCase() === 'secure') options.secure = true;
        if (part.toLowerCase() === 'httponly') options.httpOnly = true;
        if (part.toLowerCase().startsWith('samesite=')) options.sameSite = part.substring(9).toLowerCase();
      }

      // ENFORCE cross-subdomain sharing ONLY if running on the actual production domain.
      // If we are on Vercel preview (e.g. abbeygate-website.vercel.app), forcing domain='.abbeygate-england.com'
      // will cause the browser to reject the cookie completely.
      const origin = request.headers.get('origin') || request.headers.get('host') || '';
      if (origin.includes('abbeygate-england.com')) {
        options.domain = '.abbeygate-england.com';
      }

      // In development, strip domain/secure ONLY if strictly testing on localhost.
      // If testing via a modified hosts file (e.g., local.abbeygate-england.com), we KEEP the domain.
      if (process.env.NODE_ENV === 'development') {
        // We leave it to the user to either test on local.abbeygate-england.com or accept localhost won't handoff.
        // Stripping secure is necessary for local HTTP.
        delete options.secure;
      }

      response.cookies.set(name, value, options);
    }

    return response;

  } catch (error: any) {
    console.error('Checkout API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
