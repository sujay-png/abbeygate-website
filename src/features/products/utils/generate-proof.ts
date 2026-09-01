import { getImageBoundingBox, getLogoAnchorsFromMm } from './product-helpers';
import { getConfiguredImageBounds } from './product-image-bounds';

export type BrandingSpec = {
  blockingType: string;
  foilColor?: string;
  cornerEdges?: string;
  positionLabel: string;
  logoScale: number;
  logoPreviewUrl?: string;
};

export type ProofGeometry = { 
  widthMm: number; 
  heightMm: number; 
  isDiary: boolean;
  isCurved?: boolean;
};

export type ProofResult = {
  fullPreviewUrl: string;
  imageBounds: { top: number; bottom: number; left: number; right: number } | null;
  leftPercent: number;
  topPercent: number;
  widthPercent: number;
};

/** Load `src` into an <img> and resolve once decoded (rejects on error/empty). */
function loadImg(src: string, crossOrigin?: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    if (crossOrigin) img.crossOrigin = crossOrigin;
    img.onload = () =>
      img.width > 0 && img.height > 0 ? resolve(img) : reject(new Error('empty image'));
    img.onerror = () => reject(new Error('image failed to load'));
    img.src = src;
  });
}

/** Fetch any URL through our server-side proxy, returning a base64 data: URL. */
async function fetchAsDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const json = await res.json();
    return json?.dataUrl ?? null;
  } catch {
    return null;
  }
}

/**
 * Robustly load the product image for canvas compositing.
 * 1) /api/proxy-image -> data: URL. Same-origin (never taints toDataURL) and
 *    independent of next.config images.remotePatterns/qualities. Preferred.
 * 2) /_next/image      -> Next optimizer (allow-listed hosts only). Fallback.
 * 3) direct URL with crossOrigin='anonymous'. Last resort.
 * Throws only if every strategy fails.
 */
async function loadProductImageElement(url: string): Promise<HTMLImageElement> {
  const dataUrl = await fetchAsDataUrl(url);
  if (dataUrl) {
    try { return await loadImg(dataUrl); } catch { /* try next */ }
  }
  try {
    const res = await fetch(`/_next/image?url=${encodeURIComponent(url)}&w=828&q=75`);
    if (res.ok && (res.headers.get('content-type') || '').startsWith('image/')) {
      const objectUrl = URL.createObjectURL(await res.blob());
      try { return await loadImg(objectUrl); } finally { URL.revokeObjectURL(objectUrl); }
    }
  } catch { /* try next */ }
  return await loadImg(url, 'anonymous');
}

/**
 * Load the logo without tainting the canvas. Data URLs load directly; remote
 * (http) logos are pulled through the proxy so the composited canvas stays
 * exportable via toDataURL().
 */
async function loadLogoImageElement(url: string): Promise<HTMLImageElement> {
  if (url.startsWith('data:')) return await loadImg(url);
  const dataUrl = await fetchAsDataUrl(url);
  if (dataUrl) {
    try { return await loadImg(dataUrl); } catch { /* try next */ }
  }
  return await loadImg(url, 'anonymous');
}

