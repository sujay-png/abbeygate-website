import { describe, it, expect } from 'vitest';
import { getConfiguredImageBounds } from './product-image-bounds';
import { isBicolourProduct, isHorizonProduct } from './product-helpers';

describe('product-image-bounds', () => {
  it('matches Bicolour Pocket Diary images with underscores and hyphens', () => {
    const underscoreUrl = 'https://dashboard.abbeygate-england.com/wp-content/uploads/2025/12/NewHide_Bicolour_Pocket_Diary_BK-AQ.jpg';
    const hyphenUrl = 'https://dashboard.abbeygate-england.com/wp-content/uploads/2025/12/NewHide-Bicolour-Pocket-Diary-BK-OR.jpg';

    const boundsUnderscore = getConfiguredImageBounds(underscoreUrl);
    const boundsHyphen = getConfiguredImageBounds(hyphenUrl);

    expect(boundsUnderscore).not.toBeNull();
    expect(boundsHyphen).not.toBeNull();
    expect(boundsUnderscore).toEqual({ left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 });
    expect(boundsHyphen).toEqual({ left: 29.4, right: 70.3, top: 10.6, bottom: 89.0 });
  });

  it('matches Apple Peel A5 notebook images', () => {
    const url = 'https://dashboard.abbeygate-england.com/wp-content/uploads/2025/12/applepeel-a5-notebook-lightblue-AJ-LB-U-31.webp';
    const bounds = getConfiguredImageBounds(url);

    expect(bounds).not.toBeNull();
    expect(bounds).toEqual({ left: 22.3, right: 77.9, top: 7.9, bottom: 91.9 });
  });

  it('matches Horizon Quarto Desk Diary images', () => {
    const url = 'https://dashboard.abbeygate-england.com/wp-content/uploads/2025/12/NewHide-Horizon-Quarto-Desk-Diary-BK-RD.jpg';
    const bounds = getConfiguredImageBounds(url);

    expect(bounds).not.toBeNull();
    expect(bounds).toEqual({ left: 19.2, right: 79.1, top: 13.2, bottom: 87.3 });
  });

  it('matches Chelsea Leather A5 Notebook (CL-BK-U-31) portrait bounds', () => {
    const url = 'https://dashboard.abbeygate-england.com/wp-content/uploads/2025/11/Chelsea-A5-WTV-Deluxe-2026-Notebook-Blue-scaled-1.jpg';
    const bounds = getConfiguredImageBounds(url);

    expect(bounds).not.toBeNull();
    expect(bounds).toEqual({ left: 17.9, right: 82.0, top: 16.6, bottom: 82.5 });
  });
});

describe('product-helpers classification', () => {
  it('correctly identifies bi-colour products', () => {
    expect(isBicolourProduct({ sku: 'NB-BK/AQ-U-096', name: 'Dorchester Bicolor Pocket Diary' })).toBe(true);
    expect(isBicolourProduct({ sku: 'NB-BL/RB-P-084', name: 'Dorchester Bicolour Quarto Desk Diary' })).toBe(true);
    expect(isBicolourProduct({ sku: 'CL-BK-U-31', name: 'Chelsea Leather Notebook' })).toBe(false);
  });

  it('correctly identifies horizon products', () => {
    expect(isHorizonProduct({ sku: 'HZ-BK/RD-P-083', name: 'Dorchester Horizon Quarto Desk Diary' })).toBe(true);
    expect(isHorizonProduct({ sku: 'NB-BK/YE-P-076', name: 'Dorchester Horizon A5 Desk' })).toBe(true);
    expect(isHorizonProduct({ sku: 'NF-BK-U-095', name: 'Dorchester Pocket Diary' })).toBe(false);
  });
});

