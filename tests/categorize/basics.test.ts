import { describe, it, expect } from 'vitest';
import { BASIC_PRODUCTS } from '../../src/categorize/basics';
import { departmentFor } from '../../src/categorize/dictionary';
import { normalizeName } from '../../src/categorize/normalize';

describe('BASIC_PRODUCTS', () => {
  it('has roughly 200 entries', () => {
    expect(BASIC_PRODUCTS.length).toBeGreaterThanOrEqual(180);
    expect(BASIC_PRODUCTS.length).toBeLessThanOrEqual(220);
  });
  it('has unique normalized keys', () => {
    const seen = new Map<string, string>();
    for (const p of BASIC_PRODUCTS) {
      const k = normalizeName(p.name);
      if (seen.has(k)) throw new Error(`${p.name} collides with ${seen.get(k)}`);
      seen.set(k, p.name);
    }
  });
  it('agrees with the auto-categorization dictionary', () => {
    for (const p of BASIC_PRODUCTS) {
      expect(departmentFor(normalizeName(p.name), null), p.name).toBe(p.dept);
    }
  });
  it('never uses the other department', () => {
    expect(BASIC_PRODUCTS.some((p) => p.dept === 'other')).toBe(false);
  });
});
