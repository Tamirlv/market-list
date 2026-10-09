# Shared Shopping List Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Hebrew RTL PWA shopping list shared by two Google accounts, with live sync, offline support, favorites, recents and automatic department grouping.

**Architecture:** React SPA served from Vercel. Firebase Auth (Google, redirect flow proxied through the app's own domain) and Firestore (`households/main/items` + `households/main/catalog`) with persistent local cache. Pure logic (`src/categorize`, `src/logic`) is Firebase-free and unit tested; `src/data` is a thin Firestore repository; `src/ui` components are presentational (props in, callbacks out) and wired in `src/app`.

**Tech Stack:** Vite 5+, React 18+, TypeScript (strict), Firebase JS SDK 10+, vite-plugin-pwa, Vitest + @testing-library/react + jsdom, firebase-tools emulator + @firebase/rules-unit-testing.

**Spec:** `docs/superpowers/specs/2026-10-09-shopping-list-design.md` — read it alongside this plan.

## Global Constraints

- All UI copy in Hebrew; `<html lang="he" dir="rtl">`.
- Default quantity is 1; quantity is an integer ≥ 1.
- Name ≤ 60 chars, note ≤ 120 chars (trimmed client-side before any write; enforced in rules).
- Only the two emails in `ALLOWED_EMAILS` may read/write; must match `firestore.rules` exactly. **The user supplies both addresses before Task 5.**
- Single household document id: `main`.
- Recents limit 50; add-sheet chips limit 8 favorites + 8 recents.
- Undo toast duration 4000 ms.
- Theme "פסטל רך": background gradient `#fdf1f3`→`#f6efff`; text `#3b2f45`; secondary `#a593b3`; accent `#b07aa1`; card `rgba(255,255,255,.85)` radius 18px; qty badge bg `#f7e3ee`; FAB gradient `#f3a6c0`→`#b99bf0`; font Rubik; tap targets ≥ 44px; respect `env(safe-area-inset-*)`.
- `ui/` never imports from `firebase/*` or `src/data`.
- Prerequisites on the dev machine: Node 20+, Java 11+ (for the Firestore emulator).

## Review Focus

1. Same product typed differently ("עגבניה" / "עגבניות" / " עַגְבָנִיָּה ") must merge into one row, not duplicate — pinned in Task 2 and Task 3 tests.
2. Empty or whitespace-only name + Enter must add nothing — pinned in Task 9.
3. Writes made offline have `null` server timestamps until synced; recents/status line must not crash or misorder — pinned in Task 3 (null-safe sort) and Task 4 (`serverTimestamps: 'estimate'`).
4. A pasted name longer than 60 chars must be trimmed, not rejected by rules (which would silently drop it) — pinned in Task 3.
5. `ALLOWED_EMAILS` drifting from `firestore.rules` would lock a spouse out — pinned in Task 5 (consistency test).

---

## File Structure

```
index.html                     lang=he dir=rtl, Rubik font link
vite.config.ts                 react + PWA plugin + vitest config (excludes tests/emulator)
vercel.json                    /__/auth rewrite + SPA fallback
firebase.json, firestore.rules, .firebaserc
.env.example                   VITE_FIREBASE_* keys
src/
  main.tsx                     mounts <App/>
  types.ts                     DeptId, Item, CatalogEntry, AddInput, AddPlan
  config/allowlist.ts          ALLOWED_EMAILS
  categorize/normalize.ts      normalizeName
  categorize/departments.ts    DEPARTMENTS (ordered, label + emoji)
  categorize/dictionary.ts     DICTIONARY + departmentFor
  logic/list.ts                planAdd, groupByDept, cartItems, clampInput
  logic/catalog.ts             favoritesOf, recentsOf, chipsOf, suggestionsFor
  data/firebase.ts             app/auth/db init
  data/repo.ts                 Firestore repository
  auth/useAuth.ts              auth state + allowlist check
  app/App.tsx                  AuthGate → Shell
  app/useShoppingData.ts       subscribes items+catalog, exposes actions
  ui/theme.css                 tokens + base styles
  ui/SignIn.tsx, ui/NoAccess.tsx
  ui/Shell.tsx                 header/status line, tabs, FAB, offline banner, toasts
  ui/ListTab.tsx, ui/ItemRow.tsx, ui/SwipeRow.tsx, ui/DeptPicker.tsx, ui/UndoToast.tsx
  ui/AddSheet.tsx
  ui/FavoritesTab.tsx, ui/RecentTab.tsx
  ui/relativeTime.ts           "לפני 2 דק'"
tests/                         mirrors src/ for unit tests
tests/emulator/                rules + repo tests (run under emulator)
```

## Shared Types (`src/types.ts`, created in Task 1)

```ts
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
```
Timestamps are epoch ms in the app; `null` = pending server write.

---

### Task 1: Project scaffold, theme, test harness

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/types.ts`, `src/ui/theme.css`, `src/app/App.tsx` (placeholder), `tests/smoke.test.tsx`, `.env.example`

**Interfaces:**
- Produces: `src/types.ts` (above); npm scripts `dev`, `build`, `test` (`vitest run`), `test:emulator` (`firebase emulators:exec --only firestore,auth "vitest run --dir tests/emulator"`).

- [ ] **Step 1:** Scaffold with `npm create vite@latest . -- --template react-ts`; add deps `firebase`, dev-deps `vitest jsdom @testing-library/react @testing-library/user-event @testing-library/jest-dom vite-plugin-pwa firebase-tools @firebase/rules-unit-testing`.
- [ ] **Step 2: Write failing smoke test** `tests/smoke.test.tsx`: renders `<App/>`, expects `document.documentElement.dir === 'rtl'` is set by index.html (assert via reading `index.html` text contains `dir="rtl"` and `lang="he"`) and App renders text `הרשימה שלנו`.
- [ ] **Step 3:** Run `npm test` → FAIL.
- [ ] **Step 4:** Implement: `index.html` with `lang="he" dir="rtl"`, Rubik from Google Fonts, `viewport-fit=cover`; `theme.css` with the Global Constraints tokens as CSS variables; placeholder `App` rendering `<h1>הרשימה שלנו</h1>`; vitest `environment: 'jsdom'`, `exclude: ['tests/emulator/**', 'node_modules/**']`, setup file importing jest-dom.
- [ ] **Step 5:** `npm test` → PASS; `npm run build` → succeeds.
- [ ] **Step 6: Commit** `feat: scaffold vite react app with theme and tests`

---

### Task 2: Name normalization and department categorization

**Files:**
- Create: `src/categorize/normalize.ts`, `src/categorize/departments.ts`, `src/categorize/dictionary.ts`
- Test: `tests/categorize/normalize.test.ts`, `tests/categorize/dictionary.test.ts`

**Interfaces:**
- Produces:
  - `normalizeName(name: string): string`
  - `DEPARTMENTS: ReadonlyArray<{ id: DeptId; label: string; emoji: string }>` in spec §5.3 order: produce ירקות ופירות 🥬, bakery מאפים ולחם 🥖, dairy חלבי וביצים 🧀, meat בשר ועוף 🍗, fish דגים 🐟, pantry מזון יבש ושימורים 🥫, spices תבלינים ורטבים 🧂, snacks חטיפים ומתוקים 🍫, drinks משקאות 🥤, frozen קפואים 🧊, cleaning ניקיון 🧴, toiletries טואלטיקה והיגיינה 🧻, baby תינוקות 🍼, other שונות 📦
  - `departmentFor(key: string, learned: DeptId | null): DeptId`

**Normalization algorithm** (not determined by the signature): trim; collapse whitespace; strip niqqud/cantillation `[֑-ׇ]`; lowercase Latin; per word: map final letters ך→כ ם→מ ן→נ ף→פ ץ→צ, replace `יי`→`י` and `וו`→`ו`, then if word length > 3 strip the first matching suffix of `ימ`, `ות`, `ה`; join with single spaces.

- [ ] **Step 1: Write failing tests** (`normalize.test.ts`):
  - `normalizeName('עגבניות') === normalizeName('עגבניה') === normalizeName(' עַגְבָנִיָּה ')`
  - `normalizeName('מלפפונים') === normalizeName('מלפפון')`
  - `normalizeName('ביצים') === normalizeName('ביצה')`
  - `normalizeName('חלב') !== normalizeName('חלה')`
  - `normalizeName('מים')` is stable (length-3 word not stripped) and `!== normalizeName('מ')`
  - `normalizeName('גבינה  צהובה') === normalizeName('גבינות צהובות')`
  (`dictionary.test.ts`):
  - `departmentFor(normalizeName('חלב'), null) === 'dairy'`; `'עגבניות'`→`produce`; `'נוזל כלים'`→`cleaning`; `'במבה'`→`snacks`; `'חיתולים'`→`baby`; `'לחם'`→`bakery`; `'חזה עוף'`→`meat`
  - first-word fallback: `'גבינה צהובה 28%'`→`dairy`
  - unknown: `'פריט לא קיים'`→`other`
  - learned wins: `departmentFor(normalizeName('חלב'), 'frozen') === 'frozen'`
  - every dictionary entry maps to a valid `DeptId`; dictionary has ≥ 300 entries total; no normalized key appears under two departments.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement. `DICTIONARY: Record<DeptId, string[]>` written in natural Hebrew (≥ 300 common Israeli supermarket products, every department except `other` non-empty); build a `Map<normalizedKey, DeptId>` once at module load. `departmentFor`: learned → exact key → first word's key → `'other'`.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: hebrew name normalization and department dictionary`

---

### Task 3: Pure list and catalog logic

**Files:**
- Create: `src/logic/list.ts`, `src/logic/catalog.ts`
- Test: `tests/logic/list.test.ts`, `tests/logic/catalog.test.ts`

**Interfaces:**
- Consumes: `normalizeName`, `departmentFor`, `DEPARTMENTS`, types.
- Produces:
  - `clampInput(input: AddInput): AddInput` — trims name to ≤ 60 chars and note to ≤ 120, `qty = max(1, round(qty))`.
  - `planAdd(items: Item[], input: AddInput, learned: DeptId | null): AddPlan` — rules from spec §3.3: active match by key → `update` with `qty = existing.qty + input.qty`, note = input.note if non-empty else existing note; in-cart match → `update` with `qty = input.qty` (caller also sets `inCart:false`); no match → `create` with `key` and `departmentFor(key, learned)`.
  - `groupByDept(items: Item[]): Array<{ dept: DeptId; items: Item[] }>` — active (`!inCart`) only, `DEPARTMENTS` order, empty groups omitted, items within a group by `createdAt` ascending (null last).
  - `cartItems(items: Item[]): Item[]`
  - `favoritesOf(catalog: CatalogEntry[]): CatalogEntry[]` — `isFavorite`, sorted by `name.localeCompare(b.name, 'he')`.
  - `recentsOf(catalog: CatalogEntry[], limit = 50): CatalogEntry[]` — `lastBoughtAt !== null`, descending.
  - `chipsOf(catalog: CatalogEntry[]): { favorites: CatalogEntry[]; recents: CatalogEntry[] }` — 8 each; recents exclude favorites.
  - `suggestionsFor(catalog: CatalogEntry[], query: string, limit = 6): CatalogEntry[]` — match if normalized entry key starts with or contains `normalizeName(query)`; favorites first, then `lastBoughtAt` desc (null last); empty query → `[]`.

- [ ] **Step 1: Write failing tests:**
  - `planAdd` with active "חלב ×1" + input `{name:'חלב', qty:2, note:''}` → `{kind:'update', id, qty:3, note:''}`
  - same with input note `'3%'` → note `'3%'`; existing note kept when input note empty
  - existing "עגבניות" + input "עגבניה" → `update` (merge across spelling)
  - in-cart "ביצים ×4" + input qty 1 → `update` qty 1
  - no match → `create` with dept `'dairy'` for "קוטג'" (or whatever dictionary says) and `learned` overriding it
  - `clampInput({name:'א'.repeat(80), qty:0, note:'ב'.repeat(200)})` → name length 60, qty 1, note length 120
  - `groupByDept` returns produce before dairy before cleaning, skips empty, excludes in-cart
  - `recentsOf` with 60 entries returns 50, newest first; entries with `lastBoughtAt: null` excluded; does not throw
  - `suggestionsFor(catalog, 'חל')` returns favorite "חלב" before non-favorite recent "חלה"; `suggestionsFor(catalog, '  ')` → `[]`
  - `chipsOf` caps at 8 and a favorite never appears in recents chips
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement per Interfaces.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: pure list and catalog logic`

---

### Task 4: Firebase init and Firestore repository

**Files:**
- Create: `src/data/firebase.ts`, `src/data/repo.ts`, `firebase.json`, `.firebaserc`, `firestore.rules` (temporary allow-all for emulator; replaced in Task 5)
- Test: `tests/emulator/repo.test.ts`

**Interfaces:**
- Consumes: Task 3 logic, types.
- Produces (`repo.ts`; all paths under `households/main`):
  - `subscribeItems(cb: (items: Item[]) => void): () => void`
  - `subscribeCatalog(cb: (entries: CatalogEntry[]) => void): () => void`
  - `addItem(items: Item[], catalog: CatalogEntry[], input: AddInput, by: string): Promise<void>` — `clampInput` → `planAdd` (learned = `catalog[key].dept`) → create/update item (update also sets `inCart:false`), and `set(catalog/{key}, {name, isFavorite?, dept?, lastBoughtAt?}, {merge:true})` writing only `name` (plus defaults `isFavorite:false, dept:null, lastBoughtAt:null` when the entry doesn't exist yet).
  - `toggleCart(id: string, inCart: boolean, by: string): Promise<void>`
  - `removeItem(id: string): Promise<void>`; `restoreItem(item: Item): Promise<void>` (re-creates with the same id)
  - `finishShopping(cart: Item[]): Promise<void>` — one `writeBatch`: delete each item, set `catalog/{key}.lastBoughtAt = serverTimestamp()`.
  - `setFavorite(key: string, name: string, isFavorite: boolean): Promise<void>`
  - `setDept(item: Item, dept: DeptId, by: string): Promise<void>` — updates item and `catalog/{item.key}.dept`.
  - `firebase.ts` exports `app`, `auth`, `db`; `db` via `initializeFirestore(app, { localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }) })`; connects to emulators when `import.meta.env.VITE_USE_EMULATORS === 'true'`.
  - Snapshot mapping uses `doc.data({ serverTimestamps: 'estimate' })` and converts Timestamps to ms.

- [ ] **Step 1: Write failing emulator tests** (`repo.test.ts`, clearing Firestore between tests):
  - `addItem` twice with "חלב" qty 1 and qty 2 → exactly one item with qty 3; catalog has key with `isFavorite:false`
  - `setFavorite` then `addItem` same product → catalog `isFavorite` still `true` (merge doesn't clobber)
  - `setDept(item,'frozen')` → next `addItem` of a new item with same key gets dept `frozen`
  - `finishShopping` with two in-cart items → items gone, both catalog entries have numeric `lastBoughtAt`
  - `removeItem` then `restoreItem` → item back with same id and fields
- [ ] **Step 2:** `npm run test:emulator` → FAIL.
- [ ] **Step 3:** Implement per Interfaces.
- [ ] **Step 4:** `npm run test:emulator` → PASS; `npm test` still PASS.
- [ ] **Step 5: Commit** `feat: firestore repository with offline cache`

---

### Task 5: Security rules and allowlist

**Precondition:** user has supplied the two Gmail addresses.

**Files:**
- Create: `src/config/allowlist.ts`
- Modify: `firestore.rules`
- Test: `tests/emulator/rules.test.ts`, `tests/config/allowlist.test.ts`

**Interfaces:**
- Produces: `ALLOWED_EMAILS: readonly string[]` (lowercase); `isAllowed(email: string | null | undefined): boolean` (case-insensitive).

- [ ] **Step 1: Write failing tests:**
  - `allowlist.test.ts`: reads `firestore.rules` as text; every entry of `ALLOWED_EMAILS` appears in it and the rules list has exactly `ALLOWED_EMAILS.length` addresses. `isAllowed('X@Gmail.com')` true for an allowed address in different case; false for `null` and a stranger.
  - `rules.test.ts` (rules-unit-testing): allowed verified user can read/write `households/main/items/a` and `catalog/k`; stranger denied; unauthenticated denied; allowed user with `email_verified:false` denied; item write with `qty:0`, `qty:1.5`, empty name, 61-char name, or 121-char note denied; any path outside `households/main` denied.
- [ ] **Step 2:** Run both suites → FAIL.
- [ ] **Step 3:** Implement rules per spec §6 (`function allowed()` checks `request.auth != null && request.auth.token.email_verified == true && request.auth.token.email.lower() in [ ... ]`; item validation on create/update).
- [ ] **Step 4:** Both suites PASS.
- [ ] **Step 5: Commit** `feat: firestore security rules restricted to household emails`

---

### Task 6: Auth flow (redirect via own domain)

**Files:**
- Create: `src/auth/useAuth.ts`, `src/ui/SignIn.tsx`, `src/ui/NoAccess.tsx`, `vercel.json`
- Modify: `src/app/App.tsx`
- Test: `tests/app/App.test.tsx`

**Interfaces:**
- Consumes: `auth` from `data/firebase.ts`, `isAllowed`.
- Produces: `useAuth(): { status: 'loading' | 'signedOut' | 'denied' | 'ready'; user: { uid: string; email: string; firstName: string } | null; signIn(): void; signOut(): void }` — `signIn` uses `signInWithRedirect(auth, new GoogleAuthProvider())`; `firstName = displayName?.split(' ')[0] ?? email`.
- `App` renders by status: loading → spinner; signedOut → `<SignIn onSignIn/>` (button "התחברות עם Google"); denied → `<NoAccess email onSignOut/>` ("אין לך גישה לרשימה הזו", button "התנתקות"); ready → `<Shell/>` (stub until Task 7).
- `vercel.json`: rewrite `/__/auth/:path*` → `https://<VITE_FIREBASE_PROJECT_ID>.firebaseapp.com/__/auth/:path*` (literal project id filled in during Task 11), then SPA fallback `/(.*)` → `/index.html`.

