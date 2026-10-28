/**
 * Color and hex parsing helpers for product swatches and customizer styling.
 */

/**
 * Detects whether a product is genuinely a bicolor / two-tone product based on its title/color.
 */
export function isBicolorProduct(productName?: string): boolean {
  if (!productName) return false;
  const lower = productName.toLowerCase();
  if (
    lower.includes('bicolor') ||
    lower.includes('bicolour') ||
    lower.includes('horizon') ||
    lower.includes('two-tone') ||
    lower.includes('2-tone')
  ) {
    return true;
  }
  const colorPart = productName.split(',').pop()?.trim().toLowerCase() || '';
  if (colorPart.includes('-') || colorPart.includes('/')) {
    const isLayout = colorPart.includes('view') || colorPart.includes('page') || colorPart.includes('ruled');
    if (!isLayout) return true;
  }
  return false;
}

/**
 * Normalizes raw hex strings from WordPress metadata.
 * Supports:
 * - Single hex with or without leading hash (e.g. '3D3935' or '#3D3935')
 * - Bicolor formats (e.g. '3D3935 / AF272F', '#3D3935-#AF272F', '3D3935-AF272F', '#112233, #445566')
 * If isBicolor is explicitly false, returns only the primary/first single hex code (#rrggbb).
 * Returns either '#rrggbb' or '#rrggbb,#rrggbb' (comma-separated for bicolors).
 */
