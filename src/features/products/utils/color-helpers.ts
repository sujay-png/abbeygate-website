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

  // If two or more colors (bicolor product), combine first two with comma
  if (validHexes.length >= 2) {
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
