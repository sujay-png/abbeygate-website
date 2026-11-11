import { NextResponse } from 'next/server';
import sharp from 'sharp';

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

export async function detectProductBoundsFromBuffer(buffer: Buffer): Promise<{ left: number; right: number; top: number; bottom: number; aspectRatio: number } | null> {
  try {
    const img = sharp(buffer);
    const meta = await img.metadata();
    const w = meta.width || 0;
    const h = meta.height || 0;
    if (!w || !h) return null;

    const aspectRatio = w / h;

    // Scale to a normalized size (max 800px) for ultra-fast, robust detection
    const maxDim = 800;
    const scale = Math.min(1, maxDim / Math.max(w, h));
    const procW = Math.round(w * scale);
    const procH = Math.round(h * scale);

    const { data, info } = await img
      .resize(procW, procH)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const channels = info.channels;

    // 1. Alpha channel check for transparent PNGs/WebPs
    if (channels === 4) {
      let hasAlpha = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 240) {
          hasAlpha = true;
          break;
        }
      }
      if (hasAlpha) {
        let minX = procW;
        let maxX = 0;
        let minY = procH;
        let maxY = 0;
        for (let y = 0; y < procH; y++) {
          for (let x = 0; x < procW; x++) {
            if (data[(y * procW + x) * 4 + 3] > 240) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        return {
          left: Number(((minX / procW) * 100).toFixed(1)),
          right: Number(((maxX / procW) * 100).toFixed(1)),
          top: Number(((minY / procH) * 100).toFixed(1)),
          bottom: Number(((maxY / procH) * 100).toFixed(1)),
          aspectRatio,
        };
      }
    }

    // 2. Solid studio background detection: sample corners
    const sampleBlock = (x0: number, y0: number) => {
      let r = 0;
      let g = 0;
      let b = 0;
      let count = 0;
      for (let dy = 0; dy < 8; dy++) {
        for (let dx = 0; dx < 8; dx++) {
          const idx = ((y0 + dy) * procW + (x0 + dx)) * channels;
          r += data[idx];
          g += data[idx + 1];
          b += data[idx + 2];
          count++;
        }
      }
      return [r / count, g / count, b / count];
    };

    const corners = [
      sampleBlock(2, 2),
      sampleBlock(procW - 10, 2),
      sampleBlock(2, procH - 10),
      sampleBlock(procW - 10, procH - 10),
    ];
    const bgR = corners.map((c) => c[0]).sort((a, b) => a - b)[1];
    const bgG = corners.map((c) => c[1]).sort((a, b) => a - b)[2];
    const bgB = corners.map((c) => c[2]).sort((a, b) => a - b)[1];

    // Identify foreground pixels differing from studio background
    const isDiff = new Uint8Array(procW * procH);
    const diffThresh = 28;
    for (let y = 0; y < procH; y++) {
      for (let x = 0; x < procW; x++) {
        const idx = (y * procW + x) * channels;
        const d = Math.abs(data[idx] - bgR) + Math.abs(data[idx + 1] - bgG) + Math.abs(data[idx + 2] - bgB);
        if (d > diffThresh) isDiff[y * procW + x] = 1;
      }
    }

    const rowOcc = new Int32Array(procH);
    const colOcc = new Int32Array(procW);
    for (let y = 0; y < procH; y++) {
      for (let x = 0; x < procW; x++) {
        if (isDiff[y * procW + x]) {
          rowOcc[y]++;
          colOcc[x]++;
        }
      }
    }

    const minRowPx = Math.max(10, Math.floor(procW * 0.05));
    const minColPx = Math.max(10, Math.floor(procH * 0.05));

    let occTop = 1;
    while (occTop < procH - 2 && !(rowOcc[occTop] >= minRowPx && rowOcc[occTop + 1] >= minRowPx)) occTop++;

    let occBottom = procH - 2;
    while (occBottom > 1 && !(rowOcc[occBottom] >= minRowPx && rowOcc[occBottom - 1] >= minRowPx)) occBottom--;

    let occLeft = 1;
    while (occLeft < procW - 2 && !(colOcc[occLeft] >= minColPx && colOcc[occLeft + 1] >= minColPx)) occLeft++;

    let occRight = procW - 2;
    while (occRight > 1 && !(colOcc[occRight] >= minColPx && colOcc[occRight - 1] >= minColPx)) occRight--;

    // Gradient calculation for snapping past drop shadow onto true leather edge
    const sumX = new Float64Array(procW);
    const sumY = new Float64Array(procH);

    for (let y = 1; y < procH; y++) {
      for (let x = 1; x < procW; x++) {
        const i = (y * procW + x) * channels;
        const iLeft = (y * procW + (x - 1)) * channels;
        const iUp = ((y - 1) * procW + x) * channels;

        const bCenter = (data[i] + data[i + 1] + data[i + 2]) / 3;
        const bLeft = (data[iLeft] + data[iLeft + 1] + data[iLeft + 2]) / 3;
        const bUp = (data[iUp] + data[iUp + 1] + data[iUp + 2]) / 3;

        sumX[x] += Math.abs(bCenter - bLeft);
        sumY[y] += Math.abs(bCenter - bUp);
      }
    }

    let avgGradY = 0;
    for (let y = 0; y < procH; y++) avgGradY += sumY[y];
    avgGradY /= procH;

    let avgGradX = 0;
    for (let x = 0; x < procW; x++) avgGradX += sumX[x];
    avgGradX /= procW;

    const snapInward = (arr: Float64Array, start: number, inwardDelta: number, step: 1 | -1, threshold: number) => {
      const end = start + step * inwardDelta;
      const peaks: Array<{ idx: number; val: number }> = [];
      let inPeak = false;
      let curPeakIdx = start;
      let curPeakVal = 0;

      for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
        const val = arr[i];
        if (val > threshold) {
          if (!inPeak) {
            inPeak = true;
            curPeakIdx = i;
            curPeakVal = val;
          } else if (val > curPeakVal) {
            curPeakVal = val;
            curPeakIdx = i;
          }
        } else if (inPeak) {
          peaks.push({ idx: curPeakIdx, val: curPeakVal });
          inPeak = false;
        }
      }
      if (inPeak) peaks.push({ idx: curPeakIdx, val: curPeakVal });
      if (peaks.length === 0) return start;
      let dominant = peaks[0];
      for (const p of peaks) {
        if (p.val > dominant.val) dominant = p;
      }
      return dominant.idx;
    };

    const snapWindowY = Math.max(15, Math.floor(procH * 0.10));
    const snapWindowX = Math.max(15, Math.floor(procW * 0.10));
    const threshY = Math.max(avgGradY * 1.2, 1000);
    const threshX = Math.max(avgGradX * 1.2, 1000);

    const snappedTop = snapInward(sumY, occTop, snapWindowY, 1, threshY);
    const snappedBottom = snapInward(sumY, occBottom, snapWindowY, -1, threshY);
    const snappedLeft = snapInward(sumX, occLeft, snapWindowX, 1, threshX);
    const snappedRight = snapInward(sumX, occRight, snapWindowX, -1, threshX);

    return {
      left: Number(((snappedLeft / procW) * 100).toFixed(1)),
      right: Number(((snappedRight / procW) * 100).toFixed(1)),
      top: Number(((snappedTop / procH) * 100).toFixed(1)),
      bottom: Number(((snappedBottom / procH) * 100).toFixed(1)),
      aspectRatio,
    };
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
