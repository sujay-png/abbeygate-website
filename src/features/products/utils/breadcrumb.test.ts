import { describe, it, expect } from 'vitest';
import { getProductBreadcrumbs } from './breadcrumb';
import type { StoreProduct } from '../types/store-product';

describe('getProductBreadcrumbs', () => {
  it('builds canonical hierarchy for A5 Diary (Home > Diaries > A5 Diaries > Product)', () => {
    const mockProduct = {
      id: 101,
      name: 'Richmond Blue WTV A5 Diary',
      slug: 'richmond-blue-wtv-a5-diary',
      categories: [
        { id: 18, name: 'Diaries', slug: 'diaries', link: '' },
        { id: 164, name: 'A5 Diaries', slug: 'a5-diaries', link: '' },
        { id: 53, name: 'Richmond Collection', slug: 'richmond', link: '' },
      ],
    } as unknown as StoreProduct;

    const breadcrumbs = getProductBreadcrumbs(mockProduct);

    expect(breadcrumbs).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Diaries', href: '/diaries' },
      { label: 'A5 Diaries', href: '/diaries/a5' },
      { label: 'Richmond Blue WTV A5 Diary' },
    ]);

    // Destination should be non-clickable (no href)
    expect(breadcrumbs[breadcrumbs.length - 1].href).toBeUndefined();
  });

  it('builds ancestor tree even if parent category was omitted by editor in WordPress', () => {
    const mockProduct = {
      id: 102,
      name: 'Chelsea Quarto Diary',
      slug: 'chelsea-quarto-diary',
      // Only Quarto category was checked, parent Diaries was omitted
      categories: [
        { id: 170, name: 'Quarto Diaries', slug: 'quarto-diaries', link: '' },
      ],
    } as unknown as StoreProduct;

    const breadcrumbs = getProductBreadcrumbs(mockProduct);

    expect(breadcrumbs).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Diaries', href: '/diaries' },
      { label: 'Quarto Diaries', href: '/diaries/quarto' },
      { label: 'Chelsea Quarto Diary' },
    ]);
  });

  it('builds canonical hierarchy for Custom Gifts (Home > Custom Gifts > Passport Wallets > Product)', () => {
    const mockProduct = {
      id: 201,
      name: 'Richmond Leather Passport Wallet',
      slug: 'richmond-leather-passport-wallet',
      categories: [
        { id: 181, name: 'Passport Wallets', slug: 'passport-wallets', link: '' },
      ],
    } as unknown as StoreProduct;

    const breadcrumbs = getProductBreadcrumbs(mockProduct);

    expect(breadcrumbs).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Custom Gifts', href: '/custom-gifts' },
      { label: 'Passport Wallets', href: '/custom-gifts/passport-wallets' },
      { label: 'Richmond Leather Passport Wallet' },
    ]);
  });

  it('falls back gracefully to Products if no categories match', () => {
    const mockProduct = {
      id: 301,
      name: 'Uncategorized Sample Item',
      slug: 'sample-item',
      categories: [],
    } as unknown as StoreProduct;

    const breadcrumbs = getProductBreadcrumbs(mockProduct);

    expect(breadcrumbs).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Products', href: '/notebooks' },
      { label: 'Uncategorized Sample Item' },
    ]);
  });
});
