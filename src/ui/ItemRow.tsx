import type { Item } from '../types';

export default function ItemRow({
  item,
  onToggle,
  onEditQty,
  as: Tag = 'li',
}: {
  item: Item;
  onToggle: (item: Item) => void;
  onEditQty: (item: Item) => void;
  as?: 'li' | 'div';
}) {
  return (
    <Tag className={`item-row${item.inCart ? ' in-cart' : ''}`}>
      <button type="button" className="item-btn" onClick={() => onToggle(item)}>
        <span className="item-main">
          <span className="item-name">{item.name}</span>
          {item.note !== '' && <span className="item-note">{item.note}</span>}
        </span>
      </button>
      <button type="button" className="qty-badge" aria-label="עריכת כמות והערה" onClick={() => onEditQty(item)}>
        ×{item.qty}
      </button>
    </Tag>
  );
}
