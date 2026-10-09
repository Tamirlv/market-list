import { act, render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import UndoToast from '../../src/ui/UndoToast';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('UndoToast', () => {
  it('shows the message and calls onUndo on click', () => {
    const onUndo = vi.fn();
    render(<UndoToast message="נמחק · בטל" onUndo={onUndo} onExpire={vi.fn()} />);
    fireEvent.click(screen.getByText('נמחק · בטל'));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('expires after 4000ms and not before', () => {
    const onExpire = vi.fn();
    render(<UndoToast message="נמחק · בטל" onUndo={vi.fn()} onExpire={onExpire} />);
    act(() => { vi.advanceTimersByTime(3999); });
    expect(onExpire).not.toHaveBeenCalled();
    act(() => { vi.advanceTimersByTime(1); });
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
