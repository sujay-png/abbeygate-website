'use client';

import { useEffect, useState } from 'react';

/**
 * Foil blocking and blind debossing stamp a single "ink" shape into the cover.
 * The previews use the logo's alpha channel as that stamp, which breaks for
 * logos whose artwork sits on an opaque white plate (badges, crests, boxed
 * logos): the whole plate is opaque, so the stamp becomes a blank disc/box.
 *
 * This derives the stamp from the artwork itself: near-white, low-saturation
 * "paper" pixels (the plate, white lettering knocked out of a coloured ring)
 * become transparent, everything else stays as ink — mirroring how such
 * artwork is converted to one colour for a foil/deboss die.
 *
 * Logos that are already one-colour (black-on-transparent, white-on-transparent,
 * all-colour with no white) are returned unchanged.
 */

/** Rec. 709 luma. */
const luma = (r: number, g: number, b: number) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function otsu(hist: Float64Array, total: number): number {
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * hist[i];
  let sumB = 0, wB = 0, best = 0, t = 0;
  for (let i = 0; i < 256; i++) {
    wB += hist[i];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += i * hist[i];
    const between = wB * wF * (sumB / wB - (sum - sumB) / wF) ** 2;
    if (between > best) { best = between; t = i; }
  }
  return t;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

/** Paper only ever means near-white: never treat mid/light greys or pastels as paper. */
const MIN_PAPER_LUMA = 200;
const MAX_PAPER_LUMA = 235;
/** Max colourfulness (max−min channel) for a pixel to count as white/grey paper. */
const PAPER_CHROMA = 40;
/** Both paper and ink must be at least this share of the opaque logo. */
const MIN_SHARE = 0.04;

/**
 * Rewrites alpha in-place so only ink remains. Returns false (data untouched)
 * when the logo is already a single-colour stamp.
 */
export function applyStampMask(data: Uint8ClampedArray, width: number, height: number): boolean {
  const n = width * height;
  const hist = new Float64Array(256);
  let opaque = 0;
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    if (data[i + 3] < 128) continue;
    hist[Math.round(luma(data[i], data[i + 1], data[i + 2]))]++;
    opaque++;
  }
  if (opaque === 0) return false;

  const threshold = Math.min(MAX_PAPER_LUMA, Math.max(MIN_PAPER_LUMA, otsu(hist, opaque)));
  const rampLo = threshold - 25;
  const rampHi = threshold + 10;

  // paper weight per pixel: 1 = definitely paper, 0 = definitely ink
  const paperWeight = (i: number) => {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const chroma = Math.max(r, g, b) - Math.min(r, g, b);
    const light = clamp01((luma(r, g, b) - rampLo) / (rampHi - rampLo));
    const neutral = clamp01((PAPER_CHROMA + 20 - chroma) / 20);
    return light * neutral;
  };

  let paper = 0;
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    if (data[i + 3] >= 128 && paperWeight(i) > 0.5) paper++;
  }
  const paperShare = paper / opaque;
  if (paperShare < MIN_SHARE || 1 - paperShare < MIN_SHARE) return false;

  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const a = data[i + 3];
    if (a === 0) continue;
    data[i + 3] = Math.round(a * (1 - paperWeight(i)));
    // colour is irrelevant for a stamp; keep it neutral so canvas tinting is clean
    data[i] = data[i + 1] = data[i + 2] = 0;
  }
  return true;
}

/** Stamp mask for an already-loaded image. Returns the image itself if unchanged. */
export function stampMaskFromImage(img: HTMLImageElement): HTMLImageElement | HTMLCanvasElement {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return img;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return img;
  ctx.drawImage(img, 0, 0);
  let imageData: ImageData;
  try {
    imageData = ctx.getImageData(0, 0, w, h);
  } catch {
    return img; // tainted canvas: fall back to the original alpha
  }
  if (!applyStampMask(imageData.data, w, h)) return img;
  ctx.putImageData(imageData, 0, 0);
  return canvas;
}

const maskUrlCache = new Map<string, Promise<string>>();

/** Data URL of the stamp mask for a logo URL (the original URL if no change is needed). */
export function getStampMaskUrl(logoUrl: string): Promise<string> {
  let pending = maskUrlCache.get(logoUrl);
  if (!pending) {
    pending = new Promise<string>((resolve) => {
      const img = new Image();
      if (!logoUrl.startsWith('data:')) img.crossOrigin = 'anonymous';
      img.onload = () => {
        const mask = stampMaskFromImage(img);
        resolve(mask instanceof HTMLCanvasElement ? mask.toDataURL('image/png') : logoUrl);
      };
      img.onerror = () => resolve(logoUrl);
      img.src = logoUrl;
    });
    maskUrlCache.set(logoUrl, pending);
  }
  return pending;
}

/**
 * React hook: stamp-mask URL for a logo, for use as a CSS mask-image in foil /
 * deboss previews. Returns the original URL until the mask is ready.
 */
export function useStampMaskUrl(logoUrl: string | undefined | null): string | undefined {
  const [resolved, setResolved] = useState<{ src: string; mask: string } | null>(null);
  useEffect(() => {
    if (!logoUrl) return;
    let cancelled = false;
    getStampMaskUrl(logoUrl).then((mask) => {
      if (!cancelled) setResolved({ src: logoUrl, mask });
    });
    return () => { cancelled = true; };
  }, [logoUrl]);
  if (!logoUrl) return undefined;
  return resolved?.src === logoUrl ? resolved.mask : logoUrl;
}
