/**
 * Color and hex parsing helpers for product swatches and customizer styling.
 */

/**
 * Normalizes raw hex strings from WordPress metadata.
 * Supports:
 * - Single hex with or without leading hash (e.g. '3D3935' or '#3D3935')
 * - Bicolor formats (e.g. '3D3935 / AF272F', '#3D3935-#AF272F', '3D3935-AF272F', '#112233, #445566')
 * Returns either '#rrggbb' or '#rrggbb,#rrggbb' (comma-separated for bicolors).
 */
export function parseHexValue(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;

  // Extract all valid 3 or 6 digit hex segments
  const matches = raw.match(/#?[0-9a-fA-F]{6}|#?[0-9a-fA-F]{3}/g);
  if (!matches || matches.length === 0) return null;

  const clean = matches.map((m) =>
    m.startsWith('#') ? m.toLowerCase() : `#${m.toLowerCase()}`
  );

  // If two or more colors (bicolor product), combine first two with comma
  if (clean.length >= 2) {
    return `${clean[0]},${clean[1]}`;
  }

  return clean[0];
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
