import { describe, expect, it } from 'vitest';
import { DEFAULT_TEMPLATES } from './defaults';
import { validateTemplate } from './validate';

describe('validateTemplate', () => {
  it('accepts every built-in default', () => {
    for (const d of DEFAULT_TEMPLATES) {
      const r = validateTemplate(d.build());
      expect(r.errors, d.key).toEqual([]);
    }
  });

  it('rejects junk and explains why', () => {
    expect(validateTemplate(null).ok).toBe(false);
    const doc = DEFAULT_TEMPLATES[0].build();
    const bad = { ...doc, blocks: [...doc.blocks, { ...doc.blocks[0] }, { id: 'x', type: 'script' }] };
    const r = validateTemplate(bad);
    expect(r.ok).toBe(false);
    expect(r.errors.join(' ')).toMatch(/share the id/);
    expect(r.errors.join(' ')).toMatch(/unknown block type "script"/);
  });

  it('only allows uploaded (data URI) images', () => {
    const doc = DEFAULT_TEMPLATES[0].build();
    doc.header.elements.push({ id: 'img9', type: 'image', x: 0, y: 0, w: 10, h: 10, src: { kind: 'url', url: 'https://evil.test/x.png' } });
    expect(validateTemplate(doc).errors.join(' ')).toMatch(/images must be uploaded/);
  });

  it('checks extra field keys and choices', () => {
    const doc = DEFAULT_TEMPLATES[0].build();
    doc.fields = [
      { key: 'Bad Key', label: 'A', type: 'text' },
      { key: 'placement', label: 'Placement', type: 'select', options: [] },
    ];
    const msg = validateTemplate(doc).errors.join(' ');
    expect(msg).toMatch(/needs a key/);
    expect(msg).toMatch(/at least one choice/);
  });
});
