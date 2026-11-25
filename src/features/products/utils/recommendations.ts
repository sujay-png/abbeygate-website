import type { StoreProduct } from '../types/store-product';
import { getParentColour } from './color-helpers';
import { getCollectionWeight, getProductTypeWeight } from './product-helpers';

export const MAX_RECOMMENDATIONS = 5;

export type ProductFamily = 'diary' | 'notebook' | 'gift' | 'other';
export type DiaryView = 'dpp' | 'wtv' | '';
export type ProductSizeKey = 'pocket' | 'slim' | 'a6' | 'a5' | 'quarto' | 'a4' | '';
export type GiftSegment = 'travel' | 'hospitality' | 'corporate' | 'gifts' | '';

const SIZE_ORDER: Record<Exclude<ProductSizeKey, ''>, number> = {
  pocket: 1,
  a6: 1,
  slim: 1.5,
  a5: 2,
  quarto: 3,
  a4: 4,
};

const KNOWN_COLLECTIONS = [
  'chelsea',
  'windsor',
  'dorchester',
  'harrogate',
  'richmond',
  'lewes',
  'ocean-clean',
  'apple-peel',
] as const;

const DIARY_VIEW_CATEGORIES = new Set(['dpp', 'wtv']);

/**
 * Normalizes minor title spelling typos (e.g. "Dairy" -> "Diary", "Pweter" -> "Pewter")
 * so colour & parent-product deduplication works reliably across catalog variants.
 */
function normalizeProductText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\bdairy\b/g, 'diary')
    .replace(/\bpweter\b/g, 'pewter')
    .replace(/\bbicolor\b/g, 'bicolour')
    .trim();
}

/**
 * Returns the canonical parent key for a product so colour variants of the same product
 * line (including minor WP title typos or year tokens) are never recommended twice.
 */
