import { describe, it, expect } from 'vitest';
import { applyStampMask } from './logo-stamp-mask';

type RGBA = [number, number, number, number];
const W = 100, H = 100;

function make(paint: (x: number, y: number) => RGBA) {
  const data = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) data.set(paint(x, y), (y * W + x) * 4);
  return data;
}
const alphaAt = (d: Uint8ClampedArray, x: number, y: number) => d[(y * W + x) * 4 + 3];
const r = (x: number, y: number) => Math.hypot(x - 50, y - 50);

const CLEAR: RGBA = [0, 0, 0, 0];
const WHITE: RGBA = [250, 250, 250, 255];
const GREEN: RGBA = [20, 70, 40, 255];

describe('applyStampMask', () => {
  it('turns a badge on a white disc into ink only (disc + white lettering removed)', () => {
    // transparent outside, dark green ring (r 38–48) with white "text" in it, white disc inside with a green emblem
    const d = make((x, y) => {
      const rr = r(x, y);
      if (rr > 48) return CLEAR;
      if (rr > 38) return x > 45 && x < 55 && y < 20 ? WHITE : GREEN; // white lettering knocked out of ring
      if (Math.abs(x - 50) < 4 && rr < 25) return GREEN; // emblem
      return WHITE; // plate
    });
    expect(applyStampMask(d, W, H)).toBe(true);
    expect(alphaAt(d, 50, 60)).toBeGreaterThan(250); // emblem stays
    expect(alphaAt(d, 50, 93)).toBeGreaterThan(250); // ring stays
    expect(alphaAt(d, 30, 50)).toBe(0); // plate removed
    expect(alphaAt(d, 50, 6)).toBe(0); // white lettering knocked out
  });

  it('leaves single-colour logos untouched', () => {
    for (const ink of [[0, 0, 0, 255], [255, 255, 255, 255], [200, 30, 40, 255]] as RGBA[]) {
      const d = make((x, y) => (r(x, y) < 30 ? ink : CLEAR));
      const copy = d.slice();
      expect(applyStampMask(d, W, H)).toBe(false);
      expect(d).toEqual(copy);
    }
  });

  it('keeps every colour of a multi-colour logo with no white plate', () => {
    const d = make((x, y) => (r(x, y) >= 30 ? CLEAR : x < 50 ? [230, 190, 20, 255] : [10, 10, 10, 255])); // yellow + black
    expect(applyStampMask(d, W, H)).toBe(false);
  });

  it('does not treat light-grey artwork as paper', () => {
    const d = make((x, y) => (r(x, y) >= 30 ? CLEAR : x < 50 ? [185, 185, 185, 255] : [0, 0, 0, 255]));
    expect(applyStampMask(d, W, H)).toBe(false);
  });
});
