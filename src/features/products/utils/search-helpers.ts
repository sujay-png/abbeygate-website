import { StoreProduct } from '../types/store-product';

export type SynonymGroup = {
  id: string;
  name: string;
  synonyms: string[];
  isProductMember: (product: StoreProduct, productText: string) => boolean;
};

export const SYNONYM_GROUPS: SynonymGroup[] = [
  {
    id: 'colourlux_graphic_print',
    name: 'Colourlux / Graphic Print',
    synonyms: [
      'graphic prints',
      'graphic print',
      'graphicprints',
      'graphicprint',
      'colour lux',
      'colour-lux',
      'colourlux',
      'color lux',
      'color-lux',
      'colorlux',
      'cover lux',
      'cover-lux',
      'coverlux',
    ],
    isProductMember: (product: StoreProduct, productText: string) => {
      // 1. Collection attribute
      const collAttr = product.attributes?.find(
        (a) => a.taxonomy === 'pa_collection' || a.name?.toLowerCase() === 'collection'
      );
      if (
        collAttr?.terms?.some(
          (t) =>
            t.name?.toLowerCase().includes('graphic print') ||
            t.slug?.toLowerCase().includes('graphic-print')
        )
      ) {
        return true;
      }

      // 2. Categories (Graphic Print Collection category ID is 54)
      if (
        product.categories?.some(
          (c) =>
            c.id === 54 ||
            c.slug?.toLowerCase().includes('graphic-print') ||
            c.name?.toLowerCase().includes('graphic print')
        )
      ) {
        return true;
      }

      // 3. SKU prefix (Graphic Prints / Coverlux / Colourlux uses CX- prefix)
      if (product.sku && product.sku.toUpperCase().startsWith('CX-')) {
        return true;
      }

      // 4. Text matches any synonym
      return [
        'graphic print',
        'graphic prints',
        'graphicprint',
        'graphicprints',
        'colourlux',
        'colorlux',
        'coverlux',
        'colour lux',
        'color lux',
        'cover lux',
      ].some((term) => productText.includes(term));
    },
  },
  {
    id: 'dorchester_newhide',
    name: 'Dorchester / New Hide / Newhide',
    synonyms: [
      'new-hide',
      'new hide',
      'newhide',
      'dorchester',
    ],
    isProductMember: (product: StoreProduct, productText: string) => {
      // 1. Collection attribute
      const collAttr = product.attributes?.find(
        (a) => a.taxonomy === 'pa_collection' || a.name?.toLowerCase() === 'collection'
      );
      if (
        collAttr?.terms?.some(
          (t) =>
            t.name?.toLowerCase().includes('dorchester') ||
            t.slug?.toLowerCase().includes('dorchester')
        )
      ) {
        return true;
      }

      // 2. Categories (Dorchester Collection category ID is 50)
      if (
        product.categories?.some(
          (c) =>
            c.id === 50 ||
            c.slug?.toLowerCase().includes('dorchester') ||
            c.name?.toLowerCase().includes('dorchester')
        )
      ) {
        return true;
      }

      // 3. SKU prefix (Dorchester / New Hide uses NH- and NF- prefixes)
      if (
        product.sku &&
        (product.sku.toUpperCase().startsWith('NH-') ||
          product.sku.toUpperCase().startsWith('NF-'))
      ) {
        return true;
      }

      // 4. Text matches any synonym (including 'previously known as: newhide' or 'new hide')
      return ['dorchester', 'newhide', 'new hide', 'new-hide'].some((term) =>
        productText.includes(term)
      );
    },
  },
];

export interface SearchOptions {
  knownColors?: Set<string>;
}

/**
 * Map of broad colour keywords to related/sub-shade colours.
 * When a customer searches for a broad colour (e.g. "red"), products featuring related colours
 * (e.g. "burgundy", "wine", "maroon") will also match the search results.
 * However, searching for a specific sub-shade (e.g. "burgundy") will NOT match broad/other colours (e.g. "red").
 */
export const RELATED_COLOUR_MAP: Record<string, string[]> = {
  red: ['burgundy', 'wine', 'maroon', 'ruby', 'crimson', 'scarlet'],
  blue: ['navy', 'teal', 'cobalt', 'royal', 'sky', 'cyan', 'indigo'],
  green: ['sage', 'olive', 'emerald', 'forest', 'mint', 'khaki'],
  black: ['charcoal', 'anthracite', 'jet'],
  grey: ['gray', 'silver', 'slate', 'ash', 'charcoal', 'graphite'],
  gray: ['grey', 'silver', 'slate', 'ash', 'charcoal', 'graphite'],
  brown: ['tan', 'mustard', 'cognac', 'camel', 'chestnut', 'chocolate', 'toffee'],
  pink: ['rose', 'blush', 'coral', 'fuchsia', 'magenta'],
  purple: ['violet', 'plum', 'lavender', 'lilac', 'amethyst', 'aubergine'],
  yellow: ['mustard', 'gold', 'amber', 'ochre'],
  orange: ['terracotta', 'peach', 'coral', 'rust'],
};

/**
 * Filters a list of StoreProducts by search query, with support for:
 * - Synonym groups (e.g. Colourlux = Graphic Print, Dorchester = New Hide = Newhide)
 * - Multi-word concept expansion and extraction
 * - SKU matching (e.g. "NH-BK", "CX-44")
 * - Plural and suffix variations (diaries/diary, notebooks/notebook)
 * - Strict color filtering when a known color is searched, including related colour shades (e.g. Red -> Burgundy)
 */
