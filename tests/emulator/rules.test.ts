import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

let env: RulesTestEnvironment;

const validItem = {
  name: 'חלב',
  key: 'חלב',
  qty: 1,
  note: '',
  dept: 'dairy',
  inCart: false,
  updatedBy: 'x',
};

const allowed = () =>
  env.authenticatedContext('u1', { email: 'tamirlevi22@gmail.com', email_verified: true }).firestore();
const allowedUpper = () =>
  env.authenticatedContext('u3', { email: 'EdenVilf@Gmail.com', email_verified: true }).firestore();
const stranger = () =>
  env.authenticatedContext('u2', { email: 'stranger@gmail.com', email_verified: true }).firestore();
const unverified = () =>
  env.authenticatedContext('u4', { email: 'tamirlevi22@gmail.com', email_verified: false }).firestore();
const anon = () => env.unauthenticatedContext().firestore();

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-shopping-list',
    firestore: { rules: readFileSync('firestore.rules', 'utf8'), host: '127.0.0.1', port: 8080 },
  });
});

beforeEach(async () => {
  await env.clearFirestore();
});

afterAll(async () => {
  await env.cleanup();
});

describe('firestore rules', () => {
  it('allowed verified user can read and write items and catalog', async () => {
    const db = allowed();
    await assertSucceeds(setDoc(doc(db, 'households/main/items/a'), validItem));
    await assertSucceeds(getDoc(doc(db, 'households/main/items/a')));
    await assertSucceeds(updateDoc(doc(db, 'households/main/items/a'), { inCart: true }));
    await assertSucceeds(setDoc(doc(db, 'households/main/catalog/k'), { name: 'חלב' }));
    await assertSucceeds(getDoc(doc(db, 'households/main/catalog/k')));
  });

  it('email match is case-insensitive', async () => {
    await assertSucceeds(setDoc(doc(allowedUpper(), 'households/main/items/a'), validItem));
  });

  it('denies strangers', async () => {
    const db = stranger();
    await assertFails(setDoc(doc(db, 'households/main/items/a'), validItem));
    await assertFails(getDoc(doc(db, 'households/main/items/a')));
    await assertFails(setDoc(doc(db, 'households/main/catalog/k'), { name: 'x' }));
  });

  it('denies unauthenticated', async () => {
    const db = anon();
    await assertFails(setDoc(doc(db, 'households/main/items/a'), validItem));
    await assertFails(getDoc(doc(db, 'households/main/items/a')));
  });

  it('denies allowed email that is not verified', async () => {
    const db = unverified();
    await assertFails(setDoc(doc(db, 'households/main/items/a'), validItem));
    await assertFails(getDoc(doc(db, 'households/main/items/a')));
  });

  it.each([
    ['qty 0', { qty: 0 }],
    ['qty 1.5', { qty: 1.5 }],
    ['empty name', { name: '' }],
    ['blank name', { name: '   ' }],
    ['61-char name', { name: 'א'.repeat(61) }],
    ['121-char note', { note: 'א'.repeat(121) }],
  ])('denies invalid item write: %s', async (_label, patch) => {
    const db = allowed();
    await assertFails(setDoc(doc(db, 'households/main/items/a'), { ...validItem, ...patch }));
  });

  it('accepts boundary values (60-char name, 120-char note)', async () => {
    await assertSucceeds(
      setDoc(doc(allowed(), 'households/main/items/a'), {
        ...validItem,
        name: 'א'.repeat(60),
        note: 'א'.repeat(120),
      }),
    );
  });

  it('denies invalid item update', async () => {
    const db = allowed();
    await assertSucceeds(setDoc(doc(db, 'households/main/items/a'), validItem));
    await assertFails(updateDoc(doc(db, 'households/main/items/a'), { qty: 0 }));
  });

  it('denies any path outside households/main', async () => {
    const db = allowed();
    await assertFails(setDoc(doc(db, 'households/other/items/a'), validItem));
    await assertFails(setDoc(doc(db, 'other/x'), { a: 1 }));
    await assertFails(getDoc(doc(db, 'other/x')));
  });
});
