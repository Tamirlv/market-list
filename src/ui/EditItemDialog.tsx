import { useEffect, useState } from 'react';

export interface EditItemDialogProps {
  name: string;
  qty: number;
  note: string;
  onSave(v: { qty: number; note: string }): void;
  onClose(): void;
}

export default function EditItemDialog({ name, qty, note, onSave, onClose }: EditItemDialogProps) {
  const [value, setValue] = useState(qty);
  const [noteValue, setNoteValue] = useState(note);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = () => {
    const trimmed = noteValue.trim().slice(0, 120);
    if (value !== qty || trimmed !== note.trim()) onSave({ qty: value, note: trimmed });
    onClose();
  };

  return (
    <div className="qty-backdrop" data-testid="qty-backdrop" onClick={onClose}>
      <div className="qty-dialog" role="dialog" aria-modal="true" aria-label={name} onClick={(e) => e.stopPropagation()}>
        <h2 className="qty-title">{name}</h2>
        <div className="stepper qty-stepper">
          <button type="button" aria-label="הפחת כמות" onClick={() => setValue((v) => Math.max(1, v - 1))}>−</button>
          <span aria-live="polite">{value}</span>
          <button type="button" aria-label="הוסף כמות" onClick={() => setValue((v) => v + 1)}>+</button>
        </div>
        <input
          className="add-input note-input"
          type="text"
          aria-label="הערה"
          placeholder="הערה"
          maxLength={120}
          value={noteValue}
          onChange={(e) => setNoteValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') save();
          }}
        />
        <div className="qty-actions">
          <button type="button" className="qty-save" onClick={save}>שמירה</button>
          <button type="button" className="qty-cancel" onClick={onClose}>ביטול</button>
        </div>
      </div>
    </div>
  );
}
