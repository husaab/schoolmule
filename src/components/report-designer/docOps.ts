/**
 * Pure operations on a TemplateDoc for the designer. Every function returns a
 * new document (the old one is kept for undo); nothing mutates its input.
 */
import { reId } from '@/reportkit/factory';
import type { Block, CanvasElement, TemplateDoc, Zone } from '@/reportkit/types';
import { cloneJson } from '@/reportkit/util';

export type ZoneKey = 'header' | 'footer' | 'firstHeader' | 'firstFooter';

export type Selection =
  | { kind: 'block'; id: string }
  | { kind: 'element'; id: string }
  | { kind: 'zone'; zone: ZoneKey }
  | { kind: 'page' }
  | null;

/** Where an element lives: a header/footer zone, or a free area / free page block. */
export type ElementContainer = { kind: 'zone'; zone: ZoneKey } | { kind: 'block'; blockId: string };

export const ZONE_LABELS: Record<ZoneKey, string> = {
  header: 'Header',
  footer: 'Footer',
  firstHeader: 'First-page header',
  firstFooter: 'First-page footer',
};

function produce(doc: TemplateDoc, fn: (draft: TemplateDoc) => void): TemplateDoc {
  const draft = cloneJson(doc);
  fn(draft);
  return draft;
}

/** Every block list in the document (body + columns), outermost first. */
function blockLists(doc: TemplateDoc): Block[][] {
  const lists: Block[][] = [];
  const walk = (list: Block[]) => {
    lists.push(list);
    list.forEach((b) => {
      if (b.type === 'columns') b.columns.forEach((c) => walk(c.blocks));
    });
  };
  walk(doc.blocks);
  return lists;
}

export function findBlock(doc: TemplateDoc, id: string): { block: Block; list: Block[]; index: number } | null {
  for (const list of blockLists(doc)) {
    const index = list.findIndex((b) => b.id === id);
    if (index >= 0) return { block: list[index], list, index };
  }
  // A block placed in a fixed box on a free page.
  for (const list of blockLists(doc)) {
    for (const b of list) {
      if (b.type === 'freePage' || b.type === 'canvas') {
        for (const el of b.elements) if (el.type === 'block' && el.block.id === id) return { block: el.block, list: [el.block], index: 0 };
      }
    }
  }
  return null;
}

function zones(doc: TemplateDoc): Array<[ZoneKey, Zone]> {
  return (['header', 'footer', 'firstHeader', 'firstFooter'] as const)
    .map((k) => [k, doc[k]] as [ZoneKey, Zone | null | undefined])
    .filter((z): z is [ZoneKey, Zone] => !!z[1]);
}

export function findElement(doc: TemplateDoc, id: string): { element: CanvasElement; list: CanvasElement[]; container: ElementContainer } | null {
  for (const [key, zone] of zones(doc)) {
    const el = zone.elements.find((e) => e.id === id);
    if (el) return { element: el, list: zone.elements, container: { kind: 'zone', zone: key } };
  }
  for (const list of blockLists(doc)) {
    for (const b of list) {
      if (b.type === 'canvas' || b.type === 'freePage') {
        const el = b.elements.find((e) => e.id === id);
        if (el) return { element: el, list: b.elements, container: { kind: 'block', blockId: b.id } };
      }
    }
  }
  return null;
}

export function elementListOf(doc: TemplateDoc, container: ElementContainer): CanvasElement[] | null {
  if (container.kind === 'zone') return doc[container.zone]?.elements ?? null;
  const found = findBlock(doc, container.blockId);
  if (found && (found.block.type === 'canvas' || found.block.type === 'freePage')) return found.block.elements;
  return null;
}

export function updateBlock(doc: TemplateDoc, id: string, patch: Partial<Block> | ((b: Block) => Block)): TemplateDoc {
  return produce(doc, (d) => {
    const found = findBlock(d, id);
    if (!found) return;
    const next = typeof patch === 'function' ? patch(found.block) : ({ ...found.block, ...patch } as Block);
    Object.keys(found.block).forEach((k) => delete (found.block as unknown as Record<string, unknown>)[k]);
    Object.assign(found.block, next);
  });
}

export function updateElement(doc: TemplateDoc, id: string, patch: Partial<CanvasElement>): TemplateDoc {
  return produce(doc, (d) => {
    const found = findElement(d, id);
    if (found) Object.assign(found.element, patch);
  });
}

export function updateZone(doc: TemplateDoc, zone: ZoneKey, patch: Partial<Zone>): TemplateDoc {
  return produce(doc, (d) => {
    const z = d[zone];
    if (z) Object.assign(z, patch);
  });
}

/** Give page 1 its own header/footer (a copy of the regular one), or drop it. */
export function setFirstPageZone(doc: TemplateDoc, zone: 'firstHeader' | 'firstFooter', on: boolean): TemplateDoc {
  return produce(doc, (d) => {
    const source = zone === 'firstHeader' ? d.header : d.footer;
    d[zone] = on ? { height: source.height, elements: source.elements.map((e) => reId(e)) } : null;
  });
}

