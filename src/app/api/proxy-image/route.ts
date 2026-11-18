import { NextResponse } from 'next/server';
import sharp from 'sharp';
import { detectProductBounds, type DetectedProductBounds } from '@/features/products/utils/detect-product-bounds';

const ALLOWED_DOMAINS = [
  // Loopback targets are only useful in local development; in production they would let
  // callers make the server request its own internal endpoints (SSRF).
  ...(process.env.NODE_ENV === 'production' ? [] : ['localhost', '127.0.0.1']),
  'abbeygate-website.vercel.app',
  'dashboard.abbeygate-business.com',
  'abbeygate-business.com',
  'dashboard.abbeygate-england.com',
  'abbeygate-england.com'
];

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

/** Working resolution for detection: enough for sub-0.1% precision, still fast. */
const DETECT_MAX_DIM = 800;

export async function detectProductBoundsFromBuffer(buffer: Buffer): Promise<(DetectedProductBounds & { aspectRatio: number }) | null> {
  try {
    const img = sharp(buffer).rotate(); // honour EXIF orientation
    const meta = await img.metadata();
    const oriented = (meta.orientation ?? 1) >= 5;
    const w = (oriented ? meta.height : meta.width) || 0;
    const h = (oriented ? meta.width : meta.height) || 0;
    if (!w || !h) return null;

    const scale = Math.min(1, DETECT_MAX_DIM / Math.max(w, h));
    const { data, info } = await img
      .resize(Math.round(w * scale), Math.round(h * scale))
      .raw()
      .toBuffer({ resolveWithObject: true });

    const bounds = detectProductBounds(data, info.width, info.height, info.channels);
    return bounds ? { ...bounds, aspectRatio: w / h } : null;
  } catch (e) {
    console.error('Error detecting product bounds on server:', e);
    return null;
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  try {
    let finalUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      // In Vercel, x-forwarded-host can be used, but NEXT_PUBLIC_SITE_URL is safer
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      finalUrl = `${baseUrl}${imageUrl}`;
    }

    // SSRF Protection: Parse and validate the hostname
    const targetUrl = new URL(finalUrl);
    const hostname = targetUrl.hostname;
    
    const isAllowed = ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );

    if (!isAllowed) {
      console.warn(`[Security] Blocked attempt to proxy unauthorized domain: ${hostname}`);
      return NextResponse.json({ error: 'Forbidden image source' }, { status: 403 });
    }

    let response;
    let retries = 1;
    while (retries >= 0) {
      try {
        response = await fetch(finalUrl, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
            Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          },
        });
        break; // success
      } catch (err: any) {
        if (retries === 0) throw err;
        console.warn(`Proxy fetch failed, retrying... (${err.message})`);
        retries--;
        await new Promise(res => setTimeout(res, 500)); // wait 500ms before retry
      }
    }

    if (!response) {
      throw new Error('Proxy fetch failed unexpectedly');
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 415 });
    }
    if (Number(response.headers.get('content-length') || 0) > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: 'Image too large' }, { status: 413 });
    }
    const buffer = await response.arrayBuffer();
    const nodeBuf = Buffer.from(buffer);
    const base64 = nodeBuf.toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    // Dynamic server-side product bounds and aspect ratio detection using Sharp
    const boundsInfo = await detectProductBoundsFromBuffer(nodeBuf);
    const bounds = boundsInfo
      ? {
          left: boundsInfo.left,
          right: boundsInfo.right,
          top: boundsInfo.top,
          bottom: boundsInfo.bottom,
          corners: boundsInfo.corners,
        }
      : null;
    const aspectRatio = boundsInfo ? boundsInfo.aspectRatio : null;

    return NextResponse.json(
      { dataUrl, bounds, aspectRatio },
      {
        headers: {
          'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
        },
      }
    );
  } catch (error: any) {
    console.error('Proxy image error:', error);
    return NextResponse.json({ error: 'Failed to load image' }, { status: 500 });
  }
}
