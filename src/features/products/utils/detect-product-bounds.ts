/**
 * Product edge & corner detection for flat-lay product shots.
 *
 * Pure function over raw pixels (no DOM, no sharp) so the exact same algorithm
 * runs on the server (sharp → raw buffer) and in the browser (canvas →
 * ImageData). Nothing here is product-specific.
 *
 * Pipeline
 * 1. Background model  – median colour of a thin border ring (or alpha, for
 *    transparent images).
 * 2. Foreground mask   – distance from background, thresholded with Otsu so it
 *    adapts to light products on light backgrounds as well as dark ones.
 * 3. Rough box         – largest connected foreground component; this ignores
 *    specks, watermarks and stray shadows that are not touching the product.
 * 4. Edge refinement   – for every scanline crossing an edge, search a band
 *    around the rough edge for the colour-gradient step that separates the
 *    product from the background, taking the OUTERMOST strong step (so soft
 *    drop shadows outside the product and bands/elastics just inside it are
 *    both rejected) with parabolic sub-pixel interpolation.
 * 5. Robust line fit   – each edge is a line x = a·y + b (or y = a·x + b) fitted
 *    with iterative outlier rejection (MAD), so pen loops, elastic tabs and
 *    rounded corners don't pull the edge.
 * 6. Corners           – intersections of adjacent edge lines. These are the
 *    "virtual sharp" corners of the cover, which is exactly where a metal
 *    corner protector's outer vertex sits, even on rounded covers.
 */

export type Point = { x: number; y: number };

export type ProductCorners = {
  topLeft: Point;
  topRight: Point;
  bottomRight: Point;
  bottomLeft: Point;
};

export type DetectedProductBounds = {
  /** Percentages (0–100) of image width / height. */
  left: number;
  right: number;
  top: number;
  bottom: number;
  /** Percentages (0–100) of image width (x) / height (y). */
  corners: ProductCorners;
};

type Line = { a: number; b: number }; // secondary = a * primary + b

