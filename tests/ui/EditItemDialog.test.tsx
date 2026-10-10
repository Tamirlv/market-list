import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import EditItemDialog from '../../src/ui/EditItemDialog';

function setup(qty = 2, note = '') {
  const onSave = vi.fn();
  const onClose = vi.fn();
  render(<EditItemDialog name="חלב" qty={qty} note={note} onSave={onSave} onClose={onClose} />);
  return { onSave, onClose };
}

describe('EditItemDialog', () => {
  it('shows the name, starts at qty and prefilled note', () => {
    setup(2, 'דל לקטוז');
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('חלב')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByLabelText('הערה')).toHaveValue('דל לקטוז');
  });

  it('+ twice increases by 2 and saves', async () => {
    const { onSave, onClose } = setup(2);
    await userEvent.click(screen.getByRole('button', { name: 'הוסף כמות' }));
    await userEvent.click(screen.getByRole('button', { name: 'הוסף כמות' }));
    expect(screen.getByText('4')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'שמירה' }));
    expect(onSave).toHaveBeenCalledWith({ qty: 4, note: '' });
    expect(onClose).toHaveBeenCalled();
  });

  it('− at 1 stays 1', async () => {
    setup(1);
    await userEvent.click(screen.getByRole('button', { name: 'הפחת כמות' }));
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('editing only the note saves same qty and new note', async () => {
    const { onSave, onClose } = setup(2, '');
    await userEvent.type(screen.getByLabelText('הערה'), '  קטנים ');
    await userEvent.click(screen.getByRole('button', { name: 'שמירה' }));
    expect(onSave).toHaveBeenCalledWith({ qty: 2, note: 'קטנים' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Enter in the note saves', async () => {
    const { onSave } = setup(2, '');
    await userEvent.type(screen.getByLabelText('הערה'), 'x{Enter}');
    expect(onSave).toHaveBeenCalledWith({ qty: 2, note: 'x' });
  });

  it('whitespace-only note change is unchanged', async () => {
    const { onSave, onClose } = setup(2, 'דל');
    await userEvent.type(screen.getByLabelText('הערה'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'שמירה' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('unchanged save closes without onSave', async () => {
    const { onSave, onClose } = setup(2);
    await userEvent.click(screen.getByRole('button', { name: 'שמירה' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancel closes without saving', async () => {
    const { onSave, onClose } = setup(2);
    await userEvent.click(screen.getByRole('button', { name: 'הוסף כמות' }));
    await userEvent.click(screen.getByRole('button', { name: 'ביטול' }));
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape closes without saving', async () => {
    const { onSave, onClose } = setup(2);
    await userEvent.keyboard('{Escape}');
    expect(onSave).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('backdrop closes, dialog click does not', async () => {
    const { onSave, onClose } = setup(2);
    await userEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByTestId('qty-backdrop'));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSave).not.toHaveBeenCalled();
  });
});
