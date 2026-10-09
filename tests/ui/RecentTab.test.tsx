import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import RecentTab from '../../src/ui/RecentTab';
import type { CatalogEntry } from '../../src/types';

const now = Date.now();
const cat: CatalogEntry[] = [
  { key: 'חלב', name: 'חלב', dept: 'dairy', isFavorite: false, lastBoughtAt: now - 3 * 3_600_000 },
  { key: 'לחם', name: 'לחם', dept: 'bakery', isFavorite: true, lastBoughtAt: now - 2 * 86_400_000 },
  { key: 'עגבניה', name: 'עגבניה', dept: null, isFavorite: false, lastBoughtAt: null },
];
const setup = (activeKeys = new Set<string>()) => {
  const onAdd = vi.fn();
  const onSetFavorite = vi.fn();
  render(<RecentTab catalog={cat} activeKeys={activeKeys} onAdd={onAdd} onSetFavorite={onSetFavorite} />);
  return { onAdd, onSetFavorite };
};

describe('RecentTab', () => {
  it('lists bought items, newest first, with relative time', () => {
    setup();
    expect(screen.queryByText('עגבניה')).toBeNull();
    const names = screen.getAllByText(/^(חלב|לחם)$/).map((n) => n.textContent);
    expect(names).toEqual(['חלב', 'לחם']);
    expect(screen.getByText("לפני 3 שע'")).toBeInTheDocument();
    expect(screen.getByText('לפני 2 ימים')).toBeInTheDocument();
  });

  it('tap adds and shows נוסף ✓', async () => {
    const { onAdd } = setup();
    await userEvent.click(screen.getByRole('button', { name: /חלב/ }));
    expect(onAdd).toHaveBeenCalledWith({ name: 'חלב', qty: 1, note: '' });
    expect(screen.getByText('נוסף ✓')).toBeInTheDocument();
  });

  it('star shows state and toggles without adding', async () => {
    const { onAdd, onSetFavorite } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'הוסף למועדפים' }));
    expect(onSetFavorite).toHaveBeenCalledWith('חלב', 'חלב', true);
    await userEvent.click(screen.getByRole('button', { name: 'הסר ממועדפים' }));
    expect(onSetFavorite).toHaveBeenCalledWith('לחם', 'לחם', false);
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('marks rows already on the list', () => {
    setup(new Set(['לחם']));
    expect(screen.getAllByText('ברשימה ✓')).toHaveLength(1);
  });

  it('empty state', () => {
    render(<RecentTab catalog={[]} activeKeys={new Set()} onAdd={vi.fn()} onSetFavorite={vi.fn()} />);
    expect(screen.getByText('עוד לא סיימתם קנייה')).toBeInTheDocument();
  });
});
