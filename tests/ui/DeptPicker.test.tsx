import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import DeptPicker from '../../src/ui/DeptPicker';

describe('DeptPicker', () => {
  it('lists 14 departments and picks one', async () => {
    const onPick = vi.fn();
    render(<DeptPicker current="dairy" onPick={onPick} onClose={vi.fn()} />);
    expect(screen.getAllByRole('button')).toHaveLength(14);
    await userEvent.click(screen.getByRole('button', { name: /קפואים/ }));
    expect(onPick).toHaveBeenCalledWith('frozen');
  });

  it('marks the current department', () => {
    render(<DeptPicker current="dairy" onPick={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByRole('button', { name: /חלבי וביצים/ })).toHaveAttribute('aria-current', 'true');
  });

  it('backdrop closes, sheet click does not', async () => {
    const onClose = vi.fn();
    render(<DeptPicker current="dairy" onPick={vi.fn()} onClose={onClose} />);
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('dept-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
