import { recentsOf } from '../logic/catalog';
import CatalogRow, { type CatalogTabProps } from './CatalogRow';
import { relativeTime } from './relativeTime';

export default function RecentTab({ catalog, activeKeys, onAdd, onSetFavorite }: CatalogTabProps) {
  const recents = recentsOf(catalog);
  if (recents.length === 0) return <p className="empty-hint">עוד לא סיימתם קנייה</p>;
  const now = Date.now();
  return (
    <ul className="item-list">
      {recents.map((e) => (
        <CatalogRow
          key={e.key}
          entry={e}
          active={activeKeys.has(e.key)}
          secondary={relativeTime(e.lastBoughtAt, now)}
          onAdd={onAdd}
          onSetFavorite={onSetFavorite}
        />
      ))}
    </ul>
  );
}
