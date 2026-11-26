import { describe, it, expect } from 'vitest';
import { getCategoryRoute, getFilterConfigForPath } from './category-routes';
import { generateCategoryMetadata } from '@/lib/seo';

describe('category-routes filters, SEO separation, and mappings', () => {
  it('enables Collection filter on /collection/diaries, /collection/notebooks, and /collection/custom-gifts', () => {
    expect(getFilterConfigForPath('/collection/diaries')).toMatchObject({
      disableCollection: false,
      disableSize: false,
      disableProductType: true,
    });
    expect(getFilterConfigForPath('/collection/notebooks')).toMatchObject({
      disableCollection: false,
      disableSize: false,
      disableProductType: true,
    });
    expect(getFilterConfigForPath('/collection/custom-gifts')).toMatchObject({
      disableCollection: false,
      disableSize: true,
      disableLayout: true,
      disableProductType: false,
    });
  });

  it('disables Collection filter only inside specific named collections', () => {
    expect(getFilterConfigForPath('/collection')).toMatchObject({
      disableCollection: false,
      disableProductType: false,
    });
    expect(getFilterConfigForPath('/collection/all')).toMatchObject({
      disableCollection: false,
      disableProductType: false,
    });
    expect(getFilterConfigForPath('/collection/chelsea')).toMatchObject({
      disableCollection: true,
      disableProductType: false,
    });
  });

  it('includes WooCommerce category 160 for Real Leather Notebooks and fallback for Faux Leather routes', () => {
    const rlNb = getCategoryRoute('/collection/notebooks/real-leather-notebooks');
    expect(String(rlNb?.categoryId).split(',')).toContain('160');

    const flDiaries = getCategoryRoute('/collection/diaries/faux-leather-diaries');
    expect(flDiaries?.fallbackExcludeCategoryIds).toEqual({
      parentCategoryId: 18,
      excludeCategoryIds: [43],
    });

    const flNotebooks = getCategoryRoute('/collection/notebooks/faux-leather-notebooks');
    expect(flNotebooks?.fallbackExcludeCategoryIds).toEqual({
      parentCategoryId: 17,
      excludeCategoryIds: [47, 160, 173],
    });
  });

  it('keeps SEO meta description separate from on-page collection copy', async () => {
    const diariesRoute = getCategoryRoute('/collection/diaries');
    expect(diariesRoute?.seoDescription).toBe(
      'Business diaries & corporate diaries in real and faux leather, customised to suit. Personalise with your brand logo.',
    );
    expect(diariesRoute?.description).toContain("Discover Abbeygate's extensive collection of premium diaries.");

    const metadata = await generateCategoryMetadata('/collection', ['diaries']);
    expect(metadata.description).toBe(diariesRoute?.seoDescription);

    const rlNbRoute = getCategoryRoute('/collection/notebooks/real-leather-notebooks');
    expect(rlNbRoute?.description).toBeUndefined();
    expect(rlNbRoute?.seoDescription).toBe(
      'Leather notebooks & business notebooks, expertly made and customised to suit. Personalise with your brand logo.',
    );
  });

  it('exposes /collection/best-sellers mapped to category 159', () => {
    const bestSellers = getCategoryRoute('/collection/best-sellers');
    expect(bestSellers?.categoryId).toBe(159);
  });

  it('resolves root /collection SEO metadata and primaryCategoryId for multi-ID category routes', async () => {
    const collectionRoute = getCategoryRoute('/collection');
    const rootMetadata = await generateCategoryMetadata('/collection');
    expect(rootMetadata.description).toBe(collectionRoute?.seoDescription);

    expect(getCategoryRoute('/collection/notebooks/real-leather-notebooks')?.primaryCategoryId).toBe(47);
    expect(getCategoryRoute('/collection/custom-gifts')?.primaryCategoryId).toBe(176);
    expect(getCategoryRoute('/collection/custom-gifts/luggage-tags')?.primaryCategoryId).toBe(182);
    expect(getCategoryRoute('/collection/custom-gifts/card-holders')?.primaryCategoryId).toBe(178);
    expect(getCategoryRoute('/collection/custom-gifts/keyrings')?.primaryCategoryId).toBe(183);
  });
});
