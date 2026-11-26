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
      { label: 'Diaries', href: '/collection/diaries' },
      { label: 'A5 Diaries', href: '/collection/diaries/a5-diaries' },
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
      { label: 'Diaries', href: '/collection/diaries' },
      { label: 'Quarto Diaries', href: '/collection/diaries/quarto-diaries' },
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
      { label: 'Custom Gifts', href: '/collection/custom-gifts' },
      { label: 'Passport Wallets', href: '/collection/custom-gifts/passport-wallets' },
      { label: 'Richmond Leather Passport Wallet' },
    ]);
  });

  it('keeps Our Collections breadcrumb only for standalone named collections', () => {
    const mockProduct = {
      id: 202,
      name: 'Chelsea Showcase Item',
      slug: 'chelsea-showcase-item',
      categories: [
        { id: 49, name: 'Chelsea Collection', slug: 'chelsea-collection', link: '' },
      ],
    } as unknown as StoreProduct;

    expect(getProductBreadcrumbs(mockProduct)).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Our Collections', href: '/collection' },
      { label: 'Chelsea Collection', href: '/collection/chelsea' },
      { label: 'Chelsea Showcase Item' },
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
      { label: 'Products', href: '/collection/notebooks' },
      { label: 'Uncategorized Sample Item' },
    ]);
  });
});