export function insertBlock(doc: TemplateDoc, block: Block, afterId?: string | null): TemplateDoc {
  return produce(doc, (d) => {
    if (afterId) {
      const found = findBlock(d, afterId);
      if (found && found.list !== undefined) {
        found.list.splice(found.index + 1, 0, block);
        return;
      }
    }
    d.blocks.push(block);
  });
}

export function removeBlock(doc: TemplateDoc, id: string): TemplateDoc {
  return produce(doc, (d) => {
    const found = findBlock(d, id);
    if (found) found.list.splice(found.index, 1);
  });
}

export function duplicateBlock(doc: TemplateDoc, id: string): { doc: TemplateDoc; newId: string | null } {
  let newId: string | null = null;
  const next = produce(doc, (d) => {
    const found = findBlock(d, id);
    if (!found) return;
    const copy = reId(found.block);
    newId = copy.id;
    found.list.splice(found.index + 1, 0, copy);
  });
  return { doc: next, newId };
}

/** Move a block up (-1) or down (+1) among its siblings. */
export function moveBlock(doc: TemplateDoc, id: string, delta: number): TemplateDoc {
  return produce(doc, (d) => {
    const found = findBlock(d, id);
    if (!found) return;
    const to = Math.max(0, Math.min(found.list.length - 1, found.index + delta));
    if (to === found.index) return;
    const [b] = found.list.splice(found.index, 1);
    found.list.splice(to, 0, b);
  });
}

/** Reorder the top-level body: put block `id` at `toIndex`. */
export function moveBlockTo(doc: TemplateDoc, id: string, toIndex: number): TemplateDoc {
  return produce(doc, (d) => {
    const from = d.blocks.findIndex((b) => b.id === id);
    if (from < 0) return;
    const [b] = d.blocks.splice(from, 1);
    d.blocks.splice(Math.max(0, Math.min(d.blocks.length, toIndex)), 0, b);
  });
}

export function insertElement(doc: TemplateDoc, container: ElementContainer, element: CanvasElement): TemplateDoc {
  return produce(doc, (d) => {
    const list = elementListOf(d, container);
    if (!list) return;
    const z = list.reduce((m, e) => Math.max(m, e.z ?? 0), 0);
    list.push({ ...element, z: z + 1 });
  });
}

export function removeElement(doc: TemplateDoc, id: string): TemplateDoc {
  return produce(doc, (d) => {
    const found = findElement(d, id);
    if (!found) return;
    const i = found.list.findIndex((e) => e.id === id);
    if (i >= 0) found.list.splice(i, 1);
  });
}

export function duplicateElement(doc: TemplateDoc, id: string): { doc: TemplateDoc; newId: string | null } {
  let newId: string | null = null;
  const next = produce(doc, (d) => {
    const found = findElement(d, id);
    if (!found) return;
    const copy = reId(found.element);
    copy.x += 12;
    copy.y += 12;
    copy.z = found.list.reduce((m, e) => Math.max(m, e.z ?? 0), 0) + 1;
    newId = copy.id;
    found.list.push(copy);
  });
  return { doc: next, newId };
}

/** Bring an element to the front (+1) or send it to the back (-1). */
export function restackElement(doc: TemplateDoc, id: string, dir: 1 | -1): TemplateDoc {
  return produce(doc, (d) => {
    const found = findElement(d, id);
    if (!found) return;
    const zs = found.list.map((e) => e.z ?? 0);
    found.element.z = dir > 0 ? Math.max(...zs) + 1 : Math.min(...zs) - 1;
  });
}

export function updateDoc(doc: TemplateDoc, fn: (draft: TemplateDoc) => void): TemplateDoc {
  return produce(doc, fn);
}

/** The flat outline of the body for the Layers panel. */
export function outline(doc: TemplateDoc): Array<{ block: Block; depth: number }> {
  const out: Array<{ block: Block; depth: number }> = [];
  const walk = (list: Block[], depth: number) =>
    list.forEach((b) => {
      out.push({ block: b, depth });
      if (b.type === 'columns') b.columns.forEach((c) => walk(c.blocks, depth + 1));
    });
  walk(doc.blocks, 0);
  return out;
}

/** Rename a field's key everywhere it is printed ({{extra.key}}) or tested (show/hide rules). */
export function renameFieldKey(doc: TemplateDoc, from: string, to: string): TemplateDoc {
  if (from === to) return doc;
  const esc = from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const json = JSON.stringify(doc)
    .replace(new RegExp(`\\{\\{\\s*extra\\.${esc}(?=\\s*[|}])`, 'g'), `{{extra.${to}`)
    .replace(new RegExp(`"field":"extra\\.${esc}"`, 'g'), `"field":"extra.${to}"`);
  return JSON.parse(json) as TemplateDoc;
}

