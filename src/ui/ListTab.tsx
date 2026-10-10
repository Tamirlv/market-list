import type { ReactNode } from 'react';
import type { Item } from '../types';
import { DEPARTMENTS } from '../categorize/departments';
import { cartItems, groupByDept } from '../logic/list';
import ItemRow from './ItemRow';

export interface ListTabProps {
  items: Item[];
  onToggle: (item: Item) => void;
  onFinish: () => void;
  renderRow?: (item: Item) => ReactNode;
  onEditQty?: (item: Item) => void;
}

export default function ListTab({ items, onToggle, onFinish, renderRow, onEditQty = () => {} }: ListTabProps) {
  const groups = groupByDept(items);
  const cart = cartItems(items);
  const row = (i: Item) => (renderRow ? renderRow(i) : <ItemRow key={i.id} item={i} onToggle={onToggle} onEditQty={onEditQty} />);

  if (items.length === 0) {
    return <p className="empty-hint">הרשימה ריקה — לחצו + כדי להוסיף</p>;
  }
  return (
    <div className="list-tab">
      {groups.map((g) => {
        const d = DEPARTMENTS.find((x) => x.id === g.dept)!;
        return (
          <section key={g.dept} className="dept-group">
            <h2 className="dept-heading">{d.emoji} {d.label}</h2>
            <ul className="item-list">{g.items.map(row)}</ul>
          </section>
        );
      })}
      {cart.length > 0 && (
        <section className="dept-group cart-group">
          <h2 className="dept-heading">בעגלה ({cart.length})</h2>
          <ul className="item-list">{cart.map(row)}</ul>
          <button type="button" className="finish-btn" onClick={onFinish}>סיימתי קנייה</button>
        </section>
      )}
    </div>
  );
}
