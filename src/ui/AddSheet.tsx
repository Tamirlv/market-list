import { useEffect, useRef, useState } from 'react';
import type { AddInput, CatalogEntry } from '../types';
import { chipsOf, suggestionsFor } from '../logic/catalog';

export interface AddSheetProps {
  catalog: CatalogEntry[];
  onAdd(input: AddInput): void;
  onClose(): void;
}

const SWIPE_CLOSE_PX = 60;

export default function AddSheet({ catalog, onAdd, onClose }: AddSheetProps) {
  const [name, setName] = useState('');
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const noteRef = useRef<HTMLInputElement>(null);
  const dragStartY = useRef<number | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (noteOpen) noteRef.current?.focus();
  }, [noteOpen]);

  const reset = () => {
    setName('');
    setQty(1);
    setNote('');
    setNoteOpen(false);
    nameRef.current?.focus();
  };

  const submit = (text: string) => {
    const trimmed = text.trim();
    if (trimmed === '') return;
    onAdd({ name: trimmed, qty, note: note.trim() });
    reset();
  };

  const addChip = (entry: CatalogEntry) => {
    onAdd({ name: entry.name, qty: 1, note: '' });
    reset();
  };

  const onEnter = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      submit(name);
    }
  };

  const query = name.trim();
  const { favorites, recents } = chipsOf(catalog);
  const suggestions = suggestionsFor(catalog, query);

  const chipList = (list: CatalogEntry[]) => (
    <div className="chip-row">
      {list.map((e) => (
        <button key={e.key} type="button" className="chip" onClick={() => addChip(e)}>{e.name}</button>
      ))}
    </div>
  );

  return (
    <div className="sheet-backdrop" data-testid="add-backdrop" onClick={onClose}>
      <div className="sheet add-sheet" role="dialog" aria-label="הוספת פריט" onClick={(e) => e.stopPropagation()}>
        <div
          className="sheet-handle"
          data-testid="sheet-handle"
          onPointerDown={(e) => {
            dragStartY.current = e.clientY;
            e.currentTarget.setPointerCapture?.(e.pointerId);
          }}
          onPointerUp={(e) => {
            const start = dragStartY.current;
            dragStartY.current = null;
            if (start !== null && e.clientY - start >= SWIPE_CLOSE_PX) onClose();
          }}
          onPointerCancel={() => { dragStartY.current = null; }}
        >
          <span aria-hidden="true" />
        </div>
        <div className="add-row">
          <input
            ref={nameRef}
            className="add-input"
            value={name}
            placeholder="מה להוסיף?"
            autoFocus
            autoComplete="off"
            enterKeyHint="done"
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={onEnter}
          />
          <div className="stepper">
            <button type="button" aria-label="הפחת כמות" onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
            <span aria-label="כמות" aria-live="polite">{qty}</span>
            <button type="button" aria-label="הוסף כמות" onClick={() => setQty((q) => q + 1)}>+</button>
          </div>
          <button type="button" className="note-toggle" aria-label="הוסף הערה" aria-pressed={noteOpen} onClick={() => setNoteOpen((o) => !o)}>📝</button>
        </div>
        {noteOpen && (
          <input
            ref={noteRef}
            className="add-input note-input"
            value={note}
            placeholder="הערה"
            autoComplete="off"
            enterKeyHint="done"
            maxLength={120}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={onEnter}
          />
        )}
        {query === '' ? (
          <>
            {favorites.length > 0 && (<section><h3 className="chip-heading">⭐ מועדפים</h3>{chipList(favorites)}</section>)}
            {recents.length > 0 && (<section><h3 className="chip-heading">🕘 אחרונים</h3>{chipList(recents)}</section>)}
          </>
        ) : (
          <ul className="suggestions">
            {suggestions.map((e) => (
              <li key={e.key}>
                <button type="button" className="suggestion" onClick={() => submit(e.name)}>
                  {e.isFavorite && <span aria-hidden="true">⭐ </span>}{e.name}
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="suggestion add-typed" onClick={() => submit(name)}>{`➕ הוסף "${query}"`}</button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
