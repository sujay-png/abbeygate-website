export async function processLogo(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      const width = canvas.width;
      const height = canvas.height;

      // 1. Check if the image already has a transparent background.
      // Many PNGs have a solid white background but some anti-aliased pixels inside.
      // Checking the whole image falsely skips background removal for these PNGs.
      // We now only check the 4 corners. If any corner is fully transparent, we assume the background is already removed.
      const corners = [
        3, // top-left
        (width - 1) * 4 + 3, // top-right
        (height - 1) * width * 4 + 3, // bottom-left
        ((height - 1) * width + width - 1) * 4 + 3 // bottom-right
      ];

      const hasTransparentBackground = corners.some(index => data[index] < 250);

      if (hasTransparentBackground) {
        // Return original if it already contains a transparent background
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      // 2. Global Background Removal (Color Keying)
      // For logos (especially for foil/deboss), global color keying is superior to flood fill 
      // because it correctly removes the background color from *inside* closed loops (like the letter 'O' or 'A').
      // It also handles JPEG artifacts and DALL-E noise much better.

      // Determine reference background color using the median of the 4 corners
      const cornersR = [data[0], data[(width - 1) * 4], data[(height - 1) * width * 4], data[((height - 1) * width + width - 1) * 4]];
      const cornersG = [data[1], data[(width - 1) * 4 + 1], data[(height - 1) * width * 4 + 1], data[((height - 1) * width + width - 1) * 4 + 1]];
      const cornersB = [data[2], data[(width - 1) * 4 + 2], data[(height - 1) * width * 4 + 2], data[((height - 1) * width + width - 1) * 4 + 2]];

      cornersR.sort((a,b) => a-b);
      cornersG.sort((a,b) => a-b);
      cornersB.sort((a,b) => a-b);

      // Use the median to ignore a corner if the logo touches it
      const bgR = Math.round((cornersR[1] + cornersR[2]) / 2);
      const bgG = Math.round((cornersG[1] + cornersG[2]) / 2);
      const bgB = Math.round((cornersB[1] + cornersB[2]) / 2);

      const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
        return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
      };

      // Tighter threshold for full transparency to avoid eating into light logos, 
      // but generous fade range to smooth out anti-aliasing and JPEG noise.
      const threshold1 = 30;  // Distance within this is fully transparent
      const threshold2 = 110; // Distance between threshold1 and this is partially transparent

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const dist = colorDistance(r, g, b, bgR, bgG, bgB);

        if (dist <= threshold1) {
          data[i + 3] = 0; // Fully transparent
        } else if (dist <= threshold2) {
          // Smooth alpha blending for edges/anti-aliasing
          const alphaScale = (dist - threshold1) / (threshold2 - threshold1);
          const newAlpha = Math.round(alphaScale * 255);
          data[i + 3] = Math.min(data[i + 3], newAlpha);
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = objectUrl;
  });
}
