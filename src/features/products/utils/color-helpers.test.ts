import { describe, it, expect } from 'vitest';
import { parseHexValue, getColorBackground, isBicolorProduct } from './color-helpers';

describe('isBicolorProduct', () => {
  it('identifies genuine bicolor/horizon products', () => {
    expect(isBicolorProduct('Dorchester Horizon Quarto Desk Diary, Week to View, Black-Red')).toBe(true);
    expect(isBicolorProduct('Dorchester Bicolour Quarto Desk Diary, Week to View, Black-Purple')).toBe(true);
    expect(isBicolorProduct('Dorchester Bicolor Pocket Diary, Week to View, Blue- Royal Blue')).toBe(true);
  });

  it('identifies single-color products as false', () => {
    expect(isBicolorProduct('Harrogate A5 Desk Diary, Day Per Page, Burgundy')).toBe(false);
    expect(isBicolorProduct('Richmond A5 Desk Diary, Week to View, Burgundy')).toBe(false);
    expect(isBicolorProduct('Dorchester Pocket Diary, Week to View, Red')).toBe(false);
  });
});

describe('parseHexValue', () => {
  it('parses 6-digit hex without #', () => {
    expect(parseHexValue('3D3935')).toBe('#3d3935');
  });

  it('parses 6-digit hex with #', () => {
    expect(parseHexValue('#3D3935')).toBe('#3d3935');
  });

  it('parses slash-separated bicolor when isBicolor is true or unspecified', () => {
    expect(parseHexValue('3F2021 / BA0C2F')).toBe('#3f2021,#ba0c2f');
    expect(parseHexValue('3F2021 / BA0C2F', true)).toBe('#3f2021,#ba0c2f');
  });

  it('extracts only primary single solid hex when isBicolor is false', () => {
    expect(parseHexValue('6A3735 / B83A4B', false)).toBe('#6a3735');
    expect(parseHexValue('3F2021 / BA0C2F', false)).toBe('#3f2021');
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