- [ ] **Step 1: Write failing test** `App.test.tsx` mocking `useAuth` for each status: signedOut shows "התחברות עם Google" and clicking calls `signIn`; denied shows "אין לך גישה לרשימה הזו" and no list content; ready renders the shell stub.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: google sign-in gate with allowlist`

---

### Task 7: Shell and List tab

**Files:**
- Create: `src/ui/Shell.tsx`, `src/ui/ListTab.tsx`, `src/ui/ItemRow.tsx`, `src/ui/relativeTime.ts`, `src/app/useShoppingData.ts`
- Modify: `src/app/App.tsx`
- Test: `tests/ui/ListTab.test.tsx`, `tests/ui/relativeTime.test.ts`

**Interfaces:**
- Consumes: Task 3 logic, Task 4 repo.
- Produces:
  - `useShoppingData(user): { items: Item[]; catalog: CatalogEntry[]; actions: { add(input: AddInput): void; toggle(item: Item): void; remove(item: Item): void; undoRemove(): void; finish(): void; setFavorite(key: string, name: string, fav: boolean): void; setDept(item: Item, dept: DeptId): void } }` — actions are fire-and-forget; rejected promises surface through `onError(message: string)` passed by Shell.
  - `ListTab` props: `{ items: Item[]; onToggle(item: Item): void; onFinish(): void; renderRow?: (item: Item) => ReactNode }` (Task 8 injects swipe rows via `renderRow`).
  - `relativeTime(ms: number | null, now: number): string` — `"עכשיו"` (<60s or null), `"לפני N דק'"`, `"לפני N שע'"`, `"לפני N ימים"`.
  - `Shell`: header "הרשימה שלנו", status line `"{n} פריטים · עודכן ע"י {updatedBy} {relativeTime}"` from the most recently updated item (omit the "עודכן" part when the list is empty), bottom tabs `📝 רשימה / ⭐ מועדפים / 🕘 אחרונים`, FAB `+` (opens AddSheet in Task 9), error toast.
