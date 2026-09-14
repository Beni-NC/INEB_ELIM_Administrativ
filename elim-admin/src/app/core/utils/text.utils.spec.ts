import { describe, expect, it } from 'vitest';
import { normalizeForSearch } from './text.utils';

describe('normalizeForSearch', () => {
  it('quita diacríticos rumanos (con coma y con cedilla) y pasa a minúsculas', () => {
    expect(normalizeForSearch('Bîrle')).toBe('birle');
    expect(normalizeForSearch('Mitoșeriu')).toBe('mitoseriu');
    expect(normalizeForSearch('Mitoşeriu')).toBe('mitoseriu');
    expect(normalizeForSearch('Istrătoaie Ţurcanu')).toBe('istratoaie turcanu');
  });

  it('recorta espacios y deja intactos los dígitos', () => {
    expect(normalizeForSearch('  Echipa 4 ')).toBe('echipa 4');
  });
});
