import { describe, it, expect } from 'vitest';
import { relativeTime } from '../../src/ui/relativeTime';

describe('relativeTime', () => {
  const now = 1_700_000_000_000;
  it('null and <60s are now', () => {
    expect(relativeTime(null, now)).toBe('עכשיו');
    expect(relativeTime(now - 59_000, now)).toBe('עכשיו');
  });
  it('minutes, hours, days', () => {
    expect(relativeTime(now - 120_000, now)).toBe("לפני 2 דק'");
    expect(relativeTime(now - 3 * 3_600_000, now)).toBe("לפני 3 שע'");
    expect(relativeTime(now - 2 * 86_400_000, now)).toBe('לפני 2 ימים');
  });
});
