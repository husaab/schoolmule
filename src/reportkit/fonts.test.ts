import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { fontFaceCss, fontFiles } from './fonts';

describe('report fonts', () => {
  it('bundles a real bold italic for Source Serif, so bold in an italic comment is never faked', () => {
    expect(fontFiles()).toContain('source-serif-4-latin-700-italic.woff2');
    expect(fontFiles()).toContain('source-serif-4-latin-ext-700-italic.woff2');
    const css = fontFaceCss((file) => file);
    expect(css).toMatch(/font-family:'Source Serif 4';font-style:italic;font-weight:700;[^}]*source-serif-4-latin-700-italic\.woff2/);
  });

  it('adds no bold italic to the other families', () => {
    expect(fontFiles().filter((f) => f.includes('700-italic') && !f.startsWith('source-serif-4'))).toEqual([]);
  });

  it('ships every file it names', () => {
    const dir = resolve(__dirname, '../../public/report-fonts');
    expect(fontFiles().filter((f) => !existsSync(join(dir, f)))).toEqual([]);
  });
});