export async function composeProof(args: {
  productImageUrl: string;
  branding: BrandingSpec;
  geometry: ProofGeometry;
}): Promise<ProofResult | null> {
  const { productImageUrl, branding, geometry } = args;

  let fullPreviewUrl: string | undefined = undefined;
  let finalBounds: any = null;
  let leftPercent = 50;
  let topPercent = 50;
  let widthPercent = 25 * (branding.logoScale || 1);

  try {
    const CANVAS_SIZE = 800;
    const canvas = document.createElement('canvas');
    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      const productImg = await loadProductImageElement(productImageUrl);

      {
        const imgAspect = productImg.width / productImg.height;
        if (Number.isNaN(imgAspect) || productImg.width === 0) {
          throw new Error('Failed to load product image for canvas');
        }
        let drawW = CANVAS_SIZE;
        let drawH = CANVAS_SIZE;
        let drawX = 0;
        let drawY = 0;
        if (imgAspect > 1) {
          drawH = CANVAS_SIZE / imgAspect;
          drawY = (CANVAS_SIZE - drawH) / 2;
        } else {
          drawW = CANVAS_SIZE * imgAspect;
          drawX = (CANVAS_SIZE - drawW) / 2;
        }
        ctx.drawImage(productImg, drawX, drawY, drawW, drawH);

        const bounds = getConfiguredImageBounds(productImageUrl) ?? await getImageBoundingBox(productImageUrl);
        if (bounds) finalBounds = bounds;

        const anchors = getLogoAnchorsFromMm(geometry.widthMm, geometry.heightMm);
        const bookLeft = finalBounds ? finalBounds.left : anchors.bookLeft;
        const bookRight = finalBounds ? finalBounds.right : anchors.bookRight;
        const bookTop = finalBounds ? finalBounds.top : anchors.bookTop;
        const bookBottom = finalBounds ? finalBounds.bottom : anchors.bookBottom;

        const bookWidth = bookRight - bookLeft;
        const bookHeight = bookBottom - bookTop;
        const marginX = bookWidth * 0.08;
        const marginY = bookHeight * 0.05;

        const diaryTopOffset = geometry.isDiary ? (bookHeight * 0.15) : 0;

        const safeLeft = bookLeft + marginX;
        const safeRight = bookRight - marginX;
        const safeTop = bookTop + marginY + diaryTopOffset;
        const safeBottom = bookBottom - marginY;

        if (branding.logoPreviewUrl) {
          const logoImg = await loadLogoImageElement(branding.logoPreviewUrl);

          const posLabel = branding.positionLabel || 'center';
          let boxLeft = 50 - 12.5;
          let boxTop = 50 - 12.5;

          if (posLabel === 'top-left') { boxLeft = safeLeft; boxTop = safeTop; }
          else if (posLabel === 'top-center') { boxLeft = 50 - 12.5; boxTop = safeTop; }
          else if (posLabel === 'top-right') { boxLeft = safeRight - 25; boxTop = safeTop; }
          else if (posLabel === 'center-left') { boxLeft = safeLeft; boxTop = 50 - 12.5; }
          else if (posLabel === 'center-right') { boxLeft = safeRight - 25; boxTop = 50 - 12.5; }
          else if (posLabel === 'bottom-left') { boxLeft = safeLeft; boxTop = safeBottom - 25; }
          else if (posLabel === 'bottom-center') { boxLeft = 50 - 12.5; boxTop = safeBottom - 25; }
          else if (posLabel === 'bottom-right') { boxLeft = safeRight - 25; boxTop = safeBottom - 25; }

          const scaledBoxWidth = 25 * (branding.logoScale || 1);
          const scaledBoxHeight = 25 * (branding.logoScale || 1);
          
          if (posLabel.includes('right')) boxLeft = boxLeft + 25 - scaledBoxWidth;
          else if (!posLabel.includes('left')) boxLeft = boxLeft + 12.5 - scaledBoxWidth / 2;

          if (posLabel.includes('bottom')) boxTop = boxTop + 25 - scaledBoxHeight;
          else if (!posLabel.includes('top')) boxTop = boxTop + 12.5 - scaledBoxHeight / 2;

          const logoImgAspect = logoImg.width / logoImg.height;
          let drawLogoW = scaledBoxWidth;
          let drawLogoH = scaledBoxHeight;
          if (logoImgAspect > 1) {
            drawLogoH = scaledBoxWidth / logoImgAspect;
          } else {
            drawLogoW = scaledBoxHeight * logoImgAspect;
          }

          let logoDrawXPercent = boxLeft;
          let logoDrawYPercent = boxTop;
          
          if (posLabel.includes('right')) logoDrawXPercent = boxLeft + scaledBoxWidth - drawLogoW;
          else if (!posLabel.includes('left')) logoDrawXPercent = boxLeft + (scaledBoxWidth - drawLogoW) / 2;

          if (posLabel.includes('bottom')) logoDrawYPercent = boxTop + scaledBoxHeight - drawLogoH;
          else if (!posLabel.includes('top')) logoDrawYPercent = boxTop + (scaledBoxHeight - drawLogoH) / 2;
          
          leftPercent = logoDrawXPercent + (drawLogoW / 2);
          topPercent = logoDrawYPercent + (drawLogoH / 2);
          widthPercent = drawLogoW;

          const logoX = CANVAS_SIZE * (logoDrawXPercent / 100);
          const logoY = CANVAS_SIZE * (logoDrawYPercent / 100);
          const logoW = CANVAS_SIZE * (drawLogoW / 100);
          const logoH = CANVAS_SIZE * (drawLogoH / 100);

          if (branding.blockingType === 'Foil blocked') {
            const tintCanvas = document.createElement('canvas');
            tintCanvas.width = logoW;
            tintCanvas.height = logoH;
            const tCtx = tintCanvas.getContext('2d');
            if (tCtx) {
              tCtx.drawImage(logoImg, 0, 0, logoW, logoH);
              tCtx.globalCompositeOperation = 'source-in';
              tCtx.fillStyle = branding.foilColor === 'Gold' ? '#D4AF37' : '#C0C0C0';
              tCtx.fillRect(0, 0, logoW, logoH);
              ctx.drawImage(tintCanvas, logoX, logoY, logoW, logoH);
            }
          } else if (branding.blockingType === 'UV Print') {
            ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
          } else if (branding.blockingType === 'Embossed') {
            const shift = Math.max(1.5, logoW * 0.003); // Proportional shift for high-res canvas

            // 1. Debossed Shadow Edge (Top-Left Inner Edge)
            const darkEdge = document.createElement('canvas');
            darkEdge.width = logoW; darkEdge.height = logoH;
            const dCtx = darkEdge.getContext('2d');
            if (dCtx) {
              dCtx.drawImage(logoImg, 0, 0, logoW, logoH);
              dCtx.globalCompositeOperation = 'source-in';
              dCtx.fillStyle = 'rgba(0,0,0,0.65)';
              dCtx.fillRect(0, 0, logoW, logoH);
              dCtx.globalCompositeOperation = 'destination-out';
              dCtx.drawImage(logoImg, shift, shift, logoW, logoH);

              ctx.save();
              ctx.filter = 'blur(0.5px)';
              ctx.globalCompositeOperation = 'multiply';
              ctx.drawImage(darkEdge, logoX, logoY, logoW, logoH);
              ctx.restore();
            }

            // 2. Debossed Highlight Edge (Bottom-Right Inner Edge)
            const lightEdge = document.createElement('canvas');
            lightEdge.width = logoW; lightEdge.height = logoH;
            const lCtx = lightEdge.getContext('2d');
            if (lCtx) {
              lCtx.drawImage(logoImg, 0, 0, logoW, logoH);
              lCtx.globalCompositeOperation = 'source-in';
              lCtx.fillStyle = 'rgba(255,255,255,0.5)';
              lCtx.fillRect(0, 0, logoW, logoH);
              lCtx.globalCompositeOperation = 'destination-out';
              lCtx.drawImage(logoImg, -shift, -shift, logoW, logoH);

              ctx.save();
              ctx.filter = 'blur(0.5px)';
              ctx.globalCompositeOperation = 'screen';
              ctx.drawImage(lightEdge, logoX, logoY, logoW, logoH);
              ctx.restore();
            }

            // 3. Debossed Base Fill (slight darkening of the pressed area)
            const baseFill = document.createElement('canvas');
            baseFill.width = logoW; baseFill.height = logoH;
            const bCtx = baseFill.getContext('2d');
            if (bCtx) {
              bCtx.drawImage(logoImg, 0, 0, logoW, logoH);
              bCtx.globalCompositeOperation = 'source-in';
              bCtx.fillStyle = 'rgba(0,0,0,0.08)';
              bCtx.fillRect(0, 0, logoW, logoH);

              ctx.save();
              ctx.globalCompositeOperation = 'multiply';
              ctx.drawImage(baseFill, logoX, logoY, logoW, logoH);
              ctx.restore();
            }
          } else {
            ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);
          }
        }

        if (branding.cornerEdges && branding.cornerEdges !== 'None') {
          try {
            if (finalBounds) {
              const offset = CANVAS_SIZE * 0.004;
              const clipW = CANVAS_SIZE * 0.08; // Increased from 0.06 to match 8% visual size
              const clipH = clipW;
              
              const bookRightPx = drawX + (finalBounds.right / 100) * drawW;
              const bookTopPx = drawY + (finalBounds.top / 100) * drawH;
              const bookBottomPx = drawY + (finalBounds.bottom / 100) * drawH;

              const isCurved = geometry.isCurved ?? false;

              const drawCorner = (x: number, y: number, rotation: number) => {
                ctx.save();
                ctx.translate(x, y);
                
                // Drop shadow
                ctx.shadowColor = 'rgba(0,0,0,0.4)';
                ctx.shadowBlur = 4;
                ctx.shadowOffsetX = -1;
                ctx.shadowOffsetY = 2;
                
                ctx.translate(clipW/2, clipH/2);
                ctx.rotate(rotation * Math.PI / 180);
                ctx.translate(-clipW/2, -clipH/2);
                
                ctx.scale(clipW/40, clipH/40);
                
                // Main Body
                const mainPathStr = isCurved 
                  ? 'M 8 0 L 20 0 Q 40 0 40 20 L 40 32 L 34 32 L 34 20 Q 34 6 20 6 L 8 6 Z' 
                  : 'M 0 0 L 36 0 Q 40 0 40 4 L 40 40 L 34 40 L 34 10 Q 34 6 30 6 L 0 6 Z';
                const mainPath = new Path2D(mainPathStr);
                
                const grad = ctx.createLinearGradient(0, 0, 40, 40);
                if (branding.cornerEdges === 'Gold') {
                  grad.addColorStop(0, '#D4AF37');
                  grad.addColorStop(0.15, '#FFF4D0');
                  grad.addColorStop(0.35, '#AA7C11');
                  grad.addColorStop(0.65, '#F9E596');
                  grad.addColorStop(1, '#8A6311');
                } else {
                  grad.addColorStop(0, '#A0A0A0');
                  grad.addColorStop(0.15, '#FFFFFF');
                  grad.addColorStop(0.35, '#707070');
                  grad.addColorStop(0.65, '#E0E0E0');
                  grad.addColorStop(1, '#505050');
                }
                ctx.fillStyle = grad;
                ctx.fill(mainPath);
                
                // Clear drop shadow so strokes don't have it
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;

                // Dark inner shadow line
                ctx.strokeStyle = 'rgba(0,0,0,0.6)';
                ctx.lineWidth = 0.75;
                ctx.stroke(new Path2D(isCurved ? 'M 8 6 L 20 6 Q 34 6 34 20 L 34 32' : 'M 0 6 L 30 6 Q 34 6 34 10 L 34 40'));

                // Dark outer edge line
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 0.5;
                ctx.stroke(new Path2D(isCurved ? 'M 8 0 L 20 0 Q 40 0 40 20 L 40 32' : 'M 0 0 L 36 0 Q 40 0 40 4 L 40 40'));
                
                // Primary highlight
                ctx.strokeStyle = 'rgba(255,255,255,0.9)';
                ctx.lineWidth = 1.2;
                ctx.shadowColor = 'rgba(255,255,255,0.9)';
                ctx.shadowBlur = 2; // Simulates the SVG blur filter
                ctx.stroke(new Path2D(isCurved ? 'M 8 1.5 L 20 1.5 Q 38.5 1.5 38.5 20 L 38.5 32' : 'M 0 1.5 L 35 1.5 Q 38.5 1.5 38.5 5 L 38.5 40'));
                
                // Secondary highlight
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.lineWidth = 2;
                ctx.shadowBlur = 4;
                ctx.stroke(new Path2D(isCurved ? 'M 8 3 L 20 3 Q 37 3 37 20 L 37 32' : 'M 0 3 L 34 3 Q 37 3 37 6 L 37 40'));
                
                // Dark shadow inner rim
                ctx.strokeStyle = 'rgba(0,0,0,0.3)';
                ctx.lineWidth = 1;
                ctx.shadowColor = 'rgba(0,0,0,0.3)';
                ctx.stroke(new Path2D(isCurved ? 'M 8 5 L 20 5 Q 35 5 35 20 L 35 32' : 'M 0 5 L 31 5 Q 35 5 35 9 L 35 40'));
                
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;

                // Crimps
                ctx.strokeStyle = 'rgba(0,0,0,0.2)';
                ctx.lineWidth = 0.5;
                ctx.stroke(new Path2D('M 12 0 L 12 6 M 14 0 L 14 6 M 34 26 L 40 26 M 34 28 L 40 28'));
                
                ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                ctx.stroke(new Path2D('M 12.5 0 L 12.5 6 M 14.5 0 L 14.5 6 M 34 26.5 L 40 26.5 M 34 28.5 L 40 28.5'));

                ctx.restore();
              };

              drawCorner(bookRightPx + offset - clipW, bookTopPx - offset, 0);
              drawCorner(bookRightPx + offset - clipW, bookBottomPx + offset - clipH, 90);
            }
          } catch (e) {
            console.error('Failed to draw corners on canvas', e);
          }
        }

        fullPreviewUrl = canvas.toDataURL('image/png', 0.9);
      }
    }
  } catch (e) {
    console.error('Native canvas composition failed', e);
  }

  if (fullPreviewUrl === undefined) return null;

  return {
    fullPreviewUrl,
    imageBounds: finalBounds,
    leftPercent,
    topPercent,
    widthPercent
  };
}
