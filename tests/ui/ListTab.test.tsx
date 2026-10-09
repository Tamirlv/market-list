import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import ListTab from '../../src/ui/ListTab';
import type { Item } from '../../src/types';

function item(p: Partial<Item> & { id: string; name: string }): Item {
  return { key: p.name, qty: 1, note: '', dept: 'other', inCart: false, createdAt: 1, updatedAt: 1, updatedBy: 'x', ...p };
}

describe('ListTab', () => {
  it('groups headings in department order with emoji and label', () => {
    const items = [item({ id: 'a', name: 'סבון', dept: 'cleaning' }), item({ id: 'b', name: 'עגבניה', dept: 'produce' })];
    render(<ListTab items={items} onToggle={vi.fn()} onFinish={vi.fn()} />);
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['🥬 ירקות ופירות', '🧴 ניקיון']);
  });

  it('shows name, ×N and note', () => {
    render(<ListTab items={[item({ id: 'a', name: 'חלב', qty: 3, note: 'דל לקטוז' })]} onToggle={vi.fn()} onFinish={vi.fn()} />);
    expect(screen.getByText('חלב')).toBeInTheDocument();
    expect(screen.getByText('×3')).toBeInTheDocument();
    expect(screen.getByText('דל לקטוז')).toBeInTheDocument();
  });

  it('clicking an active item toggles it', async () => {
    const onToggle = vi.fn();
    const it1 = item({ id: 'a', name: 'חלב' });
    render(<ListTab items={[it1]} onToggle={onToggle} onFinish={vi.fn()} />);
    await userEvent.click(screen.getByText('חלב'));
    expect(onToggle).toHaveBeenCalledWith(it1);
  });

  it('in-cart items render under בעגלה (N) with line-through and finish works', async () => {
    const onFinish = vi.fn();
    render(
      <ListTab items={[item({ id: 'a', name: 'חלב', inCart: true }), item({ id: 'b', name: 'לחם', inCart: true })]} onToggle={vi.fn()} onFinish={onFinish} />,
    );
    expect(screen.getByRole('heading', { name: 'בעגלה (2)' })).toBeInTheDocument();
    expect(screen.getByText('חלב').closest('li')).toHaveClass('in-cart');
    await userEvent.click(screen.getByRole('button', { name: 'סיימתי קנייה' }));
    expect(onFinish).toHaveBeenCalledTimes(1);
  });

  it('finish button hidden when cart is empty', () => {
    render(<ListTab items={[item({ id: 'a', name: 'חלב' })]} onToggle={vi.fn()} onFinish={vi.fn()} />);
    expect(screen.queryByRole('button', { name: 'סיימתי קנייה' })).not.toBeInTheDocument();
  });

  it('empty list shows hint', () => {
    render(<ListTab items={[]} onToggle={vi.fn()} onFinish={vi.fn()} />);
    expect(screen.getByText('הרשימה ריקה — לחצו + כדי להוסיף')).toBeInTheDocument();
  });

  it('renderRow overrides row rendering', () => {
    render(<ListTab items={[item({ id: 'a', name: 'חלב' })]} onToggle={vi.fn()} onFinish={vi.fn()} renderRow={(i) => <li key={i.id}>custom-{i.name}</li>} />);
    expect(screen.getByText('custom-חלב')).toBeInTheDocument();
  });
});
