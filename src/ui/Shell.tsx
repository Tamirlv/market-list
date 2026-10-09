import { useEffect, useState } from 'react';
import type { CatalogEntry, Item } from '../types';
import type { AuthUser } from '../auth/useAuth';
import type { ShoppingActions } from '../app/useShoppingData';
import type { DeptId } from '../types';
import ListTab from './ListTab';
import ItemRow from './ItemRow';
import SwipeRow from './SwipeRow';
import DeptPicker from './DeptPicker';
import UndoToast from './UndoToast';
import AddSheet from './AddSheet';
import { relativeTime } from './relativeTime';
import './shell.css';

export interface ShellProps {
  user: AuthUser;
  items: Item[];
  catalog: CatalogEntry[];
  actions: ShoppingActions;
  error: string | null;
  onDismissError: () => void;
}

type Tab = 'list' | 'favorites' | 'recent';

const TABS: Array<{ id: Tab; label: string }> = [
  { id: 'list', label: '📝 רשימה' },
  { id: 'favorites', label: '⭐ מועדפים' },
  { id: 'recent', label: '🕘 אחרונים' },
];

function latest(items: Item[]): Item | null {
  let best: Item | null = null;
  let bestT = -Infinity;
  for (const i of items) {
    const t = i.updatedAt ?? Infinity; // pending local write counts as newest
    if (t >= bestT) {
      best = i;
      bestT = t;
    }
  }
  return best;
}

export default function Shell({ items, catalog, actions, error, onDismissError }: ShellProps) {
  const [tab, setTab] = useState<Tab>('list');
  const [addOpen, setAddOpen] = useState(false);
  const [undoKey, setUndoKey] = useState<number | null>(null);
  const [deptItem, setDeptItem] = useState<Item | null>(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(onDismissError, 4000);
    return () => clearTimeout(t);
  }, [error, onDismissError]);

  const renderRow = (item: Item) => {
    const isFav = catalog.some((c) => c.key === item.key && c.isFavorite);
    return (
      <SwipeRow
        key={item.id}
        actions={[
          {
            label: 'מחק',
            icon: '🗑',
            onAction: () => {
              actions.remove(item);
              setUndoKey(Date.now());
            },
          },
          { label: 'העבר מחלקה', icon: '📂', onAction: () => setDeptItem(item) },
          isFav
            ? { label: 'הסר ממועדפים', icon: '☆', onAction: () => actions.setFavorite(item.key, item.name, false) }
            : { label: 'מועדף', icon: '⭐', onAction: () => actions.setFavorite(item.key, item.name, true) },
        ]}
      >
        <ItemRow as="div" item={item} onToggle={actions.toggle} />
      </SwipeRow>
    );
  };
  const pickDept = (dept: DeptId) => {
    if (deptItem) actions.setDept(deptItem, dept);
    setDeptItem(null);
  };

  const last = latest(items);
  const status = last
    ? `${items.length} פריטים · עודכן ע"י ${last.updatedBy} ${relativeTime(last.updatedAt, Date.now())}`
    : `${items.length} פריטים`;

  return (
    <div className="shell">
      <header className="shell-header">
        <h1>הרשימה שלנו</h1>
        <p className="status-line">{status}</p>
      </header>
      <main className="shell-main">
        {tab === 'list' && <ListTab items={items} onToggle={actions.toggle} onFinish={actions.finish} renderRow={renderRow} />}
        {tab === 'favorites' && <p className="empty-hint">המועדפים יופיעו כאן</p>}
        {tab === 'recent' && <p className="empty-hint">הקניות האחרונות יופיעו כאן</p>}
      </main>
      <button type="button" className="fab" aria-label="הוספת פריט" onClick={() => setAddOpen(true)}>+</button>
      {addOpen && <AddSheet catalog={catalog} onAdd={actions.add} onClose={() => setAddOpen(false)} />}
      {deptItem && <DeptPicker current={deptItem.dept} onPick={pickDept} onClose={() => setDeptItem(null)} />}
      {undoKey !== null && (
        <UndoToast
          key={undoKey}
          message="נמחק · בטל"
          onUndo={() => {
            actions.undoRemove();
            setUndoKey(null);
          }}
          onExpire={() => setUndoKey(null)}
        />
      )}
      {error && <div role="alert" className="toast">{error}</div>}
      <nav className="tab-bar" aria-label="ניווט">
        {TABS.map((t) => (
          <button key={t.id} type="button" className={tab === t.id ? 'active' : ''} aria-current={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
