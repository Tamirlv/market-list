import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { collection, getDocsFromServer } from 'firebase/firestore';
import { db } from '../../src/data/firebase';
import {
  addItem,
  finishShopping,
  removeItem,
  restoreItem,
  setDept,
  setFavorite,
  subscribeCatalog,
  subscribeItems,
} from '../../src/data/repo';
import type { CatalogEntry, Item } from '../../src/types';

const BY = 'a@example.com';

beforeAll(async () => {
  // Task 5: sign in to the Auth emulator here.
});

beforeEach(async () => {
  const res = await fetch(
    'http://127.0.0.1:8080/emulator/v1/projects/demo-shopping-list/databases/(default)/documents',
    { method: 'DELETE' },
  );
  expect(res.ok).toBe(true);
});

// Refresh the local cache from the server so snapshots never reflect stale docs.
async function sync(): Promise<void> {
  await getDocsFromServer(collection(db, 'households', 'main', 'items'));
  await getDocsFromServer(collection(db, 'households', 'main', 'catalog'));
}

async function readItems(): Promise<Item[]> {
  await sync();
  return new Promise((resolve) => {
    const unsub = subscribeItems((items) => {
      unsub();
      resolve(items);
    });
  });
}

async function readCatalog(): Promise<CatalogEntry[]> {
  await sync();
  return new Promise((resolve) => {
    const unsub = subscribeCatalog((entries) => {
      unsub();
      resolve(entries);
    });
  });
}

async function add(name: string, qty = 1, note = ''): Promise<void> {
  await addItem(await readItems(), await readCatalog(), { name, qty, note }, BY);
}

describe('repo', () => {
  it('merges repeated adds into one item and creates a catalog entry', async () => {
    await add('חלב', 1);
    await add('חלב', 2);
    const items = await readItems();
    expect(items).toHaveLength(1);
    expect(items[0].qty).toBe(3);
    expect(items[0].updatedBy).toBe(BY);
    expect(typeof items[0].createdAt).toBe('number');
    const catalog = await readCatalog();
    expect(catalog).toHaveLength(1);
    expect(catalog[0].key).toBe(items[0].key);
    expect(catalog[0].isFavorite).toBe(false);
  });

  it('keeps isFavorite when the product is added again', async () => {
    await add('חלב');
    const [entry] = await readCatalog();
    await setFavorite(entry.key, entry.name, true);
    await removeItem((await readItems())[0].id);
    await add('חלב');
    const [after] = await readCatalog();
    expect(after.isFavorite).toBe(true);
    expect(after.dept).toBeNull();
    expect(after.lastBoughtAt).toBeNull();
  });

  it('does not clobber catalog fields when addItem gets a stale empty catalog', async () => {
    await add('חלב');
    const [item] = await readItems();
    await setFavorite(item.key, item.name, true);
    await setDept(item, 'frozen', BY);
    await finishShopping([item]);
    const [before] = await readCatalog();
    expect(before.isFavorite).toBe(true);
    expect(before.dept).toBe('frozen');
    expect(typeof before.lastBoughtAt).toBe('number');

    await addItem(await readItems(), [], { name: 'חלב', qty: 1, note: '' }, BY);

    const [after] = await readCatalog();
    expect(after).toEqual(before);
  });

  it('learns a department chosen with setDept', async () => {
    await add('גלידה');
    const [item] = await readItems();
    await setDept(item, 'frozen', BY);
    await removeItem(item.id);
    await add('גלידה');
    const [again] = await readItems();
    expect(again.dept).toBe('frozen');
  });

  it('finishShopping deletes cart items and stamps lastBoughtAt', async () => {
    await add('חלב');
    await add('לחם');
    const items = await readItems();
    await finishShopping(items);
    expect(await readItems()).toHaveLength(0);
    const catalog = await readCatalog();
    expect(catalog).toHaveLength(2);
    for (const c of catalog) expect(typeof c.lastBoughtAt).toBe('number');
    expect((await getDocsFromServer(collection(db, 'households', 'main', 'items'))).size).toBe(0);
  });

  it('restoreItem brings a removed item back with the same id and fields', async () => {
    await add('חלב', 2, 'דל לקטוז');
    const [item] = await readItems();
    await removeItem(item.id);
    expect(await readItems()).toHaveLength(0);
    await restoreItem(item);
    const [back] = await readItems();
    expect(back).toEqual(item);
  });
});
