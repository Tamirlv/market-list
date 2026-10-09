import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('index.html is Hebrew RTL', () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="he"');
  });
});
