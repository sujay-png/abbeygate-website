import { NextRequest, NextResponse } from 'next/server';
import { getWooStoreUrl } from '@/lib/woocommerce/config';

export async function POST(req: NextRequest) {
  try {
    const wpUser = process.env.WP_ADMIN_USERNAME || process.env.WP_APPLICATION_USERNAME;
    const wpAppPass = process.env.WP_APPLICATION_PASSWORD;

    if (!wpUser || !wpAppPass) {
      console.error('Missing WP_ADMIN_USERNAME or WP_APPLICATION_PASSWORD');
      return NextResponse.json({ error: 'Uploads are not configured for production yet' }, { status: 500 });
    }

    const storeUrl = getWooStoreUrl();
    const authHeader = `Basic ${Buffer.from(`${wpUser}:${wpAppPass}`).toString('base64')}`;
    
    const formData = await req.formData();
    const files: { [key: string]: string } = {};

    for (const [key, value] of formData.entries()) {
      if (value instanceof Blob) {
        const buffer = Buffer.from(await value.arrayBuffer());
        const fileName = value.name.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // Sanitize filename
        const mimeType = value.type || 'image/png';

        const wpRes = await fetch(`${storeUrl}/wp-json/wp/v2/media`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${fileName}"`
          },
          body: buffer
        });

        if (!wpRes.ok) {
          const wpErr = await wpRes.text();
          console.error(`Failed to upload ${fileName} to WordPress:`, wpErr);
          throw new Error('WordPress media upload failed');
        }

        const wpData = await wpRes.json();
        files[key] = wpData.source_url; // WordPress returns the full absolute URL here
      }
    }

    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
