import { blockFlowables, elementHtml, type Flowable, type RenderCtx } from './blocks';
import { REPORTKIT_CSS } from './css';
import { fontFaceCss, fontStack } from './fonts';
import { BUILTIN_IMAGE_PATH, isBuiltinImage } from './images';
import { planPages, type Fragment, type PlanItem } from './splitPlan';
import { num, px, safeColor } from './style';
import {
  PAGE_SIZES,
  type FreePageBlock,
  type ImageSource,
  type RenderWarning,
  type ReportData,
  type TemplateDoc,
  type Zone,
} from './types';
import { escapeHtml } from './util';

export interface RenderOptions {
  /** editor: placeholders for missing images; print: nothing. */
  mode?: 'print' | 'editor';
  /** Turn an image source into a URL; default reads data.assets, passes urls through and serves built-ins from /report-assets. */
  resolveImage?: (src: ImageSource, data: ReportData) => string | null;
}

export interface RenderResult {
  pageCount: number;
  pageSize: { width: number; height: number };
  warnings: RenderWarning[];
}

export function defaultResolveImage(src: ImageSource, data: ReportData): string | null {
  // Only uploaded images (data URIs): never let a template make the page fetch a URL.
  if (src.kind === 'url') return typeof src.url === 'string' && /^data:image\/(png|jpe?g|gif|webp|svg\+xml);base64,/.test(src.url) ? src.url : null;
  // Served from the web app's public/report-assets; the PDF printer passes its
  // own resolver with data URIs (its page has no network).
  if (src.kind === 'builtin') return isBuiltinImage(src.name) ? `${BUILTIN_IMAGE_PATH}${src.name}` : null;
  return data.assets?.[src.asset] ?? null;
}

/** Add the engine's base stylesheet to a document once. */
export function ensureStyles(d: Document): void {
  if (d.getElementById('rk-base-css')) return;
  const style = d.createElement('style');
  style.id = 'rk-base-css';
  style.textContent = REPORTKIT_CSS;
  d.head.appendChild(style);
}

/** Add the report fonts to a document once. */
export function ensureFonts(d: Document, urlFor: (file: string) => string): void {
  if (d.getElementById('rk-font-css')) return;
  const style = d.createElement('style');
  style.id = 'rk-font-css';
  style.textContent = fontFaceCss(urlFor);
  d.head.appendChild(style);
}

function zoneHeight(zone: Zone | null | undefined, pageHeight: number): number {
  return num(zone?.height, 0, 0, pageHeight / 2);
}

function fragStyle(f: Flowable, marginTop: number, marginBottom: number): string {
  const b = f.block;
  const width = num(b.width, 100, 5, 100);
  const align = b.align === 'center' ? 'center' : b.align === 'right' ? 'flex-end' : 'flex-start';
  return [
    marginTop ? `margin-top:${px(marginTop, 0, -40, 2000)}` : '',
    marginBottom ? `margin-bottom:${px(marginBottom, 0, 0, 2000)}` : '',
    width < 100 ? `width:${width}%;align-self:${align}` : '',
  ]
    .filter(Boolean)
    .join(';');
}

function tableHtml(f: Extract<Flowable, { kind: 'table' }>, from = 0, to = f.rows.length, mark = false): string {
  const rows = f.rows
    .slice(from, to)
    .map((r, k) => (mark ? r.html.replace(/^<tr/, `<tr data-r="${from + k}"`) : r.html))
    .join('');
  return `${f.open}${rows}${f.close}`;
}

/**
 * Render a report into `root` as fixed-size pages. Async because text is
 * measured only once the fonts have loaded. Same code in the designer and
 * the PDF printer.
 */
