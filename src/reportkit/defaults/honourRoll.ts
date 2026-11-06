import type { BarStyle, Block, CanvasBlock, ColumnsBlock, Zone } from '../types';
import { block, rect, text, zone } from './kit';

/**
 * The Honour Roll look shared by the grades 1–8 report card and progress
 * report: a diploma. The crest sits over a centred school name, thick-and-thin
 * rules frame the title, and navy ink carries the text. Gold is only ever a
 * line or a tint: it doesn't reach 4.5:1 on white, so it never carries text.
 */
export const HONOUR = {
  NAVY: '#003068',
  GOLD: '#b8964a',
  GOLD_SOFT: '#dccb98',
  GOLD_TINT: '#fbf7ea',
  /** Level 4 to Level 1 of the achievement chart, strongest first. */
  LEVEL_TINTS: ['#cfdbec', '#dee6f2', '#ebf0f7', '#f5f7fb'],
  INK: '#1d2633',
  GREY: '#515b69',
  HEADING_FONT: 'Libre Baskerville',
  TEXT_FONT: 'Source Serif 4',
} as const;

/** A4 with the 18mm margins the report templates print with. */
export const MARGIN = 68;
export const WIDTH = 794 - 2 * MARGIN;

/** A section heading centred between two gold lines. `labelWidth` is roughly how wide the text prints. */
export function honourHeading(label: string, labelWidth: number, size = 12, marginBottom = 10, extra: Partial<CanvasBlock> = {}): CanvasBlock {
  const side = (WIDTH - labelWidth) / 2 - 12;
  const height = size * 1.9;
  return block<CanvasBlock>({
    type: 'canvas',
    name: label,
    height,
    marginBottom,
    elements: [
      text(0, 0, WIDTH, height, label, { fontFamily: HONOUR.HEADING_FONT, fontSize: size, fontWeight: 700, letterSpacing: size < 14 ? 1 : 0, color: HONOUR.NAVY, align: 'center', verticalAlign: 'middle', lineHeight: 1.2 }),
      rect(0, height / 2, side, 0.75, HONOUR.GOLD),
      rect(WIDTH - side, height / 2, side, 0.75, HONOUR.GOLD),
    ],
    ...extra,
  });
}

/** The document's title on a gold tint, between thick-and-thin rules. */
export function honourTitleBand(y: number, height: number, value: string) {
  return [
    rect(MARGIN, y, WIDTH, 2.5, HONOUR.NAVY),
    rect(MARGIN, y + 4, WIDTH, 0.75, HONOUR.GOLD),
    rect(MARGIN, y + 4.75, WIDTH, height, HONOUR.GOLD_TINT, { name: 'Title tint' }),
    text(MARGIN, y + 4.75, WIDTH, height, value, { fontFamily: HONOUR.HEADING_FONT, fontSize: 13.5, fontWeight: 700, letterSpacing: 1.2, color: HONOUR.NAVY, align: 'center', verticalAlign: 'middle', lineHeight: 1.2 }, { name: 'Title', overflow: 'shrink' }),
    rect(MARGIN, y + 4.75 + height, WIDTH, 0.75, HONOUR.GOLD),
    rect(MARGIN, y + 6.5 + height, WIDTH, 2.5, HONOUR.NAVY),
  ];
}

/** Pages after the first open with the same thick-and-thin rule. */
export function honourPageTop(): Zone {
  return zone(MARGIN, [rect(MARGIN, 38, WIDTH, 2.5, HONOUR.NAVY), rect(MARGIN, 42, WIDTH, 0.75, HONOUR.GOLD)]);
}

/** A subject's name on a gold tint, a navy line above and a gold line below. */
export function honourSubjectBar(fontSize: number): BarStyle {
  return {
    background: HONOUR.GOLD_TINT,
    color: HONOUR.NAVY,
    fontFamily: HONOUR.HEADING_FONT,
    fontSize,
    fontWeight: 700,
    padding: 9,
    paddingX: 15,
    ruleTop: { color: HONOUR.NAVY, width: 3 },
    ruleBottom: { color: HONOUR.GOLD, width: 1 },
  };
}

/** A heading and what it introduces, never split across a page. */
export function honourKept(name: string, heading: Block, body: Block, marginBottom: number): ColumnsBlock {
  return block<ColumnsBlock>({ type: 'columns', name, gap: 0, marginBottom, columns: [{ width: 100, blocks: [heading, body] }] });
}
