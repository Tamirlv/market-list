import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { collection, getDocsFromServer } from 'firebase/firestore';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { auth, db } from '../../src/data/firebase';
import {
  addItem,
  clearRecent,
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
  // The real rules require an allowed, verified Google account; the Auth
  // emulator accepts an unsigned JSON id token as a fake Google credential.
  await signInWithCredential(
    auth,
    GoogleAuthProvider.credential(
      JSON.stringify({ sub: 'test-tamir', email: 'tamirlevi22@gmail.com', email_verified: true }),
    ),
  );
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

  it('clearRecent resets lastBoughtAt only', async () => {
    await add('חלב');
    const [item] = await readItems();
    await setFavorite(item.key, item.name, true);
    await setDept(item, 'frozen', BY);
    await finishShopping([item]);
    const [before] = await readCatalog();
    expect(typeof before.lastBoughtAt).toBe('number');
    await clearRecent(item.key);
    const [after] = await readCatalog();
    expect(after.lastBoughtAt).toBeNull();
    expect(after.isFavorite).toBe(true);
    expect(after.dept).toBe('frozen');
    expect(after.name).toBe(before.name);
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

  it('adds a name containing a slash as one item and one catalog entry', async () => {
    await add('נייר טואלט/מגבות');
    const items = await readItems();
    expect(items).toHaveLength(1);
    expect(items[0].name).toBe('נייר טואלט/מגבות');
    expect(await readCatalog()).toHaveLength(1);
  });

  it('ignores a name with nothing to add instead of throwing', async () => {
    await add('/');
    expect(await readItems()).toHaveLength(0);
    expect(await readCatalog()).toHaveLength(0);
  });

  it('handles names that normalize to reserved doc ids', async () => {
    await add('..');
    expect(await readItems()).toHaveLength(1);
    const catalog = await readCatalog();
    expect(catalog).toHaveLength(1);
    expect(catalog[0].key).toBe('..');
  });

  it('recovers when the item to update was deleted on the server', async () => {
    await add('חלב', 1);
    const stale = await readItems();
    await removeItem(stale[0].id);
    await addItem(stale, await readCatalog(), { name: 'חלב', qty: 2, note: 'x' }, BY);
    const items = await readItems();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe(stale[0].id);
    expect(items[0].qty).toBe(3);
  });

  it('reports listener failures through onError', async () => {
    await signOut(auth);
    try {
      const err = await new Promise<Error>((resolve) => {
        subscribeItems(() => {}, resolve);
      });
      expect(err).toBeInstanceOf(Error);
    } finally {
      await signInWithCredential(
        auth,
        GoogleAuthProvider.credential(
          JSON.stringify({ sub: 'test-tamir', email: 'tamirlevi22@gmail.com', email_verified: true }),
        ),
      );
    }
  });
});
