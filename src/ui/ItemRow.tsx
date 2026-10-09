import type { Item } from '../types';

export default function ItemRow({ item, onToggle, as: Tag = 'li' }: { item: Item; onToggle: (item: Item) => void; as?: 'li' | 'div' }) {
  return (
    <Tag className={`item-row${item.inCart ? ' in-cart' : ''}`}>
      <button type="button" className="item-btn" onClick={() => onToggle(item)}>
        <span className="item-main">
          <span className="item-name">{item.name}</span>
          {item.note !== '' && <span className="item-note">{item.note}</span>}
        </span>
        <span className="qty-badge">×{item.qty}</span>
      </button>
    </Tag>
  );
}
