import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  writeBatch,
  type DocumentData,
  type DocumentSnapshot,
} from 'firebase/firestore';
import { db } from './firebase';
import { normalizeName } from '../categorize/normalize';
import { clampInput, planAdd } from '../logic/list';
import type { AddInput, CatalogEntry, DeptId, Item } from '../types';

const itemsCol = () => collection(db, 'households', 'main', 'items');
const catalogCol = () => collection(db, 'households', 'main', 'catalog');
const itemDoc = (id: string) => doc(db, 'households', 'main', 'items', id);

// Catalog keys are normalized names. Ids Firestore rejects (empty, '.', '..', leading '~',
// reserved '__*') get a '~' prefix + percent-encoding; every other key is
// used as-is so existing data stays valid.
export function catalogDocId(key: string): string {
  const invalid = key === '' || key === '.' || key === '..' || key.startsWith('__') || key.startsWith('~');
  return invalid ? '~' + encodeURIComponent(key) : key;
}
function catalogKeyOf(id: string): string {
  return id.startsWith('~') ? decodeURIComponent(id.slice(1)) : id;
}
const catalogDoc = (key: string) => doc(db, 'households', 'main', 'catalog', catalogDocId(key));

function ms(v: unknown): number | null {
  return v instanceof Timestamp ? v.toMillis() : null;
}

function readData(snap: DocumentSnapshot): DocumentData {
  return snap.data({ serverTimestamps: 'estimate' }) ?? {};
}

function toItem(snap: DocumentSnapshot): Item {
  const d = readData(snap);
  return {
    id: snap.id,
    name: d.name,
    key: d.key,
    qty: d.qty,
    note: d.note ?? '',
    dept: d.dept,
    inCart: d.inCart,
    createdAt: ms(d.createdAt),
    updatedAt: ms(d.updatedAt),
    updatedBy: d.updatedBy ?? '',
  };
}

function toCatalogEntry(snap: DocumentSnapshot): CatalogEntry {
  const d = readData(snap);
  return {
    key: catalogKeyOf(snap.id),
    name: d.name,
    dept: d.dept ?? null,
    isFavorite: d.isFavorite === true,
    lastBoughtAt: ms(d.lastBoughtAt),
  };
}

export function subscribeItems(cb: (items: Item[]) => void, onError?: (e: Error) => void): () => void {
  return onSnapshot(itemsCol(), (snap) => cb(snap.docs.map(toItem)), (e) => onError?.(e));
}

export function subscribeCatalog(
  cb: (entries: CatalogEntry[]) => void,
  onError?: (e: Error) => void,
): () => void {
  return onSnapshot(catalogCol(), (snap) => cb(snap.docs.map(toCatalogEntry)), (e) => onError?.(e));
}

export async function addItem(
  items: Item[],
  catalog: CatalogEntry[],
  input: AddInput,
  by: string,
): Promise<void> {
  const clean = clampInput(input);
  if (normalizeName(clean.name) === '') return;
  const plan = planAdd(items, clean, learnedDept(catalog, clean.name));
  const batch = writeBatch(db);

  if (plan.kind === 'update') {
    // set+merge (not update) so it is last-write-wins if the other phone
    // already deleted this item; it then simply gets re-created.
    const existing = items.find((i) => i.id === plan.id)!;
    batch.set(
      itemDoc(plan.id),
      {
        name: existing.name,
        key: existing.key,
        qty: plan.qty,
        note: plan.note,
        dept: existing.dept,
        inCart: false,
        createdAt: existing.createdAt === null ? serverTimestamp() : Timestamp.fromMillis(existing.createdAt),
        updatedAt: serverTimestamp(),
        updatedBy: by,
      },
      { merge: true },
    );
    batch.set(catalogDoc(existing.key), { name: clean.name }, { merge: true });
  } else {
    batch.set(doc(itemsCol()), {
      name: clean.name,
      key: plan.key,
      qty: clean.qty,
      note: clean.note,
      dept: plan.dept,
      inCart: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      updatedBy: by,
    });
    batch.set(catalogDoc(plan.key), { name: clean.name }, { merge: true });
  }
  await batch.commit();
}

function learnedDept(catalog: CatalogEntry[], name: string): DeptId | null {
  const key = normalizeName(name);
  return catalog.find((c) => c.key === key)?.dept ?? null;
}

export async function toggleCart(id: string, inCart: boolean, by: string): Promise<void> {
  await updateDoc(itemDoc(id), { inCart, updatedAt: serverTimestamp(), updatedBy: by });
}

export async function removeItem(id: string): Promise<void> {
  await deleteDoc(itemDoc(id));
}

export async function restoreItem(item: Item): Promise<void> {
  await setDoc(itemDoc(item.id), {
    name: item.name,
    key: item.key,
    qty: item.qty,
    note: item.note,
    dept: item.dept,
    inCart: item.inCart,
    createdAt: item.createdAt === null ? serverTimestamp() : Timestamp.fromMillis(item.createdAt),
    updatedAt: item.updatedAt === null ? serverTimestamp() : Timestamp.fromMillis(item.updatedAt),
    updatedBy: item.updatedBy,
  });
}

export async function finishShopping(cart: Item[]): Promise<void> {
  const batch = writeBatch(db);
  for (const item of cart) {
    batch.delete(itemDoc(item.id));
    batch.set(catalogDoc(item.key), { name: item.name, lastBoughtAt: serverTimestamp() }, { merge: true });
  }
  await batch.commit();
}

export async function setFavorite(key: string, name: string, isFavorite: boolean): Promise<void> {
  await setDoc(catalogDoc(key), { name, isFavorite }, { merge: true });
}

export async function clearRecent(key: string): Promise<void> {
  await setDoc(catalogDoc(key), { lastBoughtAt: null }, { merge: true });
}

export async function setDept(item: Item, dept: DeptId, by: string): Promise<void> {
  const batch = writeBatch(db);
  batch.update(itemDoc(item.id), { dept, updatedAt: serverTimestamp(), updatedBy: by });
  batch.set(catalogDoc(item.key), { name: item.name, dept }, { merge: true });
  await batch.commit();
}

export async function updateItemDetails(id: string, qty: number, note: string, by: string): Promise<void> {
  await updateDoc(itemDoc(id), { qty, note, updatedAt: serverTimestamp(), updatedBy: by });
}