const round2 = (v: number) => Math.round(v * 100) / 100;

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const s = [...values].sort((p, q) => p - q);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function otsu(hist: Uint32Array, total: number): number {
  let sum = 0;
  for (let i = 0; i < hist.length; i++) sum += i * hist[i];
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 0;
  for (let t = 0; t < hist.length; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

/** Least squares fit secondary = a·primary + b with iterative MAD outlier rejection. */
function robustLineFit(primary: number[], secondary: number[]): Line | null {
  let idx = primary.map((_, i) => i);
  let line: Line | null = null;

  for (let iter = 0; iter < 4; iter++) {
    if (idx.length < 5) return line;
    let sp = 0, ss = 0, spp = 0, sps = 0;
    for (const i of idx) {
      sp += primary[i];
      ss += secondary[i];
      spp += primary[i] * primary[i];
      sps += primary[i] * secondary[i];
    }
    const n = idx.length;
    const denom = n * spp - sp * sp;
    const a = denom === 0 ? 0 : (n * sps - sp * ss) / denom;
    line = { a, b: (ss - a * sp) / n };

    const residuals = idx.map((i) => Math.abs(secondary[i] - (line!.a * primary[i] + line!.b)));
    const mad = median(residuals);
    const limit = Math.max(1, 2.5 * 1.4826 * mad);
    const next = idx.filter((_, k) => residuals[k] <= limit);
    if (next.length === idx.length) break;
    idx = next;
  }
  return line;
}

/**
 * x = a·y + b  intersected with  y = c·x + d.
 */
function intersect(vertical: Line, horizontal: Line): Point {
  const denom = 1 - vertical.a * horizontal.a;
  const y = Math.abs(denom) < 1e-9
    ? horizontal.b
    : (horizontal.a * vertical.b + horizontal.b) / denom;
  return { x: vertical.a * y + vertical.b, y };
}

/**
 * @param data      raw pixels, row-major
 * @param width     image width in px
 * @param height    image height in px
 * @param channels  3 (RGB) or 4 (RGBA)
 */
export function detectProductBounds(
  data: ArrayLike<number>,
  width: number,
  height: number,
  channels: number,
): DetectedProductBounds | null {
  if (width < 16 || height < 16 || (channels !== 3 && channels !== 4)) return null;
  const N = width * height;
  const px = (x: number, y: number) => (y * width + x) * channels;

  // ── 1. Background model ────────────────────────────────────────────────
  const ring = Math.max(2, Math.round(Math.min(width, height) * 0.015));
  const ringR: number[] = [];
  const ringG: number[] = [];
  const ringB: number[] = [];
  const ringA: number[] = [];
  const sampleRing = (x: number, y: number) => {
    const i = px(x, y);
    ringR.push(data[i]);
    ringG.push(data[i + 1]);
    ringB.push(data[i + 2]);
    ringA.push(channels === 4 ? data[i + 3] : 255);
  };
  const step = Math.max(1, Math.floor(Math.min(width, height) / 200));
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      if (x < ring || x >= width - ring || y < ring || y >= height - ring) sampleRing(x, y);
    }
  }

  // Transparent background → alpha is the cleanest signal available.
  const useAlpha = channels === 4 && median(ringA) < 128;
  const bgR = median(ringR);
  const bgG = median(ringG);
  const bgB = median(ringB);

  // Per-pixel signal used for both mask and gradients.
  // Colour mode: RGB (composited over the background if partially transparent).
  // Alpha mode: alpha replicated so the same gradient code applies.
  const R = new Float32Array(N);
  const G = new Float32Array(N);
  const B = new Float32Array(N);
  for (let p = 0, i = 0; p < N; p++, i += channels) {
    if (useAlpha) {
      const a = data[i + 3];
      R[p] = a; G[p] = a; B[p] = a;
    } else if (channels === 4 && data[i + 3] < 255) {
      const a = data[i + 3] / 255;
      R[p] = data[i] * a + bgR * (1 - a);
      G[p] = data[i + 1] * a + bgG * (1 - a);
      B[p] = data[i + 2] * a + bgB * (1 - a);
    } else {
      R[p] = data[i]; G[p] = data[i + 1]; B[p] = data[i + 2];
    }
  }
  const refR = useAlpha ? 0 : bgR;
  const refG = useAlpha ? 0 : bgG;
  const refB = useAlpha ? 0 : bgB;

  // ── 2. Foreground mask via Otsu on distance-from-background ────────────
  const dist = new Uint16Array(N);
  const hist = new Uint32Array(766);
  for (let p = 0; p < N; p++) {
    const d = Math.round(Math.abs(R[p] - refR) + Math.abs(G[p] - refG) + Math.abs(B[p] - refB));
    dist[p] = d;
    hist[d]++;
  }
  // Border noise floor (JPEG artefacts / vignette) sets a lower bound.
  const ringDist = ringR.map((r, k) => Math.abs(r - bgR) + Math.abs(ringG[k] - bgG) + Math.abs(ringB[k] - bgB));
  ringDist.sort((p, q) => p - q);
  const noiseFloor = ringDist[Math.floor(ringDist.length * 0.98)] ?? 0;
  const threshold = Math.max(otsu(hist, N), noiseFloor + 6, useAlpha ? 128 : 18);

  const mask = new Uint8Array(N);
  for (let p = 0; p < N; p++) if (dist[p] > threshold) mask[p] = 1;

  // ── 3. Largest connected component → rough box ────────────────────────
  const label = new Int32Array(N);
  const stack = new Int32Array(N);
  let bestSize = 0;
  let bestLabel = 0;
  let bestBox = { minX: 0, maxX: 0, minY: 0, maxY: 0 };
  let current = 0;
  for (let start = 0; start < N; start++) {
    if (!mask[start] || label[start]) continue;
    current++;
    let sp = 0;
    stack[sp++] = start;
    label[start] = current;
    let size = 0;
    let minX = width, maxX = 0, minY = height, maxY = 0;
    while (sp > 0) {
      const p = stack[--sp];
      size++;
      const x = p % width;
      const y = (p - x) / width;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
      if (x > 0 && mask[p - 1] && !label[p - 1]) { label[p - 1] = current; stack[sp++] = p - 1; }
      if (x < width - 1 && mask[p + 1] && !label[p + 1]) { label[p + 1] = current; stack[sp++] = p + 1; }
      if (y > 0 && mask[p - width] && !label[p - width]) { label[p - width] = current; stack[sp++] = p - width; }
      if (y < height - 1 && mask[p + width] && !label[p + width]) { label[p + width] = current; stack[sp++] = p + width; }
    }
    if (size > bestSize) {
      bestSize = size;
      bestLabel = current;
      bestBox = { minX, maxX, minY, maxY };
    }
  }
  if (bestSize < N * 0.02) return null;

  const boxW = bestBox.maxX - bestBox.minX;
  const boxH = bestBox.maxY - bestBox.minY;
  if (boxW < width * 0.1 || boxH < height * 0.1) return null;

  // ── 4. Sub-pixel edge localisation along scanlines ─────────────────────
  // Colour averaged over 3 px ALONG the edge to suppress grain/JPEG noise.
  const colourAt = (x: number, y: number, horizontalScan: boolean, out: number[]) => {
    let r = 0, g = 0, b = 0;
    for (let k = -1; k <= 1; k++) {
      const xx = horizontalScan ? x : Math.min(width - 1, Math.max(0, x + k));
      const yy = horizontalScan ? Math.min(height - 1, Math.max(0, y + k)) : y;
      const p = yy * width + xx;
      r += R[p]; g += G[p]; b += B[p];
    }
    out[0] = r / 3; out[1] = g / 3; out[2] = b / 3;
  };

  /**
   * Locate the product boundary on one scanline, in pixel-edge coordinates.
   *
   * d1(s) = |I(s+1) − I(s)| is the colour step between neighbouring pixels.
   * A cover edge is a near-instant step; a drop shadow is a soft ramp spread
   * over several pixels. "Sharpness" = d1(s) − mean(d1(s−2), d1(s+2)) is high
   * for steps and low inside ramps, so shadows can't win even when they are
   * dark. Among the sharp steps we take the OUTERMOST one, which rejects
   * elastic bands / stitching / two-tone seams that sit just inside the edge.
   */
  const findEdge = (fixed: number, rough: number, outward: 1 | -1, horizontalScan: boolean): number | null => {
    const limit = horizontalScan ? width : height;
    const span = horizontalScan ? boxW : boxH;
    const win = Math.max(5, Math.round(span * 0.06));
    const from = Math.max(2, rough - win);
    const to = Math.min(limit - 4, rough + win);
    if (to - from < 5) return null;

    const n = to - from + 5; // d1 for s in [from-2, to+2]
    const d1 = new Float32Array(n);
    const a = [0, 0, 0];
    const c = [0, 0, 0];
    for (let k = 0; k < n; k++) {
      const s = from - 2 + k;
      if (horizontalScan) { colourAt(s, fixed, true, a); colourAt(s + 1, fixed, true, c); }
      else { colourAt(fixed, s, false, a); colourAt(fixed, s + 1, false, c); }
      d1[k] = Math.abs(c[0] - a[0]) + Math.abs(c[1] - a[1]) + Math.abs(c[2] - a[2]);
    }
    const len = to - from + 1;
    const sharp = new Float32Array(len);
    let maxSharp = 0;
    for (let k = 0; k < len; k++) {
      const v = d1[k + 2] - 0.5 * (d1[k] + d1[k + 4]);
      sharp[k] = v;
      if (v > maxSharp) maxSharp = v;
    }
    if (maxSharp < 10) return null;

    const strong = maxSharp * 0.5;
    for (let j = 0; j < len; j++) {
      const k = outward > 0 ? len - 1 - j : j;
      if (sharp[k] < strong) continue;
      // climb inward to the local sharpness peak
      let peak = k;
      const inward = -outward;
      while (peak + inward >= 0 && peak + inward < len && sharp[peak + inward] > sharp[peak]) peak += inward;
      // parabolic sub-pixel refinement on the step magnitude
      const g0 = d1[peak + 1], g1 = d1[peak + 2], g2 = d1[peak + 3];
      const denom = g0 - 2 * g1 + g2;
      const offset = denom < 0 ? Math.max(-0.5, Math.min(0.5, (0.5 * (g0 - g2)) / denom)) : 0;
      // step between pixel s and s+1 → boundary at coordinate s+1
      return from + peak + 1 + offset;
    }
    return null;
  };

  /** Outermost pixel of the product component on one scanline. */
  const roughEdge = (fixed: number, outward: 1 | -1, horizontalScan: boolean): number | null => {
    if (horizontalScan) {
      const row = fixed * width;
      if (outward > 0) { for (let x = bestBox.maxX; x >= bestBox.minX; x--) if (label[row + x] === bestLabel) return x; }
      else { for (let x = bestBox.minX; x <= bestBox.maxX; x++) if (label[row + x] === bestLabel) return x; }
    } else {
      if (outward > 0) { for (let y = bestBox.maxY; y >= bestBox.minY; y--) if (label[y * width + fixed] === bestLabel) return y; }
      else { for (let y = bestBox.minY; y <= bestBox.maxY; y++) if (label[y * width + fixed] === bestLabel) return y; }
    }
    return null;
  };

  type Edge = 'left' | 'right' | 'top' | 'bottom';
  const isVertical = (e: Edge) => e === 'left' || e === 'right';
  const outwardOf = (e: Edge): 1 | -1 => (e === 'right' || e === 'bottom' ? 1 : -1);

  /** Edge samples for scanlines t in [t0, t1]. */
  const sampleEdge = (edge: Edge, t0: number, t1: number, maxSamples: number) => {
    const vertical = isVertical(edge);
    const outward = outwardOf(edge);
    const limit = vertical ? height : width;
    const lo = Math.max(0, Math.round(Math.min(t0, t1)));
    const hi = Math.min(limit - 1, Math.round(Math.max(t0, t1)));
    const count = Math.min(maxSamples, hi - lo + 1);
    const prim: number[] = [];
    const sec: number[] = [];
    for (let k = 0; k < count; k++) {
      const t = Math.round(lo + ((hi - lo) * k) / Math.max(1, count - 1));
      const rough = roughEdge(t, outward, vertical);
      if (rough === null) continue;
      const pos = findEdge(t, rough, outward, vertical);
      if (pos !== null) { prim.push(t + 0.5); sec.push(pos); }
    }
    return { prim, sec, count };
  };

  // ── 5. Global edge lines from the central 70% of each side ─────────────
  const fitEdge = (edge: Edge): Line => {
    const vertical = isVertical(edge);
    const lo = vertical ? bestBox.minY : bestBox.minX;
    const hi = vertical ? bestBox.maxY : bestBox.maxX;
    const { prim, sec, count } = sampleEdge(edge, lo + (hi - lo) * 0.15, lo + (hi - lo) * 0.85, 160);
    const line = prim.length >= Math.max(5, count * 0.3) ? robustLineFit(prim, sec) : null;
    if (line) return line;
    const box = { left: bestBox.minX, right: bestBox.maxX + 1, top: bestBox.minY, bottom: bestBox.maxY + 1 }[edge];
    return { a: 0, b: box };
  };
  const leftLine = fitEdge('left');
  const rightLine = fitEdge('right');
  const topLine = fitEdge('top');
  const bottomLine = fitEdge('bottom');

  const globalCorners = {
    topLeft: intersect(leftLine, topLine),
    topRight: intersect(rightLine, topLine),
    bottomRight: intersect(rightLine, bottomLine),
    bottomLeft: intersect(leftLine, bottomLine),
  };
  const bookW = (globalCorners.topRight.x + globalCorners.bottomRight.x - globalCorners.topLeft.x - globalCorners.bottomLeft.x) / 2;
  const bookH = (globalCorners.bottomLeft.y + globalCorners.bottomRight.y - globalCorners.topLeft.y - globalCorners.topRight.y) / 2;

  // ── 6. Corner refinement ────────────────────────────────────────────────
  // Covers are rarely perfectly straight: they flare or curl towards the
  // corners and the corners are rounded. Extrapolating the mid-edge line puts
  // the corner inside the real silhouette, so each corner is measured
  // directly: the outermost extent of each adjoining edge within the band of
  // scanlines nearest that corner. That is the bounding vertex of the
  // (rounded, flared) corner — exactly where a corner protector's outer
  // vertex sits.
  const robustExtreme = (values: number[], dir: 1 | -1): number | null => {
    if (values.length < 4) return null;
    const sorted = [...values].sort((p, q) => (q - p) * dir); // most outward first
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.05))];
  };
  const BAND = 0.2;
  const refineCorner = (g: Point, hEdge: Edge, vEdge: Edge): Point => {
    const sx = outwardOf(vEdge); // +1 right, -1 left
    const sy = outwardOf(hEdge); // +1 bottom, -1 top
    // vertical edge (left/right): scan rows from the corner inward by BAND·bookH
    const vs = sampleEdge(vEdge, g.y, g.y - sy * bookH * BAND, 400);
    // horizontal edge (top/bottom): scan columns from the corner inward by BAND·bookW
    const hs = sampleEdge(hEdge, g.x, g.x - sx * bookW * BAND, 400);
    const x = robustExtreme(vs.sec, sx);
    const y = robustExtreme(hs.sec, sy);
    const maxShiftX = bookW * 0.04;
    const maxShiftY = bookH * 0.04;
    return {
      x: x !== null && Math.abs(x - g.x) <= maxShiftX ? x : g.x,
      y: y !== null && Math.abs(y - g.y) <= maxShiftY ? y : g.y,
    };
  };
  const tl = refineCorner(globalCorners.topLeft, 'top', 'left');
  const tr = refineCorner(globalCorners.topRight, 'top', 'right');
  const br = refineCorner(globalCorners.bottomRight, 'bottom', 'right');
  const bl = refineCorner(globalCorners.bottomLeft, 'bottom', 'left');

  const toPct = (p: Point): Point => ({
    x: round2((p.x / width) * 100),
    y: round2((p.y / height) * 100),
  });
  const corners: ProductCorners = {
    topLeft: toPct(tl),
    topRight: toPct(tr),
    bottomRight: toPct(br),
    bottomLeft: toPct(bl),
  };

  // Bounding rectangle of the refined silhouette (used for logo layout).
  const result: DetectedProductBounds = {
    left: Math.min(corners.topLeft.x, corners.bottomLeft.x),
    right: Math.max(corners.topRight.x, corners.bottomRight.x),
    top: Math.min(corners.topLeft.y, corners.topRight.y),
    bottom: Math.max(corners.bottomLeft.y, corners.bottomRight.y),
    corners,
  };

  // Sanity: reject degenerate geometry.
  if (
    !Object.values(corners).every((p) => Number.isFinite(p.x) && Number.isFinite(p.y)) ||
    result.right - result.left < 10 ||
    result.bottom - result.top < 10 ||
    result.left < -1 || result.right > 101 || result.top < -1 || result.bottom > 101
  ) {
    return null;
  }
  return result;
}
