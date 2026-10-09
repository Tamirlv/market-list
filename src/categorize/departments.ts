import type { DeptId } from '../types';

export const DEPARTMENTS: ReadonlyArray<{ id: DeptId; label: string; emoji: string }> = [
  { id: 'produce', label: 'ירקות ופירות', emoji: '🥬' },
  { id: 'bakery', label: 'מאפים ולחם', emoji: '🥖' },
  { id: 'dairy', label: 'חלבי וביצים', emoji: '🧀' },
  { id: 'meat', label: 'בשר ועוף', emoji: '🍗' },
  { id: 'fish', label: 'דגים', emoji: '🐟' },
  { id: 'pantry', label: 'מזון יבש ושימורים', emoji: '🥫' },
  { id: 'spices', label: 'תבלינים ורטבים', emoji: '🧂' },
  { id: 'snacks', label: 'חטיפים ומתוקים', emoji: '🍫' },
  { id: 'drinks', label: 'משקאות', emoji: '🥤' },
  { id: 'frozen', label: 'קפואים', emoji: '🧊' },
  { id: 'cleaning', label: 'ניקיון', emoji: '🧴' },
  { id: 'toiletries', label: 'טואלטיקה והיגיינה', emoji: '🧻' },
  { id: 'baby', label: 'תינוקות', emoji: '🍼' },
  { id: 'other', label: 'שונות', emoji: '📦' },
];
