import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '../src/app/App';

describe('smoke', () => {
  it('index.html is Hebrew RTL', () => {
    const html = readFileSync(resolve(__dirname, '../index.html'), 'utf8');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('lang="he"');
  });
  it('App renders the title', () => {
    render(<App />);
    expect(screen.getByText('הרשימה שלנו')).toBeInTheDocument();
  });
});
