import type { AddInput, AddPlan, DeptId, Item } from '../types';
import { normalizeName } from '../categorize/normalize';
import { departmentFor } from '../categorize/dictionary';
import { DEPARTMENTS } from '../categorize/departments';

export function clampInput(input: AddInput): AddInput {
  const qty = Number.isFinite(input.qty) ? Math.max(1, Math.round(input.qty)) : 1;
  return { name: input.name.trim().slice(0, 60), qty, note: input.note.trim().slice(0, 120) };
}

export function planAdd(items: Item[], input: AddInput, learned: DeptId | null): AddPlan {
  const key = normalizeName(input.name);
  const active = items.find((i) => !i.inCart && i.key === key);
  if (active) {
    return { kind: 'update', id: active.id, qty: active.qty + input.qty, note: input.note !== '' ? input.note : active.note };
  }
  const inCart = items.find((i) => i.inCart && i.key === key);
  if (inCart) {
    return { kind: 'update', id: inCart.id, qty: input.qty, note: input.note !== '' ? input.note : inCart.note };
  }
  return { kind: 'create', key, dept: departmentFor(key, learned) };
}

function byCreatedAt(a: Item, b: Item): number {
  if (a.createdAt === b.createdAt) return 0;
  if (a.createdAt === null) return 1;
  if (b.createdAt === null) return -1;
  return a.createdAt - b.createdAt;
}

export function groupByDept(items: Item[]): Array<{ dept: DeptId; items: Item[] }> {
  const active = items.filter((i) => !i.inCart);
  return DEPARTMENTS.map((d) => ({ dept: d.id, items: active.filter((i) => i.dept === d.id).sort(byCreatedAt) }))
    .filter((g) => g.items.length > 0);
}

export function cartItems(items: Item[]): Item[] {
  return items.filter((i) => i.inCart);
}