- [ ] **Step 1: Write failing tests:**
  - ListTab groups headings in department order with emoji+label; item shows name, `×N`, and note line when present
  - clicking an active item calls `onToggle`; in-cart items render under "בעגלה (N)" with line-through class
  - "סיימתי קנייה" visible only when cart non-empty; click calls `onFinish`
  - empty list shows "הרשימה ריקה — לחצו + כדי להוסיף"
  - `relativeTime(null, now) === 'עכשיו'`, `relativeTime(now-120000, now) === "לפני 2 דק'"`
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement; style with theme variables (cards, badge, gradient FAB).
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: shell and list tab`

---

### Task 8: Swipe actions, department picker, undo

**Files:**
- Create: `src/ui/SwipeRow.tsx`, `src/ui/DeptPicker.tsx`, `src/ui/UndoToast.tsx`
- Modify: `src/ui/Shell.tsx` (pass `renderRow` to ListTab)
- Test: `tests/ui/SwipeRow.test.tsx`, `tests/ui/DeptPicker.test.tsx`, `tests/ui/UndoToast.test.tsx`

**Interfaces:**
- `SwipeRow` props: `{ children: ReactNode; actions: Array<{ label: string; icon: string; onAction(): void }> }` — horizontal pointer drag (RTL: reveal on swipe toward the leading edge, threshold 60px) reveals action buttons; buttons always exist in the DOM with `aria-label` for accessibility; tapping content when open closes it instead of toggling.
- Row actions: `🗑 מחק` → remove + UndoToast; `📂 העבר מחלקה` → DeptPicker; `⭐ מועדף` / `☆ הסר ממועדפים` → setFavorite.
- `DeptPicker` props: `{ current: DeptId; onPick(d: DeptId): void; onClose(): void }` — all 14 departments in order.
- `UndoToast` props: `{ message: string; onUndo(): void; onExpire(): void; durationMs?: number }` (default 4000).
- [ ] **Step 1: Write failing tests:** action buttons call their callbacks; DeptPicker lists 14 options and calls `onPick('frozen')`; UndoToast shows "נמחק · בטל", calls `onUndo` on click, and `onExpire` after 4000 ms with fake timers (and not before).
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: swipe actions, department picker and undo`

