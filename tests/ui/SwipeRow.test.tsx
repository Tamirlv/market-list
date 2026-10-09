import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import SwipeRow from '../../src/ui/SwipeRow';

function setup() {
  const onAction = vi.fn();
  const onTap = vi.fn();
  render(
    <ul>
      <SwipeRow actions={[{ label: 'מחק', icon: '🗑', onAction }, { label: 'מועדף', icon: '⭐', onAction: vi.fn() }]}>
        <button type="button" onClick={onTap}>תוכן</button>
      </SwipeRow>
    </ul>,
  );
  const content = screen.getByText('תוכן').parentElement!;
  return { onAction, onTap, content };
}

async function drag(el: HTMLElement, dx: number, dy = 0) {
  fireEvent.pointerDown(el, { clientX: 200, clientY: 100, pointerId: 1 });
  fireEvent.pointerMove(el, { clientX: 200 + dx, clientY: 100 + dy, pointerId: 1 });
  fireEvent.pointerUp(el, { clientX: 200 + dx, clientY: 100 + dy, pointerId: 1 });
  await new Promise((r) => setTimeout(r, 1));
}

describe('SwipeRow', () => {
  it('action buttons exist with aria-labels and call their callbacks', async () => {
    const { onAction } = setup();
    await userEvent.click(screen.getByRole('button', { name: 'מחק' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('drag left past 60px opens; tapping content then closes without activating it', async () => {
    const { onTap, content } = setup();
    await drag(content, -80);
    expect(content.dataset.open).toBe('true');
    fireEvent.click(screen.getByText('תוכן'));
    expect(onTap).not.toHaveBeenCalled();
    expect(content.dataset.open).toBe('false');
    fireEvent.click(screen.getByText('תוכן'));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('short or mostly-vertical drags do not open', async () => {
    const { content } = setup();
    await drag(content, -40);
    expect(content.dataset.open).toBe('false');
    await drag(content, -80, 120);
    expect(content.dataset.open).toBe('false');
  });
});
