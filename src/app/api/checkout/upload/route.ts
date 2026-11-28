import { NextRequest, NextResponse } from 'next/server';
import { getWooStoreUrl } from '@/lib/woocommerce/config';
import { checkoutRateLimit } from '@/lib/rate-limit';

// This route uploads into the WordPress media library with admin credentials, so only accept
// the artwork files checkout actually sends: logo_<n> / preview_<n> images of a sane size.
const ALLOWED_FIELD = /^(logo|preview)_\d{1,3}$/;
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 40;

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};

function sanitizeUploadFilename(rawName: string, mimeType: string): string {
  const safeExt = MIME_EXTENSION_MAP[mimeType] || 'png';
  const baseName = rawName
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9\-_]/g, '_')
    .slice(0, 80) || 'artwork';
  return `${baseName}.${safeExt}`;
}

function hasValidRasterSignature(buffer: Buffer, mimeType: string): boolean {
  if (buffer.length < 12) return false;
  if (mimeType === 'image/png') {
    return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  }
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  if (mimeType === 'image/webp') {
    return (
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    );
  }
  return false;
}

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
    const bufferedEntries: Array<{ key: string; buffer: Buffer; fileName: string; mimeType: string }> = [];
    for (const [key, value] of entries) {
      if (
        !ALLOWED_FIELD.test(key) ||
        !(value instanceof Blob) ||
        !ALLOWED_MIME_TYPES.has(value.type.toLowerCase()) ||
        value.size > MAX_FILE_BYTES
      ) {
        return NextResponse.json({ error: 'Unsupported file' }, { status: 400 });
      }
      const buffer = Buffer.from(await value.arrayBuffer());
      const mimeType = value.type.toLowerCase() === 'image/jpg' ? 'image/jpeg' : value.type.toLowerCase();
      if (!hasValidRasterSignature(buffer, mimeType)) {
        return NextResponse.json({ error: 'Invalid image file signature' }, { status: 400 });
      }
      bufferedEntries.push({
        key,
        buffer,
        fileName: sanitizeUploadFilename(value.name || 'artwork', mimeType),
        mimeType,
      });
    }

    const uploadedEntries = await Promise.all(
      bufferedEntries.map(async ({ key, buffer, fileName, mimeType }) => {
        const wpRes = await fetch(`${storeUrl}/wp-json/wp/v2/media`, {
          method: 'POST',
          headers: {
            'Authorization': authHeader,
            'Content-Type': mimeType,
            'Content-Disposition': `attachment; filename="${fileName}"`
          },
          body: new Uint8Array(buffer)
        });

        if (!wpRes.ok) {
          const wpErr = await wpRes.text();
          console.error(`Failed to upload ${fileName} to WordPress:`, wpErr);
          throw new Error('WordPress media upload failed');
        }

        const wpData = await wpRes.json();
        return [key, wpData.source_url as string] as const;
      })
    );

    Object.assign(files, Object.fromEntries(uploadedEntries));

    return NextResponse.json({ success: true, files });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
  }
}
