import { NextResponse } from 'next/server';

const ALLOWED_DOMAINS = [
  'localhost',
  '127.0.0.1',
  'abbeygate-website.vercel.app',
  'corporate.abbeygate-england.com',
  'abbeygate-england.com'
];

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

    const response = await fetch(finalUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch (error: any) {
    console.error('Proxy image error:', error);
    return NextResponse.json({ error: error.message || error.toString() }, { status: 500 });
  }
}