---

### Task 9: Add sheet

**Files:**
- Create: `src/ui/AddSheet.tsx`
- Modify: `src/ui/Shell.tsx`
- Test: `tests/ui/AddSheet.test.tsx`

**Interfaces:**
- Props: `{ catalog: CatalogEntry[]; activeKeys: Set<string>; onAdd(input: AddInput): void; onClose(): void }`.
- Layout per spec §3.3 / approved `quantity.html` option 1: name input (autofocus, placeholder "מה להוסיף?"), stepper `−` qty `+` (min 1), `📝` toggles a note input (placeholder "הערה"). Empty input → `chipsOf` sections "⭐ מועדפים" / "🕘 אחרונים"; typing → `suggestionsFor` list plus final row `➕ הוסף "{text}"`.
- [ ] **Step 1: Write failing tests:**
  - typing "חלב", pressing `+` twice, Enter → `onAdd({name:'חלב', qty:3, note:''})`; afterwards input empty, qty shows 1, note hidden/empty, sheet still open
  - `−` at qty 1 stays 1
  - note: click 📝, type "3%", Enter → note `'3%'`
  - whitespace-only name + Enter → `onAdd` not called
  - clicking a favorite chip → `onAdd({name, qty:1, note:''})`
  - typing "חל" shows favorite "חלב" above "חלה" and a `➕ הוסף "חל"` row
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement as a bottom sheet (backdrop click / swipe-down closes); wire FAB in Shell.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: add sheet with quantity, note, chips and suggestions`

---

### Task 10: Favorites and Recent tabs

**Files:**
- Create: `src/ui/FavoritesTab.tsx`, `src/ui/RecentTab.tsx`
- Modify: `src/ui/Shell.tsx`
- Test: `tests/ui/FavoritesTab.test.tsx`, `tests/ui/RecentTab.test.tsx`

**Interfaces:**
- Both props: `{ catalog: CatalogEntry[]; activeKeys: Set<string>; onAdd(input: AddInput): void; onSetFavorite(key: string, name: string, fav: boolean): void }`.
- Favorites uses `favoritesOf`; Recent uses `recentsOf` and `relativeTime(lastBoughtAt)`.
- [ ] **Step 1: Write failing tests:** tapping a row calls `onAdd({name, qty:1, note:''})` and shows a brief "נוסף ✓"; star toggle calls `onSetFavorite` with the inverted value without calling `onAdd`; rows whose key is in `activeKeys` show "ברשימה ✓"; empty states "עוד אין מועדפים — סמנו ⭐ בהחלקה" / "עוד לא סיימתם קנייה".
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat: favorites and recent tabs`

