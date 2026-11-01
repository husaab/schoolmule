import type { ImageSource } from './types';

/**
 * Images shipped with the engine, for `{ kind: 'builtin', name }` sources.
 * The files live in public/report-assets/ (served at /report-assets/<name>
 * to the designer) and are copied into the backend bundle
 * (vendor/reportkit/assets) by scripts/build-reportkit.mjs, where the PDF
 * printer inlines them as data URIs. Only these names are valid.
 */
export interface BuiltinImageDef {
  name: string;
  label: string;
  group: 'Banners' | 'Kindergarten icons';
}

export const BUILTIN_IMAGES: BuiltinImageDef[] = [
  { name: 'jk-banner.jpg', label: 'Junior Kindergarten Progress Report Card banner', group: 'Banners' },
  { name: 'language.png', label: 'Language and communication', group: 'Kindergarten icons' },
  { name: 'emotional.png', label: 'Emotional development', group: 'Kindergarten icons' },
  { name: 'reading-writing.png', label: 'Reading and writing', group: 'Kindergarten icons' },
  { name: 'colours-shapes.png', label: 'Colours and shapes', group: 'Kindergarten icons' },
  { name: 'numbers.png', label: 'Numbers', group: 'Kindergarten icons' },
  { name: 'fine-motor.png', label: 'Fine motor skills', group: 'Kindergarten icons' },
  { name: 'gross-motor.png', label: 'Gross motor skills', group: 'Kindergarten icons' },
  { name: 'cognitive.png', label: 'Cognitive development', group: 'Kindergarten icons' },
  { name: 'arabic.png', label: 'Arabic letters', group: 'Kindergarten icons' },
  { name: 'islamic-studies.png', label: 'Islamic studies', group: 'Kindergarten icons' },
];

export const BUILTIN_IMAGE_PATH = '/report-assets/';

export function isBuiltinImage(name: unknown): name is string {
  return typeof name === 'string' && BUILTIN_IMAGES.some((b) => b.name === name);
}

export function builtinImageLabel(name: string): string {
  return BUILTIN_IMAGES.find((b) => b.name === name)?.label ?? 'Built-in image';
}

/** Built-in image names a template uses (the printer inlines only these). */
export function builtinImagesIn(value: unknown): string[] {
  const found = new Set<string>();
  const walk = (v: unknown, depth: number) => {
    if (!v || typeof v !== 'object' || depth > 40) return;
    if (Array.isArray(v)) {
      v.forEach((x) => walk(x, depth + 1));
      return;
    }
    const o = v as Partial<Extract<ImageSource, { kind: 'builtin' }>> & Record<string, unknown>;
    if (o.kind === 'builtin' && isBuiltinImage(o.name)) found.add(o.name);
    for (const x of Object.values(o)) walk(x, depth + 1);
  };
  walk(value, 0);
  return [...found];
}
