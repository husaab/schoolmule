import { formatDate, type DateStyle } from './format';
import { escapeHtml, getPath } from './util';

/**
 * Merge fields: `{{path}}`, `{{path|filter}}` or `{{path|filter|filter}}`
 * (applied left to right) inside template text. Filters:
 *   long, medium, iso   dates
 *   upper, lower        case
 *   title               "FIRST TERM" → "First Term"
 *   first               the first word
 *   fullyear            "2025 - 2026" → "2025-2026"
 *   shortyear           "2025 - 2026" → "2025-26"
 *   phone               "(416) 555-0100" → "416-555-0100"
 *   shortaddress        "1 Main St, Toronto, ON M1M 1M1" → "1 Main St, Toronto, M1M 1M1"
 * (the last four print a school's details as the paper templates do;
 * schoolmule-backend templates/printKit.js has the same rules).
 * Everything — template text and data alike — is HTML-escaped; then
 * **bold** and *italic* markers and line breaks become markup.
 */
const TOKEN = /\{\{\s*([a-zA-Z0-9_.]+)\s*((?:\|\s*[a-zA-Z]+\s*)*)\}\}/g;

export type MergeScope = Record<string, unknown>;

const YEAR_PAIR = /^(\d{4})\s*-\s*(\d{4})$/;

function applyFilters(value: string, filters: string | undefined): string {
  if (!filters) return value;
  return filters
    .split('|')
    .map((f) => f.trim())
    .filter(Boolean)
    .reduce((v, f) => applyFilter(v, f), value);
}

function applyFilter(value: string, filter: string | undefined): string {
  if (!filter) return value;
  switch (filter) {
    case 'fullyear': {
      const m = YEAR_PAIR.exec(value.trim());
      return m ? `${m[1]}-${m[2]}` : value;
    }
    case 'shortyear': {
      const m = YEAR_PAIR.exec(value.trim());
      return m ? `${m[1]}-${m[2].slice(2)}` : value;
    }
    case 'phone': {
      const digits = value.replace(/\D/g, '');
      return digits.length === 10 ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}` : value.trim();
    }
    case 'shortaddress':
      return value.replace(/,\s*(?:ON|Ontario)\s+(?=[A-Z]\d[A-Z])/i, ', ').trim();
    case 'long':
    case 'medium':
    case 'iso':
      return formatDate(value, filter as DateStyle);
    case 'upper':
      return value.toUpperCase();
    case 'lower':
      return value.toLowerCase();
    case 'title':
      return value.toLowerCase().replace(/(^|[\s(/-])(\p{L})/gu, (_m, sep: string, ch: string) => sep + ch.toUpperCase());
    case 'first':
      return value.trim().split(/\s+/)[0] ?? '';
    default:
      return value;
  }
}

function valueText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return String(value.length);
  if (typeof value === 'object') return '';
  return String(value);
}

const OPTIONAL = /\[\[([\s\S]*?)\]\]/g;

/**
 * Optional parts: `[[ | {{school.website}}]]` prints only when at least one
 * of its fields has a value, so separators never dangle ("a | b |").
 */
function resolveOptional(template: string, scope: MergeScope): string {
  return template.replace(OPTIONAL, (_m, inner: string) => {
    const paths = [...inner.matchAll(TOKEN)].map((m) => m[1]);
    if (paths.length === 0) return inner;
    return paths.some((p) => valueText(getPath(scope, p)).trim() !== '') ? inner : '';
  });
}

/** Plain-text substitution (no markup), e.g. for titles and attributes. */
export function mergeText(template: string, scope: MergeScope): string {
  return resolveOptional(String(template ?? ''), scope).replace(TOKEN, (_m, path: string, filters?: string) =>
    applyFilters(valueText(getPath(scope, path)), filters),
  );
}

/** Template text → safe HTML with merge fields filled in. */
export function mergeHtml(template: string, scope: MergeScope): string {
  const source = resolveOptional(String(template ?? ''), scope);
  let html = '';
  let last = 0;
  TOKEN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TOKEN.exec(source))) {
    html += escapeHtml(source.slice(last, match.index));
    html += escapeHtml(applyFilters(valueText(getPath(scope, match[1])), match[2]));
    last = match.index + match[0].length;
  }
  html += escapeHtml(source.slice(last));
  return html
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>')
    .replace(/\r?\n/g, '<br>');
}

/** Merge-field paths used in a piece of template text. */
export function mergeFieldsIn(template: string): string[] {
  const out: string[] = [];
  String(template ?? '').replace(TOKEN, (_m, path: string) => {
    out.push(path);
    return '';
  });
  return out;
}
