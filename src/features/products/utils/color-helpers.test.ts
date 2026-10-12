import { describe, it, expect } from 'vitest';
import { parseHexValue, getColorBackground } from './color-helpers';

describe('parseHexValue', () => {
  it('parses 6-digit hex without #', () => {
    expect(parseHexValue('3D3935')).toBe('#3d3935');
  });

  it('parses 6-digit hex with #', () => {
    expect(parseHexValue('#3D3935')).toBe('#3d3935');
  });

  it('parses slash-separated bicolor (as currently in WordPress)', () => {
    expect(parseHexValue('3F2021 / BA0C2F')).toBe('#3f2021,#ba0c2f');
  });

  it('parses hyphen-separated bicolor with hashes', () => {
    expect(parseHexValue('#3F2021-#BA0C2F')).toBe('#3f2021,#ba0c2f');
  });

  it('parses hyphen-separated bicolor without hashes', () => {
    expect(parseHexValue('3F2021-BA0C2F')).toBe('#3f2021,#ba0c2f');
  });

  it('parses comma-separated bicolor', () => {
    expect(parseHexValue('#112233, #445566')).toBe('#112233,#445566');
  });

  it('returns null for empty or invalid input', () => {
    expect(parseHexValue(null)).toBeNull();
    expect(parseHexValue('')).toBeNull();
    expect(parseHexValue('invalid')).toBeNull();
  });
});

describe('getColorBackground', () => {
  it('returns solid hex when single color', () => {
    expect(getColorBackground('#3d3935')).toBe('#3d3935');
  });

  it('returns linear-gradient for comma-separated bicolor', () => {
    expect(getColorBackground('#3f2021,#ba0c2f')).toBe('linear-gradient(135deg, #3f2021 50%, #ba0c2f 50%)');
  });

  it('falls back when hex is undefined', () => {
    expect(getColorBackground(undefined, '#fff')).toBe('#fff');
  });
});
