import { describe, it, expect } from 'vitest';
import { normalizeName } from '../../src/categorize/normalize';
import { DEPARTMENTS } from '../../src/categorize/departments';
import { DICTIONARY, departmentFor } from '../../src/categorize/dictionary';

const dept = (s: string) => departmentFor(normalizeName(s), null);

describe('departmentFor', () => {
  it('categorizes known products', () => {
    expect(dept('חלב')).toBe('dairy');
    expect(dept('עגבניות')).toBe('produce');
    expect(dept('נוזל כלים')).toBe('cleaning');
    expect(dept('במבה')).toBe('snacks');
    expect(dept('חיתולים')).toBe('baby');
    expect(dept('לחם')).toBe('bakery');
    expect(dept('חזה עוף')).toBe('meat');
    expect(dept("קוטג'")).toBe('dairy');
  });
  it('falls back to the first word', () => {
    expect(dept('גבינה צהובה 28%')).toBe('dairy');
  });
  it('returns other for unknown', () => {
    expect(dept('פריט לא קיים')).toBe('other');
  });
  it('learned wins', () => {
    expect(departmentFor(normalizeName('חלב'), 'frozen')).toBe('frozen');
  });
});

describe('dictionary integrity', () => {
  const ids = new Set(DEPARTMENTS.map((d) => d.id));
  it('departments are in spec order and complete', () => {
    expect(DEPARTMENTS.map((d) => d.id)).toEqual([
      'produce', 'bakery', 'dairy', 'meat', 'fish', 'pantry', 'spices',
      'snacks', 'drinks', 'frozen', 'cleaning', 'toiletries', 'baby', 'other',
    ]);
  });
  it('every entry maps to a valid DeptId, >= 300 entries', () => {
    let total = 0;
    for (const [d, names] of Object.entries(DICTIONARY)) {
      expect(ids.has(d as never)).toBe(true);
      if (d !== 'other') expect(names.length).toBeGreaterThan(0);
      total += names.length;
    }
    expect(total).toBeGreaterThanOrEqual(300);
  });
  it('no normalized key under two departments', () => {
    const seen = new Map<string, string>();
    for (const [d, names] of Object.entries(DICTIONARY)) {
      for (const n of names) {
        const k = normalizeName(n);
        if (seen.has(k) && seen.get(k) !== d) throw new Error(`${n}: ${seen.get(k)} vs ${d}`);
        seen.set(k, d);
      }
    }
  });
});
