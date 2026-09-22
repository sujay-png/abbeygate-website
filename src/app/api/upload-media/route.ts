import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/features/auth/utils/session';
import { getWooStoreUrl } from '@/lib/woocommerce/config';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const storeUrl = getWooStoreUrl();
    const username = process.env.WP_APPLICATION_USERNAME;
    const password = process.env.WP_APPLICATION_PASSWORD;

    if (!username || !password) {
      return NextResponse.json({ error: 'Server misconfiguration: missing App Password' }, { status: 500 });
    }

    const authHeader = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileName = (file as any).name || 'uploaded-logo.png';

    const wpRes = await fetch(`${storeUrl}/wp-json/wp/v2/media`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': file.type || 'image/png',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: buffer
    });

    if (!wpRes.ok) {
      const errorText = await wpRes.text();
      console.error('WordPress Media Upload Error:', wpRes.status, errorText);
      return NextResponse.json({ error: 'Failed to upload to WordPress', details: errorText }, { status: wpRes.status });
    }

    const data = await wpRes.json();
    return NextResponse.json({
      id: data.id,
      url: data.source_url
    });

  } catch (error: any) {
    console.error('Media upload API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
