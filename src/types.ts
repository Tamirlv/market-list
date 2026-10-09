export type DeptId = 'produce'|'bakery'|'dairy'|'meat'|'fish'|'pantry'|'spices'
  |'snacks'|'drinks'|'frozen'|'cleaning'|'toiletries'|'baby'|'other';
export interface Item { id: string; name: string; key: string; qty: number; note: string;
  dept: DeptId; inCart: boolean; createdAt: number|null; updatedAt: number|null; updatedBy: string }
export interface CatalogEntry { key: string; name: string; dept: DeptId|null;
  isFavorite: boolean; lastBoughtAt: number|null }
export interface AddInput { name: string; qty: number; note: string }
export type AddPlan =
  | { kind: 'create'; key: string; dept: DeptId }
  | { kind: 'update'; id: string; qty: number; note: string };
