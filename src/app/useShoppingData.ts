import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AddInput, CatalogEntry, DeptId, Item } from '../types';
import type { AuthUser } from '../auth/useAuth';
import { cartItems } from '../logic/list';
import * as repo from '../data/repo';

export interface ShoppingActions {
  add(input: AddInput): void;
  toggle(item: Item): void;
  remove(item: Item): void;
  undoRemove(): void;
  finish(): void;
  setFavorite(key: string, name: string, fav: boolean): void;
  setDept(item: Item, dept: DeptId): void;
}

export interface ShoppingData {
  items: Item[];
  catalog: CatalogEntry[];
  actions: ShoppingActions;
  error: string | null;
  clearError(): void;
}

const ERROR_MESSAGE = 'משהו השתבש, נסו שוב';

export function useShoppingData(user: AuthUser): ShoppingData {
  const [items, setItems] = useState<Item[]>([]);
  const [catalog, setCatalog] = useState<CatalogEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const lastRemoved = useRef<Item | null>(null);
  const itemsRef = useRef(items);
  const catalogRef = useRef(catalog);
  itemsRef.current = items;
  catalogRef.current = catalog;
  const by = user.firstName;

  useEffect(() => {
    const u1 = repo.subscribeItems(setItems);
    const u2 = repo.subscribeCatalog(setCatalog);
    return () => {
      u1();
      u2();
    };
  }, []);

  const run = useCallback((p: Promise<void>) => {
    p.catch(() => setError(ERROR_MESSAGE));
  }, []);

  const actions = useMemo<ShoppingActions>(
    () => ({
      add: (input) => run(repo.addItem(itemsRef.current, catalogRef.current, input, by)),
      toggle: (item) => run(repo.toggleCart(item.id, !item.inCart, by)),
      remove: (item) => {
        lastRemoved.current = item;
        run(repo.removeItem(item.id));
      },
      undoRemove: () => {
        const item = lastRemoved.current;
        if (!item) return;
        lastRemoved.current = null;
        run(repo.restoreItem(item));
      },
      finish: () => run(repo.finishShopping(cartItems(itemsRef.current))),
      setFavorite: (key, name, fav) => run(repo.setFavorite(key, name, fav)),
      setDept: (item, dept) => run(repo.setDept(item, dept, by)),
    }),
    [by, run],
  );

  const clearError = useCallback(() => setError(null), []);
  return { items, catalog, actions, error, clearError };
}
