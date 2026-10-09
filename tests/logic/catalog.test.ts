import { describe, it, expect } from 'vitest';
import { favoritesOf, recentsOf, chipsOf, suggestionsFor } from '../../src/logic/catalog';
import { normalizeName } from '../../src/categorize/normalize';
import type { CatalogEntry } from '../../src/types';

function entry(name: string, p: Partial<CatalogEntry> = {}): CatalogEntry {
  return { key: normalizeName(name), name, dept: null, isFavorite: false, lastBoughtAt: null, ...p };
}

describe('favoritesOf', () => {
  it('returns favorites sorted by Hebrew name', () => {
    const r = favoritesOf([entry('תה', { isFavorite: true }), entry('אורז', { isFavorite: true }), entry('x')]);
    expect(r.map((e) => e.name)).toEqual(['אורז', 'תה']);
  });
});

describe('recentsOf', () => {
  it('caps at 50, newest first, excludes never-bought', () => {
    const cat = Array.from({ length: 60 }, (_, i) => entry('מוצר' + i, { lastBoughtAt: i + 1 }));
    cat.push(entry('חדש', { lastBoughtAt: null }));
    const r = recentsOf(cat);
    expect(r).toHaveLength(50);
    expect(r[0].lastBoughtAt).toBe(60);
    expect(r.every((e) => e.lastBoughtAt !== null)).toBe(true);
  });
});

describe('chipsOf', () => {
  it('caps at 8 and keeps favorites out of recents', () => {
    const cat = [
      ...Array.from({ length: 10 }, (_, i) => entry('מועדף' + i, { isFavorite: true, lastBoughtAt: 100 + i })),
      ...Array.from({ length: 12 }, (_, i) => entry('אחר' + i, { lastBoughtAt: i + 1 })),
    ];
    const { favorites, recents } = chipsOf(cat);
    expect(favorites).toHaveLength(8);
    expect(recents).toHaveLength(8);
    expect(recents.some((e) => e.isFavorite)).toBe(false);
  });
});

describe('suggestionsFor', () => {
  const cat = [
    entry('חלה', { lastBoughtAt: 900 }),
    entry('חלב', { isFavorite: true, lastBoughtAt: 100 }),
    entry('שוקולד חלב', { lastBoughtAt: null }),
    entry('גזר'),
  ];
  it('puts favorites first, then recency, with contains matching', () => {
    expect(suggestionsFor(cat, 'חל').slice(0, 3).map((e) => e.name)).toEqual(['חלב', 'חלה', 'שוקולד חלב']);
  });
  it('returns [] for blank query and respects limit', () => {
    expect(suggestionsFor(cat, '  ')).toEqual([]);
    expect(suggestionsFor(cat, 'חל', 1)).toHaveLength(1);
  });
});

describe('suggestionsFor with built-in basics', () => {
  it('suggests basic products from an empty catalog', () => {
    const r = suggestionsFor([], 'עגב');
    expect(r.map((e) => e.name)).toContain('עגבניות');
    const q = normalizeName('עגב');
    expect(r.every((e) => e.key.includes(q))).toBe(true);
    expect(r[0]).toMatchObject({ dept: 'produce', isFavorite: false, lastBoughtAt: null });
  });
  it('puts catalog matches before basics', () => {
    const r = suggestionsFor([entry('עגבניות שרי מיוחדות', { lastBoughtAt: 5 })], 'עגב');
    expect(r[0].name).toBe('עגבניות שרי מיוחדות');
    expect(r.length).toBeGreaterThan(1);
  });
  it('does not duplicate a basic already in the catalog', () => {
    const r = suggestionsFor([entry('עגבניות', { lastBoughtAt: 5 })], 'עגב');
    expect(r.filter((e) => e.key === normalizeName('עגבניות'))).toHaveLength(1);
    expect(r[0].lastBoughtAt).toBe(5);
  });
  it('ranks starts-with before contains among basics and respects limit', () => {
    const r = suggestionsFor([], 'חל', 3);
    expect(r.length).toBeLessThanOrEqual(3);
    const q = normalizeName('חל');
    const firstContains = r.findIndex((e) => !e.key.startsWith(q));
    if (firstContains >= 0) expect(r.slice(firstContains).every((e) => !e.key.startsWith(q))).toBe(true);
  });
});