export async function renderReport(
  root: HTMLElement,
  doc: TemplateDoc,
  data: ReportData,
  options: RenderOptions = {},
): Promise<RenderResult> {
  const d = root.ownerDocument;
  ensureStyles(d);
  const mode = options.mode ?? 'print';
  const resolve = options.resolveImage ?? defaultResolveImage;
  const size = PAGE_SIZES[doc.page?.size] ?? PAGE_SIZES.letter;
  const margin = {
    top: num(doc.page?.margin?.top, 0, 0, 400),
    right: num(doc.page?.margin?.right, 48, 0, 400),
    bottom: num(doc.page?.margin?.bottom, 0, 0, 400),
    left: num(doc.page?.margin?.left, 48, 0, 400),
  };
  const contentWidth = Math.max(100, size.width - margin.left - margin.right);
  const theme = doc.theme;

  const warnings: RenderWarning[] = [];
  const scales = new Map((doc.scales ?? []).map((s) => [s.id, s]));
  const ctx: RenderCtx = {
    doc,
    data,
    scope: { ...data, page: { number: '', count: '' } },
    mode,
    scales,
    warnings,
    contentWidth,
    image: (src) => (src ? resolve(src, data) : null),
  };

  root.classList.add('rk-root');
  root.style.cssText = [
    `font-family:${fontStack(theme?.fontFamily)}`,
    `font-size:${px(theme?.fontSize, 11, 4, 60)}`,
    `color:${safeColor(theme?.color, '#111')}`,
    'line-height:1.3',
    `width:${size.width}px`,
  ].join(';');

  // Zones: page 1 may have its own header/footer.
  const headerFor = (i: number): { zone: Zone; kind: string } =>
    i === 0 && doc.firstHeader ? { zone: doc.firstHeader, kind: 'firstHeader' } : { zone: doc.header, kind: 'header' };
  const footerFor = (i: number): { zone: Zone; kind: string } =>
    i === 0 && doc.firstFooter ? { zone: doc.firstFooter, kind: 'firstFooter' } : { zone: doc.footer, kind: 'footer' };
  const bodyTop = (i: number) => zoneHeight(headerFor(i).zone, size.height) + margin.top;
  const bodyBottom = (i: number) => size.height - zoneHeight(footerFor(i).zone, size.height) - margin.bottom;
  const bodyHeight = (i: number) => Math.max(40, bodyBottom(i) - bodyTop(i));

  for (const [kind, zone] of [
    ['header', doc.header],
    ['footer', doc.footer],
    ['firstHeader', doc.firstHeader],
    ['firstFooter', doc.firstFooter],
  ] as const) {
    if (!zone) continue;
    for (const el of zone.elements ?? []) {
      if (el.y < -1 || el.y + el.h > zone.height + 1) {
        warnings.push({
          code: 'zone-overflow',
          elementId: el.id,
          message: `"${el.name || el.type}" sticks out of the ${kind === 'firstHeader' ? 'first-page header' : kind === 'firstFooter' ? 'first-page footer' : kind}.`,
        });
      }
    }
  }

  // 1. Blocks → flowables.
  const flows: Flowable[] = (doc.blocks ?? []).flatMap((b) => blockFlowables(b, ctx));

  // First/last flowable of each block carry its margins (subject cards make many).
  const firstOf = new Map<string, number>();
  const lastOf = new Map<string, number>();
  flows.forEach((f, i) => {
    if (!firstOf.has(f.block.id)) firstOf.set(f.block.id, i);
    lastOf.set(f.block.id, i);
  });
  const marginTopOf = (i: number) => (firstOf.get(flows[i].block.id) === i ? num(flows[i].block.marginTop, 0, -40, 2000) : 0);
  const marginBottomOf = (i: number) => (lastOf.get(flows[i].block.id) === i ? num(flows[i].block.marginBottom, 0, 0, 2000) : 0);

  // 2. Measure at the real content width, with fonts loaded.
  root.innerHTML = '';
  const host = d.createElement('div');
  host.className = 'rk-measure';
  host.style.width = `${contentWidth}px`;
  host.innerHTML = flows
    .map((f, i) => {
      if (f.kind === 'atomic') return `<div class="rk-frag" data-m="${i}" style="${fragStyle(f, 0, 0)}">${f.html}</div>`;
      if (f.kind === 'table') return `<div class="rk-frag" data-m="${i}" style="${fragStyle(f, 0, 0)}">${tableHtml(f, 0, f.rows.length, true)}</div>`;
      return '';
    })
    .join('');
  root.appendChild(host);
  void host.offsetHeight;
  if (d.fonts?.ready) await d.fonts.ready;

  const items: PlanItem[] = flows.map((f, i) => {
    if (f.kind === 'break') return { kind: 'break' };
    if (f.kind === 'fullPage') return { kind: 'fullPage' };
    const wrap = host.querySelector<HTMLElement>(`[data-m="${i}"]`);
    const total = wrap ? wrap.getBoundingClientRect().height : 0;
    if (f.kind === 'atomic') {
      return { kind: 'atomic', height: total, marginTop: marginTopOf(i), marginBottom: marginBottomOf(i), breakBefore: f.breakBefore };
    }
    const table = wrap?.querySelector('table');
    const head = table?.tHead ? table.tHead.getBoundingClientRect().height : 0;
    const rows = f.rows.map((r, k) => {
      const tr = wrap?.querySelector<HTMLElement>(`tr[data-r="${k}"]`);
      return { height: tr ? tr.getBoundingClientRect().height : 0, keepWithNext: r.keepWithNext, dropAtTop: r.dropAtTop };
    });
    const sum = rows.reduce((s, r) => s + r.height, 0);
    const chrome = Math.max(0, (table ? table.getBoundingClientRect().height : total) - head - sum);
    return {
      kind: 'table',
      head,
      chrome,
      rows,
      marginTop: marginTopOf(i),
      marginBottom: marginBottomOf(i),
      breakBefore: f.breakBefore,
      keepTogether: f.keepTogether,
    };
  });

  // 3. Plan pages.
  const plan = planPages(items, bodyHeight);
  const pageCount = plan.pages.length;

  // 4. Build pages.
  const fragmentHtml = (fr: Fragment, pageIndex: number, k: number): string => {
    const f = flows[fr.item];
    const id = escapeHtml(f.block.id);
    const style = fragStyle(f, fr.marginTop, fr.marginBottom);
    // A table placed whole (kept together, or no rows) has no row range: print all of it.
    let inner = f.kind === 'table' ? tableHtml(f, fr.rows?.[0] ?? 0, fr.rows?.[1] ?? f.rows.length) : f.kind === 'atomic' ? f.html : '';
    if (fr.oversize) {
      const avail = bodyHeight(pageIndex);
      const scale = Math.max(0.45, Math.min(1, avail / Math.max(1, fr.height)));
      inner = `<div style="height:${(fr.height * scale).toFixed(2)}px;overflow:hidden"><div style="transform:scale(${scale.toFixed(4)});transform-origin:top left;width:${(100 / scale).toFixed(3)}%">${inner}</div></div>`;
      warnings.push({
        code: 'oversize-block',
        blockId: f.block.id,
        page: pageIndex + 1,
        message: `"${f.block.name || f.block.type}" is taller than a page${scale <= 0.45 ? ' and is cut off' : ` and was shrunk to ${Math.round(scale * 100)}%`}.`,
      });
    }
    return `<div class="rk-frag" data-rk-block="${id}" data-rk-frag="${k}" style="${style}">${inner}</div>`;
  };

  const zoneHtml = (zone: Zone, kind: string, top: number): string => {
    const h = zoneHeight(zone, size.height);
    const els = (zone.elements ?? []).map((e) => elementHtml(e, ctx)).join('');
    return `<div class="rk-zone" data-rk-zone="${kind}" style="top:${top}px;height:${h}px">${els}</div>`;
  };

  const background = safeColor(doc.page?.background, '#fff');
  const fragCount = new Map<string, number>();
  const pagesHtml = plan.pages
    .map((p, pi) => {
      ctx.scope = { ...data, page: { number: pi + 1, count: pageCount } };
      const pageStyle = `width:${size.width}px;height:${size.height}px;background:${background}`;
      const header = headerFor(pi);
      const footer = footerFor(pi);
      const zones = () =>
        zoneHtml(header.zone, header.kind, 0) + zoneHtml(footer.zone, footer.kind, size.height - zoneHeight(footer.zone, size.height));

      if (p.fullPage !== undefined) {
        const fb = flows[p.fullPage].block as FreePageBlock;
        const els = (fb.elements ?? []).map((e) => elementHtml(e, ctx)).join('');
        return `<div class="rk-page" data-rk-page="${pi}" style="${pageStyle}">${fb.useZones ? zones() : ''}<div class="rk-region" data-rk-block="${escapeHtml(fb.id)}" data-rk-free="1" style="position:absolute;left:0;top:0;width:${size.width}px;height:${size.height}px">${els}</div></div>`;
      }

      const body = p.fragments
        .map((fr) => {
          const id = flows[fr.item].block.id;
          const k = fragCount.get(id) ?? 0;
          fragCount.set(id, k + 1);
          return fragmentHtml(fr, pi, k);
        })
        .join('');
      const top = bodyTop(pi);
      return `<div class="rk-page" data-rk-page="${pi}" style="${pageStyle}">${zones()}<div class="rk-body" style="top:${top}px;left:${margin.left}px;width:${contentWidth}px;height:${bodyBottom(pi) - top}px">${body}</div></div>`;
    })
    .join('');

  root.innerHTML = pagesHtml;
  void root.offsetHeight;
  if (d.fonts?.ready) await d.fonts.ready;

  // 5. Text and blocks in fixed boxes that don't fit.
  root.querySelectorAll<HTMLElement>('[data-rk-fit="shrink"]').forEach((el) => {
    const id = el.getAttribute('data-rk-el') ?? undefined;
    let size = parseFloat(d.defaultView?.getComputedStyle(el).fontSize ?? '12') || 12;
    const start = size;
    let guard = 60;
    while (el.scrollHeight > el.clientHeight + 0.5 && size > 5 && guard-- > 0) {
      size -= 0.5;
      el.style.fontSize = `${size}px`;
    }
    if (el.scrollHeight > el.clientHeight + 0.5) {
      warnings.push({ code: 'text-clipped', elementId: id, message: 'Some text doesn’t fit its box and is cut off.' });
    } else if (size < start && !warnings.some((w) => w.code === 'text-shrunk' && w.elementId === id)) {
      warnings.push({ code: 'text-shrunk', elementId: id, message: `Text was shrunk from ${start}px to ${size}px to fit its box.` });
    }
  });
  root.querySelectorAll<HTMLElement>('[data-rk-fit="block"],[data-rk-fit="clip"]').forEach((el) => {
    const inner = el.firstElementChild as HTMLElement | null;
    if (!inner) return;
    const natural = inner.scrollHeight;
    const box = el.clientHeight;
    if (natural <= box + 0.5) return;
    const id = el.getAttribute('data-rk-el') ?? undefined;
    if (el.getAttribute('data-rk-fit') === 'block') {
      const scale = Math.max(0.4, box / natural);
      inner.style.transform = `scale(${scale.toFixed(4)})`;
      inner.style.width = `${(100 / scale).toFixed(3)}%`;
      if (natural * scale > box + 0.5) {
        warnings.push({ code: 'block-clipped', elementId: id, message: 'A block in a fixed box is too long; the end is cut off.' });
      } else {
        warnings.push({ code: 'text-shrunk', elementId: id, message: `A block was shrunk to ${Math.round(scale * 100)}% to fit its box.` });
      }
    } else {
      warnings.push({ code: 'block-clipped', elementId: id, message: 'A block in a fixed box is cut off.' });
    }
  });

  return { pageCount, pageSize: { width: size.width, height: size.height }, warnings };
}
