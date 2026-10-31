import { fontStack, nearestWeight } from './fonts';
import type { BarStyle, BoxStyle, PanelStyle, TableLook, TextStyle, Theme } from './types';

/**
 * Template values become CSS only through these guards, so a template can
 * never inject arbitrary CSS (no url(), no expressions) into a printed page.
 */

const COLOR = /^(#[0-9a-fA-F]{3,8}|rgba?\(\s*[\d.]+%?\s*,\s*[\d.]+%?\s*,\s*[\d.]+%?\s*(,\s*[\d.]+\s*)?\)|[a-zA-Z]{3,20})$/;

export function safeColor(value: unknown, fallback = ''): string {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  return COLOR.test(v) ? v : fallback;
}

export function num(value: unknown, fallback: number, min = -100000, max = 100000): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export function px(value: unknown, fallback: number, min = 0, max = 5000): string {
  return `${num(value, fallback, min, max)}px`;
}

/** Inline declarations for a text style (falls back to the theme). */
export function textCss(style: TextStyle | undefined, theme?: Partial<Theme>): string {
  const s = style ?? {};
  const out: string[] = [];
  const family = s.fontFamily ?? theme?.fontFamily;
  if (family) out.push(`font-family:${fontStack(family)}`);
  if (s.fontSize !== undefined) out.push(`font-size:${px(s.fontSize, 12, 4, 200)}`);
  if (s.fontWeight !== undefined) out.push(`font-weight:${nearestWeight(family, s.fontWeight)}`);
  if (s.italic) out.push('font-style:italic');
  if (s.underline) out.push('text-decoration:underline');
  const color = safeColor(s.color);
  if (color) out.push(`color:${color}`);
  if (s.align) out.push(`text-align:${['left', 'center', 'right', 'justify'].includes(s.align) ? s.align : 'left'}`);
  if (s.lineHeight !== undefined) out.push(`line-height:${num(s.lineHeight, 1.3, 0.6, 4)}`);
  if (s.letterSpacing !== undefined) out.push(`letter-spacing:${px(s.letterSpacing, 0, -10, 40)}`);
  if (s.uppercase) out.push('text-transform:uppercase');
  return out.join(';');
}

export function boxCss(box: BoxStyle | undefined): string {
  if (!box) return '';
  const out: string[] = [];
  const bg = safeColor(box.background);
  if (bg) out.push(`background:${bg}`);
  const bw = num(box.borderWidth, 0, 0, 40);
  if (bw > 0) out.push(`border:${bw}px solid ${safeColor(box.borderColor, '#000')}`);
  if (box.borderRadius) out.push(`border-radius:${px(box.borderRadius, 0, 0, 400)}`);
  if (box.padding) out.push(`padding:${px(box.padding, 0, 0, 400)}`);
  return out.join(';');
}

export function barCss(bar: BarStyle | undefined, fallbackBg = '', theme?: Partial<Theme>): string {
  const b = bar ?? {};
  const out: string[] = [];
  const bg = safeColor(b.background, fallbackBg);
  if (bg) out.push(`background:${bg}`);
  const color = safeColor(b.color);
  if (color) out.push(`color:${color}`);
  if (b.fontSize !== undefined) out.push(`font-size:${px(b.fontSize, 12, 4, 200)}`);
  out.push(`font-weight:${nearestWeight(theme?.fontFamily, b.fontWeight ?? 700)}`);
  out.push(`text-align:${b.align && ['left', 'center', 'right'].includes(b.align) ? b.align : 'left'}`);
  if (b.uppercase) out.push('text-transform:uppercase');
  if (b.padding !== undefined || b.paddingX !== undefined) {
    const y = num(b.padding, 6, 0, 100);
    out.push(`padding:${y}px ${num(b.paddingX, y, 0, 100)}px`);
  }
  // A table cell's height is a minimum: longer text still grows it.
  if (b.height) out.push(`height:${px(b.height, 0, 0, 600)}`);
  return out.join(';');
}

/** A text box: background, border, radius, padding, a bar down the left edge, a minimum height. */
export function panelCss(panel: PanelStyle | undefined): string {
  if (!panel) return '';
  const out = [boxCss(panel)];
  const accent = safeColor(panel.accentColor);
  if (accent) out.push(`border-left:${px(panel.accentWidth, 4, 0, 40)} solid ${accent}`);
  if (panel.minHeight) out.push(`min-height:${px(panel.minHeight, 0, 0, 1000)}`);
  return out.filter(Boolean).join(';');
}

/** CSS variables + font for a table-like block. */
export function tableCss(look: TableLook, theme: Theme): string {
  const out: string[] = [];
  out.push(`--rk-bw:${px(look.borderWidth, 1, 0, 20)}`);
  out.push(`--rk-obw:${px(look.outerBorderWidth ?? look.borderWidth, 1, 0, 20)}`);
  out.push(`--rk-bc:${safeColor(look.borderColor, theme.borderColor || '#000')}`);
  out.push(`--rk-pad:${px(look.cellPadding, 4, 0, 40)}`);
  if (look.cellPaddingX !== undefined) out.push(`--rk-padx:${px(look.cellPaddingX, 6, 0, 40)}`);
  if (look.fontSize !== undefined) out.push(`font-size:${px(look.fontSize, theme.fontSize, 4, 100)}`);
  if (look.fontFamily) out.push(`font-family:${fontStack(look.fontFamily)}`);
  const color = safeColor(look.color);
  if (color) out.push(`color:${color}`);
  if (look.verticalAlign && ['top', 'middle', 'bottom'].includes(look.verticalAlign)) out.push(`--rk-va:${look.verticalAlign}`);
  if (look.lineHeight !== undefined) out.push(`line-height:${num(look.lineHeight, 1.3, 0.6, 4)}`);
  return out.join(';');
}

export function colgroup(widths: number[]): string {
  const total = widths.reduce((s, w) => s + Math.max(0, num(w, 0)), 0) || 1;
  return `<colgroup>${widths.map((w) => `<col style="width:${((Math.max(0, num(w, 0)) / total) * 100).toFixed(3)}%">`).join('')}</colgroup>`;
}

export function alignClass(align: string | undefined): string {
  if (align === 'center') return ' rk-c';
  if (align === 'right') return ' rk-r';
  return '';
}
