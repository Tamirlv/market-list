import type { CatalogEntry } from '../types';
import { normalizeName } from '../categorize/normalize';
import { BASIC_PRODUCTS } from '../categorize/basics';

function byRecency(a: CatalogEntry, b: CatalogEntry): number {
  if (a.lastBoughtAt === b.lastBoughtAt) return 0;
  if (a.lastBoughtAt === null) return 1;
  if (b.lastBoughtAt === null) return -1;
  return b.lastBoughtAt - a.lastBoughtAt;
}

export function favoritesOf(catalog: CatalogEntry[]): CatalogEntry[] {
  return catalog.filter((e) => e.isFavorite).sort((a, b) => a.name.localeCompare(b.name, 'he'));
}

export function recentsOf(catalog: CatalogEntry[], limit = 50): CatalogEntry[] {
  return catalog.filter((e) => e.lastBoughtAt !== null).sort(byRecency).slice(0, limit);
}

export function chipsOf(catalog: CatalogEntry[]): { favorites: CatalogEntry[]; recents: CatalogEntry[] } {
  return {
    favorites: favoritesOf(catalog).slice(0, 8),
    recents: recentsOf(catalog.filter((e) => !e.isFavorite)).slice(0, 8),
  };
}

const BASIC_ENTRIES: CatalogEntry[] = BASIC_PRODUCTS.map((p) => ({
  key: normalizeName(p.name),
  name: p.name,
  dept: p.dept,
  isFavorite: false,
  lastBoughtAt: null,
}));

export function suggestionsFor(catalog: CatalogEntry[], query: string, limit = 6): CatalogEntry[] {
  const q = normalizeName(query);
  if (q === '') return [];
  const fromCatalog = catalog
    .filter((e) => e.key.startsWith(q) || e.key.includes(q))
    .sort((a, b) => Number(b.isFavorite) - Number(a.isFavorite) || byRecency(a, b))
    .slice(0, limit);
  if (fromCatalog.length >= limit) return fromCatalog;
  const known = new Set(catalog.map((e) => e.key));
  const matches = BASIC_ENTRIES.filter((e) => !known.has(e.key) && e.key.includes(q));
  const ordered = [...matches.filter((e) => e.key.startsWith(q)), ...matches.filter((e) => !e.key.startsWith(q))];
  return [...fromCatalog, ...ordered.slice(0, limit - fromCatalog.length)];
}
