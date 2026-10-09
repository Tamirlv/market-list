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
    expect(suggestionsFor(cat, 'חל').map((e) => e.name)).toEqual(['חלב', 'חלה', 'שוקולד חלב']);
  });
  it('returns [] for blank query and respects limit', () => {
    expect(suggestionsFor(cat, '  ')).toEqual([]);
    expect(suggestionsFor(cat, 'חל', 1)).toHaveLength(1);
  });
});