export function getParentProductKey(product: Pick<StoreProduct, 'name'>): string {
  const baseName = product.name.split(',')[0] || product.name;
  return normalizeProductText(baseName)
    .replace(/\b20\d{2}\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getProductFamily(product: Pick<StoreProduct, 'name' | 'slug' | 'categories'>): ProductFamily {
  const catSlugs = new Set((product.categories || []).map((c) => c.slug.toLowerCase()));
  const text = normalizeProductText(`${product.name} ${product.slug}`);

  if (
    catSlugs.has('diaries') ||
    catSlugs.has('desk-diaries') ||
    catSlugs.has('pocket-diaries') ||
    catSlugs.has('a4-diaries') ||
    catSlugs.has('a5-diaries') ||
    catSlugs.has('quarto-diaries') ||
    text.includes('diary')
  ) {
    return 'diary';
  }

  if (
    catSlugs.has('notebooks') ||
    catSlugs.has('a5-notebooks') ||
    catSlugs.has('a6-notebooks') ||
    catSlugs.has('eco-friendly-notebooks') ||
    catSlugs.has('real-leather-notebooks-2') ||
    text.includes('notebook')
  ) {
    return 'notebook';
  }

  if (
    catSlugs.has('custom-gifts') ||
    catSlugs.has('gifts') ||
    catSlugs.has('travel-gifts') ||
    catSlugs.has('leather-gifts') ||
    catSlugs.has('card-holders') ||
    catSlugs.has('key-rings') ||
    catSlugs.has('luggage-tags') ||
    catSlugs.has('passport-holders') ||
    text.includes('key fob') ||
    text.includes('key ring') ||
    text.includes('keyring') ||
    text.includes('luggage tag') ||
    text.includes('card holder') ||
    text.includes('passport') ||
    text.includes('wallet') ||
    text.includes('menu holder') ||
    text.includes('bill holder') ||
    text.includes('coaster') ||
    text.includes('document folder') ||
    text.includes('ring binder')
  ) {
    return 'gift';
  }

  return 'other';
}

export function getCollectionFamily(
  product: Pick<StoreProduct, 'name' | 'slug' | 'categories' | 'attributes'>,
): string {
  const attrTerms = (product.attributes || [])
    .filter((a) => a.taxonomy === 'pa_collection')
    .flatMap((a) => a.terms.map((t) => t.slug.toLowerCase()));

  const catSlugs = (product.categories || []).map((c) => c.slug.toLowerCase());
  const text = normalizeProductText(`${product.name} ${product.slug}`);

  // Distinguish eco sub-collections before falling back to conscious-collection
  if (text.includes('ocean clean') || text.includes('ocean-clean')) return 'ocean-clean';
  if (text.includes('apple peel') || text.includes('apple-peel')) return 'apple-peel';

  for (const col of KNOWN_COLLECTIONS) {
    if (
      attrTerms.includes(col) ||
      catSlugs.includes(`${col}-collection`) ||
      catSlugs.includes(col) ||
      text.includes(col.replace('-', ' '))
    ) {
      return col;
    }
  }

  if (catSlugs.includes('conscious-collection')) return 'conscious';
  return '';
}

export function getProductSize(
  product: Pick<StoreProduct, 'name' | 'slug' | 'categories' | 'attributes'>,
): ProductSizeKey {
  const sizeTerms = (product.attributes || [])
    .filter((a) => a.taxonomy === 'pa_size')
    .flatMap((a) => a.terms.map((t) => t.slug.toLowerCase()));

  const catSlugs = (product.categories || []).map((c) => c.slug.toLowerCase());
  const text = normalizeProductText(`${product.name} ${product.slug}`);

  if (sizeTerms.includes('quarto') || catSlugs.includes('quarto-diaries') || text.includes('quarto')) return 'quarto';
  if (sizeTerms.includes('a4') || catSlugs.includes('a4-diaries') || /\ba4\b/.test(text)) return 'a4';
  if (sizeTerms.includes('a6') || catSlugs.includes('a6-notebooks') || /\ba6\b/.test(text)) return 'a6';
  if (sizeTerms.includes('pocket') || catSlugs.includes('pocket-diaries') || text.includes('pocket')) return 'pocket';
  if (sizeTerms.includes('slim') || text.includes('slim')) return 'slim';
  if (
    sizeTerms.includes('a5') ||
    catSlugs.includes('a5-diaries') ||
    catSlugs.includes('a5-notebooks') ||
    /\ba5\b/.test(text)
  ) {
    return 'a5';
  }

  return '';
}

export function getDiaryView(
  product: Pick<StoreProduct, 'name' | 'slug' | 'categories' | 'attributes'>,
): DiaryView {
  const catSlugs = (product.categories || []).map((c) => c.slug.toLowerCase());
  const layoutTerms = (product.attributes || [])
    .filter((a) => a.taxonomy === 'pa_layout')
    .flatMap((a) => a.terms.map((t) => t.slug.toLowerCase()));
  const text = normalizeProductText(`${product.name} ${product.slug}`);

  if (
    catSlugs.some((s) => s === 'dpp' && DIARY_VIEW_CATEGORIES.has(s)) ||
    layoutTerms.some((t) => t.includes('day')) ||
    text.includes('day per page') ||
    text.includes('day-per-page')
  ) {
    return 'dpp';
  }

  if (
    catSlugs.includes('wtv') ||
    layoutTerms.some((t) => t.includes('week')) ||
    text.includes('week to view') ||
    text.includes('week-to-view')
  ) {
    return 'wtv';
  }

  return '';
}

export function getProductColours(
  product: Pick<StoreProduct, 'name' | 'attributes'>,
  explicitColorHint?: string,
): string[] {
  const result = new Set<string>();

  const attrTerms = (product.attributes || [])
    .filter((a) => a.taxonomy === 'pa_colour')
    .flatMap((a) => a.terms.flatMap((t) => [t.slug, t.name]));

  for (const term of attrTerms) {
    const parent = getParentColour(normalizeProductText(term));
    if (parent) result.add(parent.slug);
  }

  if (explicitColorHint) {
    for (const part of explicitColorHint.split(/[\/,&\-|]+/)) {
      const parent = getParentColour(normalizeProductText(part));
      if (parent) result.add(parent.slug);
    }
  }

  if (result.size === 0 && product.name.includes(',')) {
    const colorSegment = normalizeProductText(product.name.split(',').pop() || '');
    for (const part of colorSegment.split(/[\/,&\-|]+/)) {
      const parent = getParentColour(part.trim());
      if (parent) result.add(parent.slug);
    }
  }

  return Array.from(result);
}

export function sharesColour(a: string[], b: string[]): boolean {
  if (!a.length || !b.length) return false;
  return a.some((color) => b.includes(color));
}

export function getGiftType(product: Pick<StoreProduct, 'name' | 'slug' | 'categories'>): string {
  const catSlugs = new Set((product.categories || []).map((c) => c.slug.toLowerCase()));
  const text = normalizeProductText(`${product.name} ${product.slug}`);

  if (catSlugs.has('passport-holders') || text.includes('passport')) return 'passport-holder';
  if (catSlugs.has('luggage-tags') || text.includes('luggage tag')) return 'luggage-tag';
  if (catSlugs.has('card-holders') || text.includes('card holder')) return 'card-holder';
  if (catSlugs.has('key-rings') || text.includes('key fob') || text.includes('key ring') || text.includes('keyring')) {
    return 'key-ring';
  }
  if (text.includes('travel wallet')) return 'travel-wallet';
  if (text.includes('wallet')) return 'wallet';
  if (text.includes('menu holder')) return 'menu-holder';
  if (text.includes('bill holder')) return 'bill-holder';
  if (text.includes('coaster')) return 'coaster';
  if (text.includes('document folder')) return 'document-folder';
  if (text.includes('ring binder')) return 'ring-binder';
  return '';
}

export function getGiftSegment(product: Pick<StoreProduct, 'name' | 'slug' | 'categories'>): GiftSegment {
  const catSlugs = new Set((product.categories || []).map((c) => c.slug.toLowerCase()));
  const text = normalizeProductText(`${product.name} ${product.slug}`);

  if (
    catSlugs.has('travel-gifts') ||
    text.includes('passport') ||
    text.includes('luggage') ||
    text.includes('card holder') ||
    text.includes('travel wallet')
  ) {
    return 'travel';
  }

  if (text.includes('menu holder') || text.includes('bill holder') || text.includes('coaster')) {
    return 'hospitality';
  }

  if (text.includes('document folder') || text.includes('ring binder') || catSlugs.has('corporate-gifts')) {
    return 'corporate';
  }

  if (getProductFamily(product) === 'gift') {
    return 'gifts';
  }

  return '';
}

export type RecommendationOptions = {
  currentProduct: StoreProduct;
  catalog: StoreProduct[];
  explicitColorHint?: string;
  /**
   * Ready-to-link manual override hook (Stage 0): pass product IDs from WooCommerce
   * `upsell_ids`/`cross_sell_ids` or a merchandising override table when enabled.
   */
  manualOverrideIds?: number[];
  /** Optional per-product manual rank (lower rank wins within a rule pool). */
  manualRankById?: Record<number, number>;
  maxTotal?: number;
};

type CandidateMeta = {
  product: StoreProduct;
  parentKey: string;
  family: ProductFamily;
  collection: string;
  size: ProductSizeKey;
  diaryView: DiaryView;
  colours: string[];
  giftType: string;
  giftSegment: GiftSegment;
  isBestSeller: boolean;
  collectionWeight: number;
};

function buildMeta(product: StoreProduct, explicitColorHint?: string): CandidateMeta {
  return {
    product,
    parentKey: getParentProductKey(product),
    family: getProductFamily(product),
    collection: getCollectionFamily(product),
    size: getProductSize(product),
    diaryView: getDiaryView(product),
    colours: getProductColours(product, explicitColorHint),
    giftType: getGiftType(product),
    giftSegment: getGiftSegment(product),
    isBestSeller: (product.categories || []).some((c) => c.slug === 'best-seller'),
    collectionWeight: getCollectionWeight(product),
  };
}

function compareWithinPool(
  a: CandidateMeta,
  b: CandidateMeta,
  manualRankById?: Record<number, number>,
): number {
  if (a.product.is_in_stock !== b.product.is_in_stock) {
    return a.product.is_in_stock ? -1 : 1;
  }

  const rankA = manualRankById?.[a.product.id];
  const rankB = manualRankById?.[b.product.id];
  if (rankA !== undefined || rankB !== undefined) {
    if (rankA === undefined) return 1;
    if (rankB === undefined) return -1;
    if (rankA !== rankB) return rankA - rankB;
  }

  if (a.isBestSeller !== b.isBestSeller) {
    return a.isBestSeller ? -1 : 1;
  }

  if (a.collectionWeight !== b.collectionWeight) {
    return a.collectionWeight - b.collectionWeight;
  }

  const typeWeightA = getProductTypeWeight(a.product);
  const typeWeightB = getProductTypeWeight(b.product);
  if (typeWeightA !== typeWeightB) {
    return typeWeightA - typeWeightB;
  }

  return a.product.name.localeCompare(b.product.name);
}

/**
 * Selects up to `maxTotal` (default 5) recommended products using the ordered waterfall rules:
 * - Stage 0 (when linked): explicit `manualOverrideIds` take precedence cleanly.
 * - Ordered rule pools execute sequentially; once a parent product is selected, it is removed
 *   from all subsequent pools so duplicate colour variants never appear.
 */
export function getRecommendedProducts({
  currentProduct,
  catalog,
  explicitColorHint,
  manualOverrideIds,
  manualRankById,
  maxTotal = MAX_RECOMMENDATIONS,
}: RecommendationOptions): StoreProduct[] {
  const target = buildMeta(currentProduct, explicitColorHint);
  const selected: StoreProduct[] = [];
  const selectedParentKeys = new Set<string>([target.parentKey]);
  const selectedIds = new Set<number>([currentProduct.id]);

  // Global exclusions: current product, unpurchasable / out-of-stock products, duplicate SKUs.
  const eligible = catalog
    .filter((p) => p.id !== currentProduct.id && p.is_purchasable && p.is_in_stock)
    .map((p) => buildMeta(p));

  const pick = (candidate: CandidateMeta): boolean => {
    if (selected.length >= maxTotal) return false;
    if (selectedIds.has(candidate.product.id)) return false;
    if (selectedParentKeys.has(candidate.parentKey)) return false;

    selected.push(candidate.product);
    selectedIds.add(candidate.product.id);
    selectedParentKeys.add(candidate.parentKey);
    return true;
  };

  // Stage 0: Manual override pipeline hook (ready to wire WooCommerce upsell_ids / custom map later)
  if (manualOverrideIds?.length) {
    const eligibleById = new Map(eligible.map((item) => [item.product.id, item]));
    for (const overrideId of manualOverrideIds) {
      if (selected.length >= maxTotal) break;
      const item = eligibleById.get(overrideId);
      if (item) pick(item);
    }
  }

  const takeFromPool = (
    predicate: (candidate: CandidateMeta) => boolean,
    maxFromPool: number = maxTotal,
    customComparator?: (a: CandidateMeta, b: CandidateMeta) => number,
  ) => {
    if (selected.length >= maxTotal || maxFromPool <= 0) return;

    const matches = eligible
      .filter((c) => !selectedParentKeys.has(c.parentKey) && predicate(c))
      .sort((a, b) => {
        if (customComparator) {
          const custom = customComparator(a, b);
          if (custom !== 0) return custom;
        }
        return compareWithinPool(a, b, manualRankById);
      });

    let taken = 0;
    for (const candidate of matches) {
      if (selected.length >= maxTotal || taken >= maxFromPool) break;
      if (pick(candidate)) taken += 1;
    }
  };

  const hasColourTarget = target.colours.length > 0;
  const colourMatches = (c: CandidateMeta) => !hasColourTarget || sharesColour(c.colours, target.colours);
  const diffCollection = (c: CandidateMeta) =>
    Boolean(target.collection && c.collection && c.collection !== target.collection);
  const sameCollection = (c: CandidateMeta) =>
    Boolean(target.collection && c.collection === target.collection);
  const sameSize = (c: CandidateMeta) => Boolean(target.size && c.size === target.size);

  if (target.family === 'diary') {
    // Priority 1: Diary; same Colour; same Size; different Collection Family (Max 3)
    takeFromPool((c) => c.family === 'diary' && colourMatches(c) && sameSize(c) && diffCollection(c), 3);

    // Priority 2: Notebook; same Colour; same Size; same Collection Family (Max 2)
    takeFromPool((c) => c.family === 'notebook' && colourMatches(c) && sameSize(c) && sameCollection(c), 2);

    // Priority 3 (Backfill): Diary; same Colour; same Size; different Diary View
    takeFromPool(
      (c) =>
        c.family === 'diary' &&
        colourMatches(c) &&
        sameSize(c) &&
        Boolean(target.diaryView && c.diaryView && c.diaryView !== target.diaryView),
    );

    // Priority 4 (Backfill): Diary; same Colour; nearest available Size; different Collection Family
    const targetSizeOrder = target.size ? SIZE_ORDER[target.size] : undefined;
    takeFromPool(
      (c) => c.family === 'diary' && colourMatches(c) && Boolean(c.size) && diffCollection(c),
      maxTotal,
      targetSizeOrder !== undefined
        ? (a, b) => {
            const distA = a.size ? Math.abs(SIZE_ORDER[a.size] - targetSizeOrder) : 99;
            const distB = b.size ? Math.abs(SIZE_ORDER[b.size] - targetSizeOrder) : 99;
            return distA - distB;
          }
        : undefined,
    );

    // Priority 5 (Backfill): Notebook; same Colour; same Collection Family; size can differ
    takeFromPool((c) => c.family === 'notebook' && colourMatches(c) && sameCollection(c));

    // Final safety backfill if unique colourways leave < 5 recommendations
    takeFromPool((c) => c.family === 'diary' && sameSize(c) && diffCollection(c));
    takeFromPool((c) => c.family === 'diary');
  } else if (target.family === 'notebook') {
    // Priority 1: Notebook; same Colour; same Size; different Collection Family (Max 3)
    takeFromPool((c) => c.family === 'notebook' && colourMatches(c) && sameSize(c) && diffCollection(c), 3);

    // Priority 2: Diary; same Colour; same Size; same Collection Family (Max 2)
    takeFromPool((c) => c.family === 'diary' && colourMatches(c) && sameSize(c) && sameCollection(c), 2);

    // Priority 3 (Backfill): Notebook; same Colour; same Collection Family; size can differ
    takeFromPool((c) => c.family === 'notebook' && colourMatches(c) && sameCollection(c));

    // Final safety backfill if unique colourways (e.g. White/Orange) leave < 5 recommendations
    takeFromPool((c) => c.family === 'notebook' && sameSize(c));
    takeFromPool((c) => c.family === 'diary' && sameCollection(c));
  } else {
    // Gifts (and any other accessory range):
    // Priority 1: Same Collection Family; same Colour; different Product Type
    takeFromPool(
      (c) =>
        c.family === 'gift' &&
        sameCollection(c) &&
        colourMatches(c) &&
        Boolean(!target.giftType || c.giftType !== target.giftType),
    );

    // Priority 2: Same Product Type; same Collection Family; different Colour
    takeFromPool(
      (c) =>
        Boolean(target.giftType && c.giftType === target.giftType) &&
        sameCollection(c) &&
        (!hasColourTarget || !sharesColour(c.colours, target.colours)),
    );

    // Priority 3: Same Product Type; same Colour; different Collection Family
    takeFromPool(
      (c) => Boolean(target.giftType && c.giftType === target.giftType) && colourMatches(c) && diffCollection(c),
    );

    // Priority 4: Same Gift Segment; different Product Type
    takeFromPool(
      (c) =>
        Boolean(target.giftSegment && c.giftSegment === target.giftSegment) &&
        Boolean(!target.giftType || c.giftType !== target.giftType),
    );

    // Priority 5: Same collection other types (any colour) -> same segment any collection
    takeFromPool((c) => c.family === 'gift' && sameCollection(c));
    takeFromPool((c) => Boolean(target.giftSegment && c.giftSegment === target.giftSegment));
  }

  return selected;
}
