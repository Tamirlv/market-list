import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { ALLOWED_EMAILS, isAllowed } from '../../src/config/allowlist';

const rules = readFileSync('firestore.rules', 'utf8');
const rulesEmails = rules.match(/'[^'\s]+@[^'\s]+'/g)?.map((s) => s.slice(1, -1)) ?? [];

describe('allowlist', () => {
  it('every allowed email appears in firestore.rules', () => {
    for (const email of ALLOWED_EMAILS) expect(rules).toContain(`'${email}'`);
  });

  it('firestore.rules lists exactly the allowed emails', () => {
    expect(rulesEmails).toHaveLength(ALLOWED_EMAILS.length);
    expect([...rulesEmails].sort()).toEqual([...ALLOWED_EMAILS].sort());
  });

  it('isAllowed is case-insensitive', () => {
    expect(isAllowed(ALLOWED_EMAILS[0].toUpperCase())).toBe(true);
    expect(isAllowed('X@Gmail.com'.replace('X', 'tamirlevi22'))).toBe(true);
  });

  it('rejects null, undefined and strangers', () => {
    expect(isAllowed(null)).toBe(false);
    expect(isAllowed(undefined)).toBe(false);
    expect(isAllowed('stranger@gmail.com')).toBe(false);
  });
});