export function parseHexValue(raw?: string | null, isBicolor?: boolean): string | null {
  if (!raw || typeof raw !== 'string') return null;

  // Split by common delimiters (e.g. " / ", ", ", "-", " and ", whitespace)
  const parts = raw
    .split(/[\/,\-\s|&]+/)
    .map((p) => p.trim().replace(/^#/, ''))
    .filter(Boolean);

  const validHexes: string[] = [];
  for (const part of parts) {
    // Only accept strictly 6-digit or 3-digit hex strings
    if (/^[0-9a-fA-F]{6}$/.test(part) || /^[0-9a-fA-F]{3}$/.test(part)) {
      validHexes.push(`#${part.toLowerCase()}`);
    }
  }

  if (validHexes.length === 0) return null;

  // Only combine as a two-color split if isBicolor is true or unspecified (for backward compat).
  // If isBicolor is explicitly false, always return a single solid color.
  if (isBicolor !== false && validHexes.length >= 2) {
    return `${validHexes[0]},${validHexes[1]}`;
  }

  return validHexes[0];
}

/**
 * Generates CSS background property value for a swatch.
 * Supports single hex or bicolor linear gradient.
 */
export function getColorBackground(hex?: string, fallback = '#f3f4f6'): string {
  if (!hex) return fallback;

  if (hex.includes(',')) {
    const [c1, c2] = hex.split(',');
    return `linear-gradient(135deg, ${c1.trim()} 50%, ${c2.trim()} 50%)`;
  }

  // If already a gradient or valid CSS
  return hex;
}

export interface ParentColour {
  id: number;
  name: string;
  slug: string;
}

export const CANONICAL_PARENT_COLOURS: Record<string, ParentColour> = {
  black: { id: 89, name: 'Black', slug: 'black' },
  blue: { id: 90, name: 'Blue', slug: 'blue' },
  brown: { id: 92, name: 'Brown', slug: 'brown' },
  green: { id: 91, name: 'Green', slug: 'green' },
  grey: { id: 93, name: 'Grey', slug: 'grey' },
  orange: { id: 110, name: 'Orange', slug: 'orange' },
  pink: { id: 109, name: 'Pink', slug: 'pink' },
  purple: { id: 114, name: 'Purple', slug: 'purple' },
  red: { id: 94, name: 'Red', slug: 'red' },
  tan: { id: 122, name: 'Tan', slug: 'tan' },
  white: { id: 106, name: 'White', slug: 'white' },
  yellow: { id: 113, name: 'Yellow', slug: 'yellow' },
  'full-colour': { id: 119, name: 'Full Colour', slug: 'full-colour' },
};

/**
 * Maps any specific colour name or slug (e.g. 'Aqua', 'Dark Blue', 'Lime', 'Burgundy')
 * to its canonical parent colour in the catalog.
 */
export const PARENT_COLOUR_MAP: Record<string, ParentColour> = {
  // Blue family
  blue: CANONICAL_PARENT_COLOURS.blue,
  'dark-blue': CANONICAL_PARENT_COLOURS.blue,
  'dark blue': CANONICAL_PARENT_COLOURS.blue,
  'light-blue': CANONICAL_PARENT_COLOURS.blue,
  'light blue': CANONICAL_PARENT_COLOURS.blue,
  navy: CANONICAL_PARENT_COLOURS.blue,
  'navy-blue': CANONICAL_PARENT_COLOURS.blue,
  'royal-blue': CANONICAL_PARENT_COLOURS.blue,
  'royal blue': CANONICAL_PARENT_COLOURS.blue,
  aqua: CANONICAL_PARENT_COLOURS.blue,
  cyan: CANONICAL_PARENT_COLOURS.blue,
  teal: CANONICAL_PARENT_COLOURS.blue,
  cobalt: CANONICAL_PARENT_COLOURS.blue,
  sky: CANONICAL_PARENT_COLOURS.blue,
  'sky-blue': CANONICAL_PARENT_COLOURS.blue,
  midnight: CANONICAL_PARENT_COLOURS.blue,
  'midnight-blue': CANONICAL_PARENT_COLOURS.blue,

  // Green family
  green: CANONICAL_PARENT_COLOURS.green,
  lime: CANONICAL_PARENT_COLOURS.green,
  'lime-green': CANONICAL_PARENT_COLOURS.green,
  sage: CANONICAL_PARENT_COLOURS.green,
  'sage-green': CANONICAL_PARENT_COLOURS.green,
  olive: CANONICAL_PARENT_COLOURS.green,
  forest: CANONICAL_PARENT_COLOURS.green,
  'forest-green': CANONICAL_PARENT_COLOURS.green,
  mint: CANONICAL_PARENT_COLOURS.green,
  emerald: CANONICAL_PARENT_COLOURS.green,
  khaki: CANONICAL_PARENT_COLOURS.green,

  // Red family
  red: CANONICAL_PARENT_COLOURS.red,
  burgundy: CANONICAL_PARENT_COLOURS.red,
  wine: CANONICAL_PARENT_COLOURS.red,
  maroon: CANONICAL_PARENT_COLOURS.red,
  ruby: CANONICAL_PARENT_COLOURS.red,
  crimson: CANONICAL_PARENT_COLOURS.red,
  scarlet: CANONICAL_PARENT_COLOURS.red,
  claret: CANONICAL_PARENT_COLOURS.red,

  // Grey family
  grey: CANONICAL_PARENT_COLOURS.grey,
  gray: CANONICAL_PARENT_COLOURS.grey,
  charcoal: CANONICAL_PARENT_COLOURS.grey,
  graphite: CANONICAL_PARENT_COLOURS.grey,
  pewter: CANONICAL_PARENT_COLOURS.grey,
  silver: CANONICAL_PARENT_COLOURS.grey,
  slate: CANONICAL_PARENT_COLOURS.grey,
  ash: CANONICAL_PARENT_COLOURS.grey,

  // Black family
  black: CANONICAL_PARENT_COLOURS.black,
  jet: CANONICAL_PARENT_COLOURS.black,
  anthracite: CANONICAL_PARENT_COLOURS.black,

  // Pink family
  pink: CANONICAL_PARENT_COLOURS.pink,
  'light-pink': CANONICAL_PARENT_COLOURS.pink,
  'light pink': CANONICAL_PARENT_COLOURS.pink,
  rose: CANONICAL_PARENT_COLOURS.pink,
  'rose-pink': CANONICAL_PARENT_COLOURS.pink,
  blush: CANONICAL_PARENT_COLOURS.pink,
  coral: CANONICAL_PARENT_COLOURS.pink,
  fuchsia: CANONICAL_PARENT_COLOURS.pink,
  magenta: CANONICAL_PARENT_COLOURS.pink,

  // Tan family
  tan: CANONICAL_PARENT_COLOURS.tan,
  cognac: CANONICAL_PARENT_COLOURS.tan,
  camel: CANONICAL_PARENT_COLOURS.tan,
  biscuit: CANONICAL_PARENT_COLOURS.tan,
  beige: CANONICAL_PARENT_COLOURS.tan,

  // Brown family
  brown: CANONICAL_PARENT_COLOURS.brown,
  chocolate: CANONICAL_PARENT_COLOURS.brown,
  chestnut: CANONICAL_PARENT_COLOURS.brown,
  toffee: CANONICAL_PARENT_COLOURS.brown,

  // Yellow family
  yellow: CANONICAL_PARENT_COLOURS.yellow,
  mustard: CANONICAL_PARENT_COLOURS.yellow,
  gold: CANONICAL_PARENT_COLOURS.yellow,
  amber: CANONICAL_PARENT_COLOURS.yellow,
  ochre: CANONICAL_PARENT_COLOURS.yellow,

  // Purple family
  purple: CANONICAL_PARENT_COLOURS.purple,
  violet: CANONICAL_PARENT_COLOURS.purple,
  plum: CANONICAL_PARENT_COLOURS.purple,
  lavender: CANONICAL_PARENT_COLOURS.purple,
  lilac: CANONICAL_PARENT_COLOURS.purple,
  amethyst: CANONICAL_PARENT_COLOURS.purple,
  aubergine: CANONICAL_PARENT_COLOURS.purple,

  // Orange family
  orange: CANONICAL_PARENT_COLOURS.orange,
  peach: CANONICAL_PARENT_COLOURS.orange,
  terracotta: CANONICAL_PARENT_COLOURS.orange,
  rust: CANONICAL_PARENT_COLOURS.orange,

  // White family
  white: CANONICAL_PARENT_COLOURS.white,
  cream: CANONICAL_PARENT_COLOURS.white,
  'off-white': CANONICAL_PARENT_COLOURS.white,
  ivory: CANONICAL_PARENT_COLOURS.white,

  // Full colour
  'full-colour': CANONICAL_PARENT_COLOURS['full-colour'],
  'full colour': CANONICAL_PARENT_COLOURS['full-colour'],
};

/**
 * Returns the parent colour for a given term name or slug, or null if unmapped.
 */
export function getParentColour(term: string): ParentColour | null {
  if (!term) return null;
  const key = term.trim().toLowerCase().replace(/\s+/g, '-');
  const direct = PARENT_COLOUR_MAP[key] || PARENT_COLOUR_MAP[term.trim().toLowerCase()];
  if (direct) return direct;

  // Partial match fallback if compound word contains a known parent
  for (const [parentKey, parentColour] of Object.entries(CANONICAL_PARENT_COLOURS)) {
    if (key.includes(parentKey)) {
      return parentColour;
    }
  }

  return null;
}

/**
 * Normalizes a colour slug to its parent colour slug (e.g. 'dark-blue' -> 'blue', 'lime' -> 'green').
 */
export function getParentColourSlug(slug: string): string {
  const parent = getParentColour(slug);
  return parent ? parent.slug : slug.toLowerCase();
}

