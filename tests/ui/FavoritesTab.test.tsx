import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, afterEach } from 'vitest';
import FavoritesTab from '../../src/ui/FavoritesTab';
import type { CatalogEntry } from '../../src/types';

const cat: CatalogEntry[] = [
  { key: 'חלב', name: 'חלב', dept: 'dairy', isFavorite: true, lastBoughtAt: 1 },
  { key: 'לחם', name: 'לחם', dept: 'bakery', isFavorite: true, lastBoughtAt: null },
  { key: 'שוקולד', name: 'שוקולד', dept: null, isFavorite: false, lastBoughtAt: 5 },
];
const setup = (activeKeys = new Set<string>()) => {
  const onAdd = vi.fn();
  const onSetFavorite = vi.fn();
  render(<FavoritesTab catalog={cat} activeKeys={activeKeys} onAdd={onAdd} onSetFavorite={onSetFavorite} />);
  return { onAdd, onSetFavorite };
};
afterEach(() => vi.useRealTimers());

describe('FavoritesTab', () => {
  it('lists only favorites', () => {
    setup();
    expect(screen.getByText('חלב')).toBeInTheDocument();
    expect(screen.queryByText('שוקולד')).toBeNull();
  });

  it('tap adds and shows נוסף ✓ briefly', async () => {
    const { onAdd } = setup();
    await userEvent.click(screen.getByRole('button', { name: /חלב/ }));
    expect(onAdd).toHaveBeenCalledWith({ name: 'חלב', qty: 1, note: '' });
    expect(screen.getByText('נוסף ✓')).toBeInTheDocument();
  });

  it('נוסף ✓ disappears after 1.5s', () => {
    vi.useFakeTimers();
    setup();
    act(() => screen.getByRole('button', { name: /חלב/ }).click());
    expect(screen.getByText('נוסף ✓')).toBeInTheDocument();
    act(() => { vi.advanceTimersByTime(1600); });
    expect(screen.queryByText('נוסף ✓')).toBeNull();
  });

  it('star toggles favorite without adding', async () => {
    const { onAdd, onSetFavorite } = setup();
    await userEvent.click(screen.getAllByRole('button', { name: 'הסר ממועדפים' })[0]);
    expect(onSetFavorite).toHaveBeenCalledWith('חלב', 'חלב', false);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('marks rows already on the list', () => {
    setup(new Set(['חלב']));
    expect(screen.getAllByText('ברשימה ✓')).toHaveLength(1);
  });

  it('empty state', () => {
    render(<FavoritesTab catalog={[]} activeKeys={new Set()} onAdd={vi.fn()} onSetFavorite={vi.fn()} />);
    expect(screen.getByText('עוד אין מועדפים — סמנו ⭐ בהחלקה')).toBeInTheDocument();
  });
});
