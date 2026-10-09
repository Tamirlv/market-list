import { describe, it, expect } from 'vitest';
import { clampInput, planAdd, groupByDept, cartItems } from '../../src/logic/list';
import { normalizeName } from '../../src/categorize/normalize';
import type { Item } from '../../src/types';

function item(p: Partial<Item> & { name: string }): Item {
  return { id: p.name, key: normalizeName(p.name), qty: 1, note: '', dept: 'other', inCart: false,
    createdAt: 1, updatedAt: 1, updatedBy: 'u', ...p };
}

describe('planAdd', () => {
  it('merges quantity into an active match', () => {
    const items = [item({ id: 'a', name: 'חלב' })];
    expect(planAdd(items, { name: 'חלב', qty: 2, note: '' }, null)).toEqual({ kind: 'update', id: 'a', qty: 3, note: '' });
  });
  it('uses the input note when given, keeps the existing one otherwise', () => {
    const items = [item({ id: 'a', name: 'חלב', note: 'קטן' })];
    expect(planAdd(items, { name: 'חלב', qty: 1, note: '3%' }, null)).toMatchObject({ note: '3%' });
    expect(planAdd(items, { name: 'חלב', qty: 1, note: '' }, null)).toMatchObject({ note: 'קטן' });
  });
  it('merges across spelling variants', () => {
    const items = [item({ id: 'a', name: 'עגבניות' })];
    expect(planAdd(items, { name: 'עגבניה', qty: 1, note: '' }, null)).toMatchObject({ kind: 'update', id: 'a', qty: 2 });
  });
  it('does not assume the input is trimmed', () => {
    const items = [item({ id: 'a', name: 'חלב' })];
    expect(planAdd(items, { name: '  חלב ', qty: 1, note: '' }, null)).toMatchObject({ kind: 'update', id: 'a' });
  });
  it('replaces quantity for an in-cart match', () => {
    const items = [item({ id: 'e', name: 'ביצים', qty: 4, inCart: true })];
    expect(planAdd(items, { name: 'ביצים', qty: 1, note: '' }, null)).toMatchObject({ kind: 'update', id: 'e', qty: 1 });
  });
  it('prefers the active item over an in-cart one with the same key', () => {
    const items = [item({ id: 'c', name: 'חלב', qty: 5, inCart: true }), item({ id: 'a', name: 'חלב', qty: 1 })];
    expect(planAdd(items, { name: 'חלב', qty: 1, note: '' }, null)).toMatchObject({ id: 'a', qty: 2 });
  });
  it('creates with the dictionary department, overridden by learned', () => {
    expect(planAdd([], { name: "קוטג'", qty: 1, note: '' }, null)).toEqual({ kind: 'create', key: normalizeName("קוטג'"), dept: 'dairy' });
    expect(planAdd([], { name: "קוטג'", qty: 1, note: '' }, 'pantry')).toMatchObject({ kind: 'create', dept: 'pantry' });
  });
});

describe('clampInput', () => {
  it('clamps lengths and quantity', () => {
    const r = clampInput({ name: 'א'.repeat(80), qty: 0, note: 'ב'.repeat(200) });
    expect(r.name).toHaveLength(60);
    expect(r.qty).toBe(1);
    expect(r.note).toHaveLength(120);
  });
  it('trims and rounds', () => {
    expect(clampInput({ name: '  חלב ', qty: 2.6, note: ' x ' })).toEqual({ name: 'חלב', qty: 3, note: 'x' });
  });
  it('handles NaN quantity', () => {
    expect(clampInput({ name: 'a', qty: NaN, note: '' }).qty).toBe(1);
  });
});

describe('groupByDept / cartItems', () => {
  it('orders departments, skips empty and in-cart, sorts by createdAt with null last', () => {
    const items = [
      item({ id: '1', name: 'חלב', dept: 'dairy', createdAt: 5 }),
      item({ id: '2', name: 'גזר', dept: 'produce', createdAt: null }),
      item({ id: '3', name: 'מלפפון', dept: 'produce', createdAt: 2 }),
      item({ id: '4', name: 'סבון', dept: 'cleaning' }),
      item({ id: '5', name: 'ביצים', dept: 'dairy', inCart: true }),
    ];
    const g = groupByDept(items);
    expect(g.map((x) => x.dept)).toEqual(['produce', 'dairy', 'cleaning']);
    expect(g[0].items.map((i) => i.id)).toEqual(['3', '2']);
    expect(g[1].items.map((i) => i.id)).toEqual(['1']);
    expect(cartItems(items).map((i) => i.id)).toEqual(['5']);
  });
});
