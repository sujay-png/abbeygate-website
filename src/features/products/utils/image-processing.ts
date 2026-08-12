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

      // 1. Check if the image already has transparency.
      // If we find pixels with alpha < 250, we assume it's a transparent image (e.g. transparent PNG)
      // and we shouldn't attempt to remove a solid background.
      let hasTransparency = false;
      for (let i = 3; i < data.length; i += 4) {
        if (data[i] < 250) {
          hasTransparency = true;
          break;
        }
      }

      if (hasTransparency) {
        // Return original if it already contains transparency
        resolve(canvas.toDataURL('image/png'));
        return;
      }

      // 2. Background removal using BFS flood-fill from edges
      // Use the top-left pixel (0,0) as the reference background color
      const bgR = data[0];
      const bgG = data[1];
      const bgB = data[2];

      const colorDistance = (r1: number, g1: number, b1: number, r2: number, g2: number, b2: number) => {
        return Math.sqrt(Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2));
      };

      // Tolerance for color matching (0-441 range for RGB distance)
      const tolerance = 30; 
      
      const visited = new Uint8Array(width * height);
      const queue: number[] = [];

      // Add all borders to the queue to start flood fill from the outside in
      for (let x = 0; x < width; x++) {
        queue.push(x, 0);
        queue.push(x, height - 1);
        visited[x] = 1;
        visited[x + (height - 1) * width] = 1;
      }
      for (let y = 1; y < height - 1; y++) {
        queue.push(0, y);
        queue.push(width - 1, y);
        visited[y * width] = 1;
        visited[(width - 1) + y * width] = 1;
      }

      let head = 0;
      while (head < queue.length) {
        const x = queue[head++];
        const y = queue[head++];
        const i = (y * width + x) * 4;

        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        if (colorDistance(r, g, b, bgR, bgG, bgB) <= tolerance) {
          // It's part of the background, make it fully transparent
          data[i + 3] = 0;

          // Check neighbors (left, right, up, down)
          if (x > 0 && !visited[y * width + (x - 1)]) {
            visited[y * width + (x - 1)] = 1;
            queue.push(x - 1, y);
          }
          if (x < width - 1 && !visited[y * width + (x + 1)]) {
            visited[y * width + (x + 1)] = 1;
            queue.push(x + 1, y);
          }
          if (y > 0 && !visited[(y - 1) * width + x]) {
            visited[(y - 1) * width + x] = 1;
            queue.push(x, y - 1);
          }
          if (y < height - 1 && !visited[(y + 1) * width + x]) {
            visited[(y + 1) * width + x] = 1;
            queue.push(x, y + 1);
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = objectUrl;
  });
}
