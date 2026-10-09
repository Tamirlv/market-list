import { useEffect, useRef, useState } from 'react';
import type { AddInput, CatalogEntry } from '../types';

export interface CatalogTabProps {
  catalog: CatalogEntry[];
  activeKeys: Set<string>;
  onAdd(input: AddInput): void;
  onSetFavorite(key: string, name: string, fav: boolean): void;
}

interface Props {
  entry: CatalogEntry;
  active: boolean;
  secondary?: string;
  onAdd(input: AddInput): void;
  onSetFavorite(key: string, name: string, fav: boolean): void;
}

export default function CatalogRow({ entry, active, secondary, onAdd, onSetFavorite }: Props) {
  const [justAdded, setJustAdded] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const add = () => {
    onAdd({ name: entry.name, qty: 1, note: '' });
    setJustAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setJustAdded(false), 1500);
  };

  return (
    <li className="item-row catalog-row">
      <button type="button" className="item-btn" onClick={add}>
        <span className="item-main">
          <span className="item-name">{entry.name}</span>
          {secondary && <span className="item-note">{secondary}</span>}
        </span>
        {justAdded ? <span className="row-marker added">נוסף ✓</span> : active && <span className="row-marker">ברשימה ✓</span>}
      </button>
      <button
        type="button"
        className="star-btn"
        aria-label={entry.isFavorite ? 'הסר ממועדפים' : 'הוסף למועדפים'}
        onClick={(e) => {
          e.stopPropagation();
          onSetFavorite(entry.key, entry.name, !entry.isFavorite);
        }}
      >
        {entry.isFavorite ? '⭐' : '☆'}
      </button>
    </li>
  );
}
