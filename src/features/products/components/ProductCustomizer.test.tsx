import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductCustomizer } from './ProductCustomizer';
import { vi } from 'vitest';
import type { StoreProduct } from '../../types/store-product';

describe('ProductCustomizer', () => {
  const mockProduct = {
    id: 'test-1',
    name: 'Dorchester A5 Notebook',
    slug: 'dorchester-a5',
    sku: 'NH-BK-U-31-E-P',
    basePrice: 5,
    categories: [],
    images: [],
    thumbnail: '',
    minOrderQuantity: 25,
    metadata: { isGifts: false, isFoilBlocked: true },
    description: 'Test'
  } as unknown as StoreProduct;

  const mockCustomization = {
    enabled: true,
    blockingType: 'Foil blocked' as const,
    foilColor: 'Gold',
    logoFile: null,
    logoPreviewUrl: 'data:image/png;base64,mock',
    logoPosition: { id: 'top-left', label: 'top-left' },
    logoScale: 0.9,
    cornerEdges: 'None' as const,
    fullPreviewUrl: 'data:image/png;base64,mock'
  };

  const mockProps = {
    product: mockProduct,
    tiers: [],
    basePrice: 5,
    quantity: 250,
    customization: mockCustomization,
    onCustomizationChange: vi.fn(),
    onPriceChange: vi.fn(),
    onGenerateProof: vi.fn().mockResolvedValue({}),
    onAddToCart: vi.fn(),
    isAdding: false
  };

  it('renders Step 4 Review panel correctly with dynamic fields', async () => {
    // We override step to 4 by rendering and then forcing the step to 4
    // Wait, step is internal state. We can mock it or just click through.
    const { container } = render(<ProductCustomizer {...mockProps} />);
    
    // It starts at Step 1. Click "Proceed to Position" -> "Proceed to Extras" -> "Review"
    // Since step navigation buttons might be rendered differently, let's just find the Next buttons
    const nextToPosition = screen.getByRole('button', { name: /Proceed to Position/i });
    fireEvent.click(nextToPosition);
    
    const nextToExtras = screen.getByRole('button', { name: /Proceed to Extras/i });
    fireEvent.click(nextToExtras);
    
    const nextToReview = screen.getByRole('button', { name: /Review/i });
    fireEvent.click(nextToReview);
    
    // Now we should be on Step 4
    expect(await screen.findByText('Digital proof included')).toBeInTheDocument();
    
    // Check Branding row
    expect(screen.getByText('Foil blocked · Gold')).toBeInTheDocument();
    
    // Check Position row (0.9 scale)
    expect(screen.getByText('Top Left')).toBeInTheDocument();
    
    // Check Corner edges
    expect(screen.getAllByText('None').length).toBeGreaterThan(0);
    
    // Assert ribbon/elastic color do not appear
    expect(screen.queryByText(/Ribbon/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Elastic/i)).not.toBeInTheDocument();
  });
  
  it('updates review panel when customization changes', () => {
    const updatedCustomization = {
      ...mockCustomization,
      blockingType: 'Embossed' as const,
      foilColor: undefined,
      logoPosition: { id: 'center', label: 'center' },
      logoScale: 1.2,
      cornerEdges: 'Gold' as const
    };
    
    const { rerender } = render(<ProductCustomizer {...mockProps} />);
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Position/i }));
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Extras/i }));
    fireEvent.click(screen.getByRole('button', { name: /Review/i }));
    
    // Rerender with updated props to simulate parent state change
    rerender(<ProductCustomizer {...mockProps} customization={updatedCustomization} />);
    
    // Check Branding row
    expect(screen.getByText('Embossed')).toBeInTheDocument();
    
    // Check Position row
    expect(screen.getByText('Center')).toBeInTheDocument();
    
    // Check Corner edges
    expect(screen.getAllByText('Gold').length).toBeGreaterThan(0);
  });
});
