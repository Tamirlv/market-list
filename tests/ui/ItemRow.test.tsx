import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ItemRow from '../../src/ui/ItemRow';
import type { Item } from '../../src/types';

const item: Item = { id: '1', name: 'חלב', key: 'חלב', qty: 3, note: '', dept: 'dairy', inCart: false, createdAt: 1, updatedAt: 1, updatedBy: 'a' };

describe('ItemRow', () => {
  it('badge opens qty editing without toggling', async () => {
    const onToggle = vi.fn();
    const onEditQty = vi.fn();
    render(<ItemRow item={item} onToggle={onToggle} onEditQty={onEditQty} />);
    await userEvent.click(screen.getByRole('button', { name: 'עריכת כמות והערה' }));
    expect(onEditQty).toHaveBeenCalledWith(item);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('clicking the name toggles', async () => {
    const onToggle = vi.fn();
    const onEditQty = vi.fn();
    render(<ItemRow item={item} onToggle={onToggle} onEditQty={onEditQty} />);
    await userEvent.click(screen.getByText('חלב'));
    expect(onToggle).toHaveBeenCalledWith(item);
    expect(onEditQty).not.toHaveBeenCalled();
  });
});