---

### Task 11: Offline banner, PWA install, deploy

**Files:**
- Create: `src/ui/OfflineBanner.tsx`, `public/icons/icon-192.png`, `public/icons/icon-512.png`, `public/apple-touch-icon.png` (pastel cart icon), `docs/SETUP.md`
- Modify: `vite.config.ts` (PWA manifest), `src/ui/Shell.tsx`, `vercel.json` (real project id)
- Test: `tests/ui/OfflineBanner.test.tsx`

**Interfaces:**
- `OfflineBanner` props: `{ online: boolean }`; Shell derives `online` from `navigator.onLine` + `online`/`offline` events.
- Manifest: `name: "הרשימה שלנו"`, `short_name: "קניות"`, `lang: "he"`, `dir: "rtl"`, `display: "standalone"`, `theme_color: "#fdf1f3"`, `background_color: "#fdf1f3"`; `index.html` adds `apple-mobile-web-app-capable` and `apple-touch-icon`.

- [ ] **Step 1: Write failing test:** banner renders "לא מחובר — יסונכרן כשתחזור הקליטה" when `online=false`, nothing when `true`.
- [ ] **Step 2:** `npm test` → FAIL.
- [ ] **Step 3:** Implement banner, manifest, icons.
- [ ] **Step 4:** `npm test` and `npm run test:emulator` → PASS; `npm run build` → succeeds and `dist/manifest.webmanifest` exists.
- [ ] **Step 5:** Write `docs/SETUP.md` (Hebrew, step by step): create Firebase project; enable Google provider; create Firestore (region `eur3`); copy web config into Vercel env vars `VITE_FIREBASE_*` with `VITE_FIREBASE_AUTH_DOMAIN=<app>.vercel.app`; add `<app>.vercel.app` to Firebase Authorized domains and `https://<app>.vercel.app/__/auth/handler` to the OAuth client's redirect URIs in Google Cloud; `npx firebase deploy --only firestore:rules`; install on iPhone via Safari → Share → Add to Home Screen.
- [ ] **Step 6: Commit** `feat: offline banner, pwa manifest and setup guide`
- [ ] **Step 7: Manual verification with the user** on both iPhones (spec §9): install, sign in, live sync both directions, airplane mode add/toggle then reconnect, finish shopping → recents, swipe + undo, stranger Gmail sees "אין גישה".
