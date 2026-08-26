import { describe, it, expect, vi, beforeEach } from 'vitest';
import { composeProof } from './generate-proof';

// Mock getImageBoundingBox and getConfiguredImageBounds
vi.mock('./product-helpers', () => ({
  getImageBoundingBox: vi.fn().mockResolvedValue({ top: 10, bottom: 90, left: 10, right: 90 }),
  getLogoAnchorsFromMm: vi.fn().mockReturnValue({ bookLeft: 10, bookRight: 90, bookTop: 10, bookBottom: 90 })
}));

vi.mock('./product-image-bounds', () => ({
  getConfiguredImageBounds: vi.fn().mockReturnValue(null) // Fallback to mocked getImageBoundingBox
}));

describe('composeProof geometry calculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock global fetch for product image blob
    global.fetch = vi.fn().mockResolvedValue({
      blob: async () => new Blob()
    } as any);

    const dummyCtx = {
      fillRect: vi.fn(),
      drawImage: vi.fn(),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
      fill: vi.fn(),
      stroke: vi.fn(),
      save: vi.fn(),
      restore: vi.fn(),
      translate: vi.fn(),
      rotate: vi.fn(),
      scale: vi.fn(),
    };
    
    global.document.createElement = vi.fn().mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          getContext: () => dummyCtx,
          width: 800,
          height: 800,
          toDataURL: () => 'data:image/png;base64,mock',
        };
      }
      return {};
    }) as any;

    // Mock Image
    const MockImage = function() {
      const img = {
        width: 800,
        height: 800,
        onload: null as (() => void) | null,
        onerror: null as (() => void) | null,
        _src: '',
      };
      
      Object.defineProperty(img, 'src', {
        set: function(val) {
          this._src = val;
          setTimeout(() => {
            if (this.onload) this.onload();
          }, 0);
        },
        get: function() {
          return this._src;
        }
      });
      return img;
    };
    (global as any).Image = MockImage;
  });

  const baseArgs = {
    productImageUrl: 'product.jpg',
    geometry: { widthMm: 100, heightMm: 150, isDiary: false, isCurved: false },
    branding: {
      blockingType: 'UV Print',
      logoScale: 1,
      logoPreviewUrl: 'logo.png',
      positionLabel: 'center'
    }
  };

  const positions = [
    'top-left', 'top-center', 'top-right',
    'center-left', 'center', 'center-right',
    'bottom-left', 'bottom-center', 'bottom-right'
  ];

  positions.forEach(pos => {
    it(`calculates correct bounds for ${pos}`, async () => {
      const result = await composeProof({
        ...baseArgs,
        branding: { ...baseArgs.branding, positionLabel: pos }
      });

      expect(result).not.toBeNull();
      expect(result?.leftPercent).toBeDefined();
      expect(result?.topPercent).toBeDefined();
      expect(result?.widthPercent).toBe(25); // logoScale is 1, so width is 25%

      // Basic sanity checks
      expect(result!.leftPercent).toBeGreaterThanOrEqual(0);
      expect(result!.leftPercent).toBeLessThanOrEqual(100);
      expect(result!.topPercent).toBeGreaterThanOrEqual(0);
      expect(result!.topPercent).toBeLessThanOrEqual(100);

      // Snapshot testing the values to ensure the extraction didn't break them
      expect(Math.round(result!.leftPercent * 10) / 10).toMatchSnapshot(`left-${pos}`);
      expect(Math.round(result!.topPercent * 10) / 10).toMatchSnapshot(`top-${pos}`);
    });
  });
});
