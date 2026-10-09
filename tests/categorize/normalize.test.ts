import { describe, it, expect } from 'vitest';
import { normalizeName } from '../../src/categorize/normalize';

describe('normalizeName', () => {
  it('unifies plural/singular and niqqud', () => {
    expect(normalizeName('עגבניות')).toBe(normalizeName('עגבניה'));
    expect(normalizeName(' עַגְבָנִיָּה ')).toBe(normalizeName('עגבניות'));
  });
  it('handles final letters', () => {
    expect(normalizeName('מלפפונים')).toBe(normalizeName('מלפפון'));
  });
  it('eggs', () => {
    expect(normalizeName('ביצים')).toBe(normalizeName('ביצה'));
  });
  it('does not conflate milk and challah', () => {
    expect(normalizeName('חלב')).not.toBe(normalizeName('חלה'));
  });
  it('keeps short words stable', () => {
    expect(normalizeName('מים')).toBe(normalizeName('מים'));
    expect(normalizeName('מים')).not.toBe(normalizeName('מ'));
    expect(normalizeName('מים')).toBe('מימ');
  });
  it('normalizes each word of multi-word names', () => {
    expect(normalizeName('גבינה  צהובה')).toBe(normalizeName('גבינות צהובות'));
  });
  it('lowercases latin and treats geresh and apostrophe alike', () => {
    expect(normalizeName('Coca Cola')).toBe('coca cola');
    expect(normalizeName("קוטג'")).toBe(normalizeName('קוטג׳'));
  });
});
