import type { LetterBand, MarkRules, MarkValue } from './types';

/** Ontario letter bands (the legacy report card rubric). */
export const ONTARIO_LETTER_BANDS: LetterBand[] = [
  { min: 90, label: 'A+' },
  { min: 85, label: 'A' },
  { min: 80, label: 'A-' },
  { min: 77, label: 'B+' },
  { min: 73, label: 'B' },
  { min: 70, label: 'B-' },
  { min: 67, label: 'C+' },
  { min: 63, label: 'C' },
  { min: 60, label: 'C-' },
  { min: 57, label: 'D+' },
  { min: 53, label: 'D' },
  { min: 50, label: 'D-' },
];

/** The legacy report card rules: letters for grades 1–3, NN.N% for 4–8, R below 50, I for no evidence. */
export const DEFAULT_MARK_RULES: MarkRules = {
  rules: [
    { id: 'primary', grades: ['1', '2', '3'], format: 'letter' },
    { id: 'junior', grades: ['4', '5', '6', '7', '8'], format: 'percent', decimals: 1 },
  ],
  letterBands: ONTARIO_LETTER_BANDS,
  below: { enabled: true, threshold: 50, text: 'R' },
  noEvidence: 'I',
  notApplicable: '—',
};

/** A percent as a letter: whole-percent rounding, then the first band it reaches. */
export function percentToLetter(percent: number, bands: LetterBand[], belowText = 'R'): string {
  const rounded = Math.round(percent);
  const sorted = [...bands].sort((a, b) => b.min - a.min);
  for (const band of sorted) {
    if (rounded >= band.min) return band.label;
  }
  return belowText;
}

/**
 * One mark as printed. Mirrors the legacy formatReportMark:
 *   'I' → noEvidence, null → notApplicable, below threshold → R (checked on the
 *   unrounded value), else the first matching rule's format.
 */
export function formatMark(value: MarkValue | undefined, grade: string, rules: MarkRules): string {
  if (value === 'I') return rules.noEvidence;
  if (value === null || value === undefined) return rules.notApplicable;
  const pct = Number(value);
  if (Number.isNaN(pct)) return rules.noEvidence;
  if (rules.below.enabled && pct < rules.below.threshold) return rules.below.text;

  const g = String(grade ?? '').trim().toUpperCase();
  const rule = rules.rules.find((r) => !r.grades || r.grades.length === 0 || r.grades.map((x) => x.toUpperCase()).includes(g));
  const format = rule?.format ?? 'percent';
  if (format === 'letter') return percentToLetter(pct, rules.letterBands, rules.below.enabled ? rules.below.text : 'R');
  const decimals = rule?.decimals ?? 1;
  return format === 'percent' ? `${pct.toFixed(decimals)}%` : pct.toFixed(decimals);
}

/**
 * The line a subject card prints when its mark includes modified assessments.
 * Repeats are removed ignoring case. One or two labels print; none, or more
 * than two, stop at the sentence. The backend's utils/modifiedMark.js
 * modifiedNote does the same for the legacy templates.
 */
export function modifiedNoteText(labels: Array<string | null | undefined>): string {
  const unique = new Map<string, string>();
  for (const raw of labels) {
    const label = String(raw ?? '').trim().replace(/\s+/g, ' ');
    if (label && !unique.has(label.toLowerCase())) unique.set(label.toLowerCase(), label);
  }
  const named = unique.size >= 1 && unique.size <= 2;
  return named ? `* Includes modified assessments: ${[...unique.values()].join('; ')}` : '* Includes modified assessments';
}

/** E/G/S/N averaged the way the legacy progress report computes "Overall". */
export function overallRating(workHabits: string, behaviour: string): string {
  const scale: Record<string, number> = { E: 4, G: 3, S: 2, N: 1 };
  const a = scale[String(workHabits || '').toUpperCase()];
  const b = scale[String(behaviour || '').toUpperCase()];
  if (!a && !b) return '';
  if (!a) return behaviour;
  if (!b) return workHabits;
  const avg = (a + b) / 2;
  if (avg >= 3.5) return 'E';
  if (avg >= 2.5) return 'G';
  if (avg >= 1.5) return 'S';
  return 'N';
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export type DateStyle = 'long' | 'medium' | 'iso';

/** 'YYYY-MM-DD' → "November 14, 2026" (long), "Nov 14, 2026" (medium) or as is (iso). Calendar date, no time zone shift. */
export function formatDate(iso: string, style: DateStyle = 'long'): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso ?? ''));
  if (!m) return String(iso ?? '');
  const [, y, mo, d] = m;
  const month = MONTHS[Number(mo) - 1];
  if (!month) return String(iso);
  if (style === 'iso') return `${y}-${mo}-${d}`;
  if (style === 'medium') return `${month.slice(0, 3)} ${Number(d)}, ${y}`;
  return `${month} ${Number(d)}, ${y}`;
}

/** "Term 2" → "SECOND TERM" (the legacy formatTermDisplay). */
export function termDisplay(term: string): string {
  const map: Record<string, string> = {
    'term 1': 'FIRST TERM',
    'term 2': 'SECOND TERM',
    'term 3': 'THIRD TERM',
    'term 4': 'FOURTH TERM',
    '1': 'FIRST TERM',
    '2': 'SECOND TERM',
    '3': 'THIRD TERM',
    '4': 'FOURTH TERM',
  };
  const key = String(term ?? '').toLowerCase().trim();
  return map[key] || String(term ?? '').toUpperCase() || 'TERM';
}

export const GRADES = ['JK', 'SK', '1', '2', '3', '4', '5', '6', '7', '8'] as const;

export function gradeLabel(grade: string): string {
  const g = String(grade ?? '').toUpperCase();
  if (g === 'JK') return 'Junior Kindergarten';
  if (g === 'SK') return 'Senior Kindergarten';
  return g ? `Grade ${g}` : '';
}

export function gradeNumber(grade: string): number {
  const g = String(grade ?? '').toUpperCase();
  if (g === 'JK') return -1;
  if (g === 'SK') return 0;
  const n = Number.parseInt(g, 10);
  return Number.isNaN(n) ? 0 : n;
}
