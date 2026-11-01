import { DEFAULT_MARK_RULES } from '../format';
import type {
  Block,
  CanvasElement,
  DocType,
  ImageElement,
  RatingScale,
  ShapeElement,
  TableCellDef,
  TemplateDoc,
  TextElement,
  TextStyle,
  Theme,
  Zone,
} from '../types';
import { cloneJson } from '../util';

/** Small builders the default templates are written with. */

let counter = 0;
/** Stable, readable ids for default templates (reset per template). */
export function resetIds(): void {
  counter = 0;
}
export function id(prefix: string): string {
  counter += 1;
  return `${prefix}${counter}`;
}

export function text(x: number, y: number, w: number, h: number, value: string, style: TextStyle = {}, extra: Partial<TextElement> = {}): TextElement {
  return { id: id('t'), type: 'text', x, y, w, h, text: value, style, ...extra };
}

export function logo(x: number, y: number, w: number, h: number, extra: Partial<ImageElement> = {}): ImageElement {
  return { id: id('img'), name: 'Logo', type: 'image', x, y, w, h, src: { kind: 'asset', asset: 'logo' }, fit: 'contain', ...extra };
}

/** A filled rectangle, e.g. a coloured rule under a header. */
export function rect(x: number, y: number, w: number, h: number, fill: string, extra: Partial<ShapeElement> = {}): ShapeElement {
  return { id: id('s'), name: 'Rule', type: 'shape', shape: 'rect', x, y, w, h, fill, strokeWidth: 0, ...extra };
}

export function zone(height: number, elements: CanvasElement[]): Zone {
  return { height, elements };
}

export function cell(textValue: string, extra: Partial<TableCellDef> = {}): TableCellDef {
  return { text: textValue, ...extra };
}

export function block<T extends Block>(b: Omit<T, 'id'> & { id?: string }): T {
  return { id: b.id ?? id('b'), ...b } as T;
}

export function template(input: {
  docType: DocType;
  size?: 'letter' | 'a4';
  margin?: Partial<TemplateDoc['page']['margin']>;
  theme?: Partial<Theme>;
  scales: RatingScale[];
  header: Zone;
  footer: Zone;
  firstHeader?: Zone | null;
  firstFooter?: Zone | null;
  blocks: Block[];
  marks?: TemplateDoc['marks'];
}): TemplateDoc {
  return {
    schemaVersion: 1,
    docType: input.docType,
    page: {
      size: input.size ?? 'letter',
      margin: { top: 0, right: 56, bottom: 0, left: 56, ...input.margin },
    },
    theme: { fontFamily: 'Mulish', fontSize: 12, color: '#111111', borderColor: '#000000', accent: '#2c5aa0', ...input.theme },
    scales: cloneJson(input.scales),
    marks: cloneJson(input.marks ?? DEFAULT_MARK_RULES),
    fields: [],
    header: input.header,
    footer: input.footer,
    firstHeader: input.firstHeader ?? null,
    firstFooter: input.firstFooter ?? null,
    blocks: input.blocks,
  };
}

/** "School · address | phone | website / © year" footer with "Page X of Y". */
export function schoolFooter(color = '#4472c4'): Zone {
  return zone(64, [
    text(
      40,
      14,
      460,
      40,
      '**{{school.name}}**\n{{school.address}}[[ | {{school.phone}}]][[ | {{school.website}}]]\n© {{meta.schoolYear}}, All Rights Reserved',
      { fontSize: 7.5, color, lineHeight: 1.35 },
      { name: 'School address' },
    ),
    text(616, 26, 160, 18, 'Page {{page.number}} of {{page.count}}', { fontSize: 11, fontWeight: 700, align: 'right' }, { name: 'Page number' }),
  ]);
}
