export async function getImageBoundingBox(imageUrl: string): Promise<{ top: number, bottom: number, left: number, right: number } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);
      
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      
      let minX = canvas.width;
      let maxX = 0;
      let minY = canvas.height;
      let maxY = 0;
      
      for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
          const alpha = data[(y * canvas.width + x) * 4 + 3];
          if (alpha > 10) { // arbitrary threshold for non-transparent
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      
      if (minX >= maxX || minY >= maxY) {
        return resolve(null); // empty or fully transparent
      }
      
      resolve({
        left: (minX / canvas.width) * 100,
        right: (maxX / canvas.width) * 100,
        top: (minY / canvas.height) * 100,
        bottom: (maxY / canvas.height) * 100
      });
    };
    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}
