// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { canDownloadProof, downloadCartItemProof } from './download-proof';
import type { PricedItem } from '../context/CartContext';

// Mock generate-pdf
const mockGenerateDigitalProof = vi.fn().mockResolvedValue(new ArrayBuffer(100));
vi.mock('@/features/products/utils/generate-pdf', () => ({
  generateDigitalProof: (...args: unknown[]) => mockGenerateDigitalProof(...args),
}));

// Mock URL methods
global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

describe('downloadCartItemProof', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('correctly identifies if proof can be downloaded', () => {
    const itemWithProof = {
      customization: {
        enabled: true,
        fullPreviewUrl: 'data:image/png;base64,mock',
      },
    } as unknown as PricedItem;
    expect(canDownloadProof(itemWithProof)).toBe(true);

    const itemWithoutProof = {
      customization: {
        enabled: false,
      },
    } as unknown as PricedItem;
    expect(canDownloadProof(itemWithoutProof)).toBe(false);
  });

  it('passes the item SKU to generateDigitalProof', async () => {
    const mockItem: PricedItem = {
      key: 'item-1',
      productId: '1210',
      sku: 'SG-RD-F-21-E',
      name: 'Lewes SmoothGrain A6 Notebook, Feint Ruled, Red',
      slug: 'lewes-smoothgrain-a6-notebook-feint-ruled-red',
      image: '/image.jpg',
      price: 5.5,
      quantity: 50,
      unitPrice: 5.5,
      subtotal: 275,
      setupFee: 30,
      colour: { name: 'Red', slug: 'red', hex: '#b31b1b' },
      customization: {
        enabled: true,
        choice: 'Foil blocked',
        foilColor: 'Gold',
        cornerEdges: 'None',
        position: 'Center',
        positionLabel: 'center',
        logoScale: 1,
        fullPreviewUrl: 'data:image/png;base64,mock',
      },
    } as unknown as PricedItem;

    await downloadCartItemProof(mockItem);

    expect(mockGenerateDigitalProof).toHaveBeenCalledTimes(1);
    const passedProduct = mockGenerateDigitalProof.mock.calls[0][0];
    expect(passedProduct.sku).toBe('SG-RD-F-21-E');
    expect(passedProduct.name).toBe('Lewes SmoothGrain A6 Notebook, Feint Ruled, Red');
  });
});

