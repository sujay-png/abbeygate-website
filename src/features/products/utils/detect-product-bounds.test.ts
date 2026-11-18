import { describe, it, expect } from 'vitest';
import { detectProductBounds } from './detect-product-bounds';

type RGB = [number, number, number];

/**
 * Synthetic product shot: a cover from (x0,y0) to (x1,y1) (pixel-edge coords)
 * on a background, with optional soft drop shadow, flared corners, pen loop
 * and a darker band just inside the right edge.
 */
function render(opts: {
  w?: number; h?: number;
  x0: number; y0: number; x1: number; y1: number;
  cover: RGB; bg?: RGB;
  shadow?: number;      // px of soft shadow below/right
  flare?: number;       // px the right edge bulges out at top/bottom corners
  penLoop?: boolean;
  band?: RGB;           // elastic band colour inside right edge
  radius?: number;      // corner rounding
}) {
  const w = opts.w ?? 400, h = opts.h ?? 400;
  const bg = opts.bg ?? [255, 255, 255];
  const data = new Uint8ClampedArray(w * h * 3);
  const flare = opts.flare ?? 0;
  const r = opts.radius ?? 0;
  const rightAt = (y: number) => {
    const t = (y - opts.y0) / (opts.y1 - opts.y0); // 0..1
    const d = Math.min(t, 1 - t); // 0 at corners, .5 mid
    return opts.x1 + flare * Math.max(0, 1 - d / 0.2);
  };
  const inside = (x: number, y: number) => {
    const cx = x + 0.5, cy = y + 0.5;
    const right = rightAt(cy);
    if (cx < opts.x0 || cx > right || cy < opts.y0 || cy > opts.y1) return false;
    if (r > 0) {
      const kx = cx < opts.x0 + r ? opts.x0 + r : cx > right - r ? right - r : cx;
      const ky = cy < opts.y0 + r ? opts.y0 + r : cy > opts.y1 - r ? opts.y1 - r : cy;
      if ((cx - kx) ** 2 + (cy - ky) ** 2 > r * r) return false;
    }
    return true;
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let c: RGB = bg;
      if (inside(x, y)) {
        c = opts.band && x + 0.5 > rightAt(y + 0.5) - 14 && x + 0.5 < rightAt(y + 0.5) - 8 ? opts.band : opts.cover;
      } else if (opts.penLoop && y > 180 && y < 220 && x + 0.5 > opts.x1 && x + 0.5 < opts.x1 + 12) {
        c = opts.cover;
      } else if (opts.shadow) {
        // soft shadow offset down-right
        const dx = Math.max(0, x + 0.5 - rightAt(y + 0.5));
        const dy = Math.max(0, y + 0.5 - opts.y1);
        const inX = x + 0.5 > opts.x0 + 4 && x + 0.5 < rightAt(y + 0.5) + opts.shadow;
        const inY = y + 0.5 > opts.y0 + 4 && y + 0.5 < opts.y1 + opts.shadow;
        if (inX && inY) {
          const d = Math.max(dx, dy) / opts.shadow;
          const k = 0.55 + 0.45 * d; // darkest next to the cover, smooth ramp out
          c = [bg[0] * k, bg[1] * k, bg[2] * k];
        }
      }
      const i = (y * w + x) * 3;
      data[i] = c[0]; data[i + 1] = c[1]; data[i + 2] = c[2];
    }
  }
  return { data, w, h };
}

const pct = (px: number, size = 400) => (px / size) * 100;

describe('detectProductBounds', () => {
  it('finds exact corners of a plain cover', () => {
    const { data, w, h } = render({ x0: 100, y0: 60, x1: 300, y1: 340, cover: [120, 40, 160] });
    const b = detectProductBounds(data, w, h, 3)!;
    expect(b.corners.topRight.x).toBeCloseTo(pct(300), 0);
    expect(b.corners.topRight.y).toBeCloseTo(pct(60), 0);
    expect(b.corners.bottomRight.y).toBeCloseTo(pct(340), 0);
    expect(b.left).toBeCloseTo(pct(100), 0);
  });

  it('ignores a dark, tight drop shadow', () => {
    const { data, w, h } = render({ x0: 100, y0: 60, x1: 300, y1: 340, cover: [230, 105, 38], shadow: 8 });
    const b = detectProductBounds(data, w, h, 3)!;
    expect(Math.abs(b.corners.bottomRight.y - pct(340))).toBeLessThan(0.4);
    expect(Math.abs(b.corners.bottomRight.x - pct(300))).toBeLessThan(0.4);
  });

  it('places corners on flared corners rather than the mid-edge line', () => {
    const { data, w, h } = render({ x0: 100, y0: 60, x1: 300, y1: 340, cover: [0, 70, 100], flare: 4 });
    const b = detectProductBounds(data, w, h, 3)!;
    expect(Math.abs(b.corners.topRight.x - pct(304))).toBeLessThan(0.5);
    expect(Math.abs(b.corners.bottomRight.x - pct(304))).toBeLessThan(0.5);
  });

  it('is not pulled by pen loops, elastic bands or rounded corners', () => {
    const { data, w, h } = render({
      x0: 100, y0: 60, x1: 300, y1: 340, cover: [90, 160, 225], band: [30, 60, 140], penLoop: true, radius: 10,
    });
    const b = detectProductBounds(data, w, h, 3)!;
    expect(Math.abs(b.corners.topRight.x - pct(300))).toBeLessThan(0.5);
    expect(Math.abs(b.corners.topRight.y - pct(60))).toBeLessThan(0.5);
    expect(Math.abs(b.corners.bottomRight.y - pct(340))).toBeLessThan(0.5);
  });

  it('handles light covers on a light background', () => {
    const { data, w, h } = render({ x0: 100, y0: 60, x1: 300, y1: 340, cover: [225, 215, 200], shadow: 10 });
    const b = detectProductBounds(data, w, h, 3)!;
    expect(Math.abs(b.corners.topRight.x - pct(300))).toBeLessThan(0.5);
    expect(Math.abs(b.corners.bottomRight.y - pct(340))).toBeLessThan(0.5);
  });

  it('uses alpha for transparent images', () => {
    const w = 300, h = 300;
    const data = new Uint8ClampedArray(w * h * 4);
    for (let y = 50; y < 250; y++) for (let x = 80; x < 220; x++) {
      const i = (y * w + x) * 4;
      data[i] = 20; data[i + 1] = 20; data[i + 2] = 20; data[i + 3] = 255;
    }
    const b = detectProductBounds(data, w, h, 4)!;
    expect(b.corners.topRight.x).toBeCloseTo(pct(220, 300), 0);
    expect(b.corners.bottomRight.y).toBeCloseTo(pct(250, 300), 0);
  });

  it('returns null for an empty image', () => {
    const data = new Uint8ClampedArray(200 * 200 * 3).fill(255);
    expect(detectProductBounds(data, 200, 200, 3)).toBeNull();
  });
});
