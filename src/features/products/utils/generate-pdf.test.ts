// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { generateDigitalProof } from './generate-pdf';

// Polyfill FileReader for Node
class MockFileReader {
  onloadend: any;
  result: string = '';
  readAsDataURL() {
    this.result = 'data:image/png;base64,mock';
    if (this.onloadend) this.onloadend();
  }
}
(global as any).FileReader = MockFileReader;

// Mock fetch so we don't try to load the real image during tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob([Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='), c => c.charCodeAt(0))], { type: 'image/png' }))
  })
) as any;

describe('generateDigitalProof', () => {
  const mockProduct = {
    id: 'test-1',
    name: 'Dorchester A5 Notebook',
    slug: 'dorchester-a5',
    sku: 'NH-BK-U-31-E-P',
    basePrice: 5,
    categories: [{ id: 'c1', name: 'Soft-touch vegan leather', slug: 'soft' }, { id: 'c2', name: 'Feint ruled', slug: 'feint' }],
    images: [],
    thumbnail: '',
    minOrderQuantity: 25,
    metadata: { isGifts: false, isFoilBlocked: true },
    description: 'Test'
  } as any;

  const mockCustomization = {
    enabled: true,
    blockingType: 'Foil blocked' as const,
    foilColor: 'Gold',
    logoPosition: { id: 'top-left', label: 'top-left' },
    logoScale: 0.9,
    cornerEdges: 'None' as const,
    fullPreviewUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='
  };

  it('generates a PDF and includes all dynamic fields without hardcoding', async () => {
    const arrayBuffer = await generateDigitalProof(mockProduct, mockCustomization, 250, 3.24);
    
    // Dynamically import pdf-parse to avoid ESM/CJS issues in Vitest
    const pdfParseMod = await import('pdf-parse');
    const pdfParse = pdfParseMod.default || pdfParseMod;
    
    // Parse the PDF buffer
    const pdfData = await pdfParse(Buffer.from(arrayBuffer));
    const text = pdfData.text;

    // It should include the product name
    expect(text).toContain('Dorchester A5 Notebook');

    // It should include dynamic specs
    expect(text).toContain('SKUNH-BK-U-31-E-P');
    expect(text).toContain('BrandingFoil blocked');
    expect(text).toContain('Foil ColourGold');
    expect(text).toContain('PositionTop left');
    expect(text).toContain('Corner EdgesNone');

    // It should include pricing
    expect(text).toContain('Quantity250');
    expect(text).toContain('Unit price (ex VAT)£3.24');
    expect(text).toContain('Subtotal (ex VAT)£810.00'); // 250 * 3.24 = 810
    expect(text).toContain('Total (incl. VAT 20%)£972.00'); // 810 * 1.2 = 972

    // It should NOT include Ribbon color or Elastic color
    expect(text).not.toContain('Ribbon');
    expect(text).not.toContain('Elastic');
  });
});
