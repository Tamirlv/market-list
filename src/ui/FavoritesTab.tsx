import { favoritesOf } from '../logic/catalog';
import CatalogRow, { type CatalogTabProps } from './CatalogRow';

export default function FavoritesTab({ catalog, activeKeys, onAdd, onSetFavorite }: CatalogTabProps) {
  const favorites = favoritesOf(catalog);
  if (favorites.length === 0) return <p className="empty-hint">עוד אין מועדפים — סמנו ⭐ בהחלקה</p>;
  return (
    <ul className="item-list">
      {favorites.map((e) => (
        <CatalogRow key={e.key} entry={e} active={activeKeys.has(e.key)} onAdd={onAdd} onSetFavorite={onSetFavorite} />
      ))}
    </ul>
  );
}
