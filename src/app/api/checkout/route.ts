import { NextRequest, NextResponse } from 'next/server';

const WOOCOMMERCE_STORE_URL = process.env.WOOCOMMERCE_STORE_URL || 'https://corporate.abbeygate-england.com';

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json();
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'No items provided' }, { status: 400 });
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

    for (const item of items) {
      const formData = new URLSearchParams();
      formData.append('product_id', item.productId);
      formData.append('quantity', item.quantity.toString());

      const headers: Record<string, string> = {
        'Content-Type': 'application/x-www-form-urlencoded',
      };
      
      if (finalSessionCookieStr) {
        headers['Cookie'] = finalSessionCookieStr;
      }

      const addRes = await fetch(`${WOOCOMMERCE_STORE_URL}/?wc-ajax=add_to_cart`, {
        method: 'POST',
        headers,
        body: formData.toString()
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

    // 4. Return success and forward ALL accumulated cookies to the browser
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

      // ENFORCE cross-subdomain sharing. 
      // WooCommerce natively omits the Domain attribute, locking the cookie to a single exact subdomain.
      // We must explicitly set it to the root domain so it works across Next.js and corporate.*
      options.domain = '.abbeygate-england.com';

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
