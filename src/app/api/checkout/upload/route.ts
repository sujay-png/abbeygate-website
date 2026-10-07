import { NextRequest, NextResponse } from 'next/server';
import { getWooStoreUrl } from '@/lib/woocommerce/config';
import { checkoutRateLimit } from '@/lib/rate-limit';

// This route uploads into the WordPress media library with admin credentials, so only accept
// the artwork files checkout actually sends: logo_<n> / preview_<n> images of a sane size.
const ALLOWED_FIELD = /^(logo|preview)_\d{1,3}$/;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 40;

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
    const { success } = await checkoutRateLimit.limit(`upload:${ip}`);
    if (!success) {
      return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
    }

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

    const entries = [...formData.entries()];
    if (entries.length > MAX_FILES) {
      return NextResponse.json({ error: 'Too many files' }, { status: 400 });
    }
    for (const [key, value] of entries) {
      if (
        !ALLOWED_FIELD.test(key) ||
        !(value instanceof Blob) ||
        !value.type.startsWith('image/') ||
        value.size > MAX_FILE_BYTES
      ) {
        return NextResponse.json({ error: 'Unsupported file' }, { status: 400 });
      }
    }

    for (const [key, value] of entries) {
      if (value instanceof Blob) {
        const buffer = Buffer.from(await value.arrayBuffer());
        const fileName = value.name.replace(/[^a-zA-Z0-9.\-_]/g, '_'); // Sanitize filename
        const mimeType = value.type;

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
