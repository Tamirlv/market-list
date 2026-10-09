import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import AddSheet from '../../src/ui/AddSheet';
import type { CatalogEntry } from '../../src/types';

const entry = (name: string, o: Partial<CatalogEntry> = {}): CatalogEntry => ({
  key: name, name, dept: null, isFavorite: false, lastBoughtAt: null, ...o,
});
const catalog = [entry('חלב', { isFavorite: true }), entry('חלה', { lastBoughtAt: 5 })];

function setup(cat = catalog) {
  const onAdd = vi.fn();
  const onClose = vi.fn();
  render(<AddSheet catalog={cat} onAdd={onAdd} onClose={onClose} />);
  return { onAdd, onClose, input: screen.getByPlaceholderText('מה להוסיף?') as HTMLInputElement };
}

describe('AddSheet', () => {
  it('adds with qty then resets and stays open', async () => {
    const { onAdd, onClose, input } = setup();
    await userEvent.type(input, 'חלב');
    await userEvent.click(screen.getByRole('button', { name: 'הוסף כמות' }));
    await userEvent.click(screen.getByRole('button', { name: 'הוסף כמות' }));
    await userEvent.type(input, '{Enter}');
    expect(onAdd).toHaveBeenCalledWith({ name: 'חלב', qty: 3, note: '' });
    expect(input).toHaveValue('');
    expect(screen.getByLabelText('כמות')).toHaveTextContent('1');
    expect(screen.queryByPlaceholderText('הערה')).toBeNull();
    expect(input).toHaveFocus();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('minus at 1 stays 1', async () => {
    setup();
    await userEvent.click(screen.getByRole('button', { name: 'הפחת כמות' }));
    expect(screen.getByLabelText('כמות')).toHaveTextContent('1');
  });

  it('adds with a note', async () => {
    const { onAdd, input } = setup();
    await userEvent.type(input, 'חלב');
    await userEvent.click(screen.getByRole('button', { name: 'הוסף הערה' }));
    await userEvent.type(screen.getByPlaceholderText('הערה'), '3%{Enter}');
    expect(onAdd).toHaveBeenCalledWith({ name: 'חלב', qty: 1, note: '3%' });
  });

  it('ignores whitespace-only names', async () => {
    const { onAdd, input } = setup();
    await userEvent.type(input, '   {Enter}');
    expect(onAdd).not.toHaveBeenCalled();
  });

  it('chip adds with qty 1 and empty note', async () => {
    const { onAdd } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'חלב' }));
    expect(onAdd).toHaveBeenCalledWith({ name: 'חלב', qty: 1, note: '' });
  });

  it('shows sections and suggestions with an add-typed row', async () => {
    const { input } = setup();
    expect(screen.getByText('⭐ מועדפים')).toBeInTheDocument();
    expect(screen.getByText('🕘 אחרונים')).toBeInTheDocument();
    await userEvent.type(input, 'חל');
    const names = screen.getAllByRole('button').map((b) => b.textContent ?? '');
    const i1 = names.findIndex((t) => t.includes('חלב'));
    const i2 = names.findIndex((t) => t.includes('חלה'));
    expect(i1).toBeGreaterThan(-1);
    expect(i1).toBeLessThan(i2);
    expect(screen.getByRole('button', { name: '➕ הוסף "חל"' })).toBeInTheDocument();
  });

  it('suggestion click adds entry name with current qty', async () => {
    const { onAdd, input } = setup();
    await userEvent.type(input, 'חל');
    await userEvent.click(screen.getByRole('button', { name: 'הוסף כמות' }));
    await userEvent.click(screen.getByRole('button', { name: /חלה/ }));
    expect(onAdd).toHaveBeenCalledWith({ name: 'חלה', qty: 2, note: '' });
  });

  it('closes on backdrop click, Escape, and swipe down on the handle', async () => {
    const { onClose } = setup();
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('add-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalledTimes(2);
    const h = screen.getByTestId('sheet-handle');
    fireEvent.pointerDown(h, { clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(h, { clientY: 130, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(2);
    fireEvent.pointerDown(h, { clientY: 100, pointerId: 1 });
    fireEvent.pointerUp(h, { clientY: 170, pointerId: 1 });
    expect(onClose).toHaveBeenCalledTimes(3);
  });
});

describe('AddSheet built-in basics', () => {
  it('suggests a basic product from an empty catalog and adds it on click', async () => {
    const { onAdd, input } = setup([]);
    await userEvent.type(input, 'עגב');
    await userEvent.click(screen.getByRole('button', { name: /^עגבניות$/ }));
    expect(onAdd).toHaveBeenCalledWith({ name: 'עגבניות', qty: 1, note: '' });
  });
});