export function searchProducts(
  products: StoreProduct[],
  rawQuery: string,
  options?: SearchOptions
): StoreProduct[] {
  const query = (rawQuery || '').trim();
  if (!query) {
    return products;
  }

  const normalizedQuery = query.toLowerCase();

  // Find if query contains any synonym group
  const matchedGroups: SynonymGroup[] = [];
  let remainingQuery = normalizedQuery;

  for (const group of SYNONYM_GROUPS) {
    for (const syn of group.synonyms) {
      // Escape for regex and handle hyphens/spaces flexibly
      const escaped = syn
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(/[\s-]+/g, '[\\s-_]+');
      const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'gi');

      if (regex.test(remainingQuery)) {
        if (!matchedGroups.some((g) => g.id === group.id)) {
          matchedGroups.push(group);
        }
        remainingQuery = remainingQuery.replace(regex, ' ').trim();
      }
    }
  }

  // Remove punctuation from remaining terms except alphanumeric
  const searchTerms = remainingQuery
    .replace(/sku:?/gi, '')
    .split(/[\s,;=+/]+/)
    .filter(Boolean);

  const cleanQuery = query.toLowerCase().replace(/sku:?/gi, '').replace(/[\W_]+/g, '');

  // Extract known colors if not provided, including colour family keys
  const extractedColors = products.flatMap((p) =>
    p.attributes
      ?.filter((a) => a.taxonomy === 'pa_colour' || a.name?.toLowerCase() === 'colour')
      .flatMap((a) => a.terms?.map((t) => t.name.toLowerCase()) || []) || []
  );

  const knownColors =
    options?.knownColors ||
    new Set<string>([...Object.keys(RELATED_COLOUR_MAP), ...extractedColors]);

  const allQueryTerms = query.toLowerCase().replace(/sku:?/gi, '').split(/[\s,;=+/]+/).filter(Boolean);

  const matchesColorTerm = (colorTerm: string, text: string) => {
    const termRegex = new RegExp(`(^|[^a-z0-9])${colorTerm}([^a-z0-9]|$)`, 'i');
    if (termRegex.test(text)) return true;

    const related = RELATED_COLOUR_MAP[colorTerm];
    if (related && related.some((rel) => {
      const relRegex = new RegExp(`(^|[^a-z0-9])${rel}([^a-z0-9]|$)`, 'i');
      return relRegex.test(text);
    })) {
      return true;
    }

    return false;
  };

  return products.filter((product) => {
    const attributeText =
      product.attributes
        ?.map((a) => a.terms?.map((t) => t.name).join(' ') || '')
        .join(' ') || '';
    const categoryAndTagText = `${
      product.categories?.map((c) => c.name).join(' ') || ''
    } ${product.tags?.map((t) => t.name).join(' ') || ''}`;
    const nameAndAttrText = `${product.name} ${attributeText} ${categoryAndTagText}`.toLowerCase();
    const searchableText = `${product.name} sku ${product.sku || ''} ${
      product.description || ''
    } ${product.short_description || ''} ${attributeText} ${categoryAndTagText}`.toLowerCase();
    const cleanSearchableText = searchableText.replace(/sku/g, '').replace(/[\W_]+/g, '');

    // If query matched any synonym groups, product MUST belong to at least one matched group
    if (matchedGroups.length > 0) {
      const belongs = matchedGroups.some((g) => g.isProductMember(product, searchableText));
      if (!belongs) {
        return false;
      }
    }

    // STRICT COLOR CHECK: If user searched a color, it MUST match the color or a related shade
    const hasFailingColorTerm = allQueryTerms.some(
      (term) => knownColors.has(term) && !matchesColorTerm(term, nameAndAttrText)
    );
    if (hasFailingColorTerm) {
      return false;
    }

    // Direct clean query SKU match (e.g. "NH-BK" or "CX-44-P-083")
    if (matchedGroups.length === 0 && cleanQuery && cleanSearchableText.includes(cleanQuery)) {
      return true;
    }

    // If there are remaining terms to match (e.g. "diary" in "Colourlux diary")
    if (searchTerms.length > 0) {
      return searchTerms.every((term) => {
        if (searchableText.includes(term)) return true;
        // Check if term is a broad colour with related sub-shades
        const related = RELATED_COLOUR_MAP[term];
        if (related && related.some((rel) => {
          const relRegex = new RegExp(`(^|[^a-z0-9])${rel}([^a-z0-9]|$)`, 'i');
          return relRegex.test(searchableText);
        })) {
          return true;
        }
        if (term.endsWith('ies') && searchableText.includes(term.replace(/ies$/, 'y'))) return true;
        if (term.endsWith('s') && searchableText.includes(term.slice(0, -1))) return true;
        if (!term.endsWith('s') && searchableText.includes(term + 's')) return true;
        return false;
      });
    }

    // If no remaining terms and it matched a synonym group, it's a match!
    if (matchedGroups.length > 0) {
      return true;
    }

    // If no terms and no groups (e.g. user entered symbols only)
    if (cleanQuery && cleanSearchableText.includes(cleanQuery)) {
      return true;
    }

    return false;
  });
}
