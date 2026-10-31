/**
 * The closed set of fonts a report can use. The same woff2 files back the
 * designer (served from /report-fonts) and the PDF printer (inlined as data
 * URIs by the backend), so text wraps the same in both.
 */

export interface FontFamilyDef {
  id: string; // CSS family name
  label: string;
  slug: string; // file prefix
  category: 'sans' | 'serif';
  weights: number[];
  italic: boolean; // a 400 italic exists
}

export const FONT_FAMILIES: FontFamilyDef[] = [
  { id: 'Mulish', label: 'Mulish', slug: 'mulish', category: 'sans', weights: [400, 600, 700, 800], italic: true },
  { id: 'Inter', label: 'Inter', slug: 'inter', category: 'sans', weights: [400, 600, 700], italic: false },
  { id: 'Open Sans', label: 'Open Sans', slug: 'open-sans', category: 'sans', weights: [400, 600, 700], italic: true },
  { id: 'Lato', label: 'Lato', slug: 'lato', category: 'sans', weights: [400, 700], italic: true },
  { id: 'Source Serif 4', label: 'Source Serif', slug: 'source-serif-4', category: 'serif', weights: [400, 600, 700], italic: true },
  { id: 'Libre Baskerville', label: 'Libre Baskerville', slug: 'libre-baskerville', category: 'serif', weights: [400, 700], italic: true },
  { id: 'Tinos', label: 'Times (Tinos)', slug: 'tinos', category: 'serif', weights: [400, 700], italic: true },
];

/** Arabic glyphs come from here whatever the chosen family. */
export const ARABIC_FAMILY = { id: 'Noto Naskh Arabic', slug: 'noto-naskh-arabic', weights: [400, 700] };

export const DEFAULT_FONT = 'Mulish';

const LATIN =
  'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD';
const LATIN_EXT =
  'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF';
const ARABIC =
  'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0897-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC';

export function fontById(id: string | undefined): FontFamilyDef {
  return FONT_FAMILIES.find((f) => f.id === id) ?? FONT_FAMILIES[0];
}

/** CSS font-family value for a chosen family, with Arabic fallback. */
export function fontStack(id: string | undefined): string {
  const f = fontById(id);
  return `'${f.id}', '${ARABIC_FAMILY.id}', ${f.category === 'serif' ? 'serif' : 'sans-serif'}`;
}

/** Closest weight a family actually has (no synthetic bold). */
export function nearestWeight(id: string | undefined, weight: number | undefined): number {
  const f = fontById(id);
  const want = weight ?? 400;
  return f.weights.reduce((best, w) => (Math.abs(w - want) < Math.abs(best - want) ? w : best), f.weights[0]);
}

/** Every font file name (for syncing into the backend). */
export function fontFiles(): string[] {
  const files: string[] = [];
  for (const f of FONT_FAMILIES) {
    for (const subset of ['latin', 'latin-ext']) {
      for (const w of f.weights) files.push(`${f.slug}-${subset}-${w}-normal.woff2`);
      if (f.italic) files.push(`${f.slug}-${subset}-400-italic.woff2`);
    }
  }
  for (const w of ARABIC_FAMILY.weights) files.push(`${ARABIC_FAMILY.slug}-arabic-${w}-normal.woff2`);
  return files;
}

/**
 * @font-face rules for every family. `urlFor(file)` returns the src URL
 * (a /report-fonts path in the browser, a data URI in the printer).
 */
export function fontFaceCss(urlFor: (file: string) => string): string {
  const rules: string[] = [];
  const face = (family: string, file: string, weight: number, style: string, range: string) =>
    `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:block;src:url(${urlFor(file)}) format('woff2');unicode-range:${range};}`;
  for (const f of FONT_FAMILIES) {
    for (const [subset, range] of [
      ['latin', LATIN],
      ['latin-ext', LATIN_EXT],
    ] as const) {
      for (const w of f.weights) rules.push(face(f.id, `${f.slug}-${subset}-${w}-normal.woff2`, w, 'normal', range));
      if (f.italic) rules.push(face(f.id, `${f.slug}-${subset}-400-italic.woff2`, 400, 'italic', range));
    }
  }
  for (const w of ARABIC_FAMILY.weights) {
    rules.push(face(ARABIC_FAMILY.id, `${ARABIC_FAMILY.slug}-arabic-${w}-normal.woff2`, w, 'normal', ARABIC));
  }
  return rules.join('\n');
}
