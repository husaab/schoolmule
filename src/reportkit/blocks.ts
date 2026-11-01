import { evaluateCondition } from './conditions';
import { formatMark, overallRating } from './format';
import { builtinImageLabel } from './images';
import { mergeHtml, type MergeScope } from './merge';
import { alignClass, barCss, boxCss, colgroup, num, panelCss, px, safeColor, tableCss, textCss } from './style';
import type {
  Block,
  Box4,
  CanvasElement,
  ColumnDef,
  CommentsTableBlock,
  FreePageBlock,
  ImageSource,
  LearningSkillsBlock,
  RatingKeyBlock,
  RatingScale,
  RenderWarning,
  ReportData,
  SignaturesBlock,
  SkillGroup,
  SkillGroupStyle,
  SkillItem,
  SkillsTableBlock,
  SubjectCardsBlock,
  SubjectFieldKey,
  SubjectRow,
  TableBlock,
  TableCellDef,
  TableRowDef,
  TemplateDoc,
  TextStyle,
} from './types';
import { escapeHtml, normName } from './util';

export interface RenderCtx {
  doc: TemplateDoc;
  data: ReportData;
  scope: MergeScope;
  mode: 'print' | 'editor';
  scales: Map<string, RatingScale>;
  warnings: RenderWarning[];
  contentWidth: number;
  image: (src: ImageSource | null | undefined) => string | null;
}

export interface TableRow {
  html: string;
  keepWithNext: boolean;
  /** A spacer left out when it would start a page (splitPlan). */
  dropAtTop?: boolean;
}

export type Flowable =
  | { kind: 'atomic'; block: Block; html: string; breakBefore: boolean }
  | {
      kind: 'table';
      block: Block;
      open: string;
      head: string;
      rows: TableRow[];
      close: string;
      breakBefore: boolean;
      keepTogether: boolean;
    }
  | { kind: 'break'; block: Block }
  | { kind: 'fullPage'; block: FreePageBlock };

// ─────────────────────────────────────────────────────────── helpers ──

/** Teacher-written text: escaped, **bold** kept, line breaks kept. */
export function dataHtml(text: unknown): string {
  return escapeHtml(text)
    .replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\r?\n/g, '<br>');
}

function warnOnce(ctx: RenderCtx, w: RenderWarning) {
  if (!ctx.warnings.some((x) => x.code === w.code && x.blockId === w.blockId && x.elementId === w.elementId)) {
    ctx.warnings.push(w);
  }
}

function alignName(align: string | undefined): string {
  return align === 'center' || align === 'right' ? align : 'left';
}

function imageHtml(ctx: RenderCtx, src: ImageSource | null | undefined, height: number | undefined, label: string): string {
  const url = ctx.image(src);
  const h = height ? `height:${px(height, 40, 4, 1000)};` : '';
  if (url) return `<img src="${escapeHtml(url)}" alt="" style="${h}">`;
  if (ctx.mode === 'editor' && src) {
    return `<span class="rk-placeholder" style="display:inline-flex;${h}min-width:80px">${escapeHtml(label)}</span>`;
  }
  return height ? `<span style="display:inline-block;${h}"></span>` : '';
}

function imageLabel(src: ImageSource | null | undefined): string {
  if (!src) return 'Image';
  if (src.kind === 'url') return 'Image';
  if (src.kind === 'builtin') return builtinImageLabel(src.name);
  return (
    { logo: 'School logo', principalSignature: "Principal's signature", stamp: 'School stamp', teacherSignature: "Teacher's signature" }[
      src.asset
    ] ?? 'Image'
  );
}

function ratingStyle(ctx: RenderCtx, scaleId: string | undefined, colored: boolean | undefined, value: string, blockId: string): string {
  if (!scaleId || !value) return '';
  const scale = ctx.scales.get(scaleId);
  if (!scale) return '';
  const level = scale.levels.find((l) => normName(l.code) === normName(value));
  if (!level) {
    warnOnce(ctx, {
      code: 'unknown-rating',
      blockId,
      message: `"${value}" is not on the ${scale.name} scale; it prints as written.`,
    });
    return '';
  }
  if (!colored) return '';
  const out: string[] = [];
  const bg = safeColor(level.color);
  if (bg) out.push(`background:${bg}`);
  const fg = safeColor(level.textColor);
  if (fg) out.push(`color:${fg}`);
  return out.join(';');
}

/** A text style's vertical alignment as a table-cell declaration. */
function valign(style: TextStyle | undefined): string {
  const v = style?.verticalAlign;
  return v === 'top' || v === 'middle' || v === 'bottom' ? `vertical-align:${v}` : '';
}

function cellHtml(ctx: RenderCtx, cell: TableCellDef, tag: 'td' | 'th' = 'td'): string {
  const attrs: string[] = [];
  if (cell.colSpan && cell.colSpan > 1) attrs.push(`colspan="${Math.floor(num(cell.colSpan, 1, 1, 50))}"`);
  if (cell.rowSpan && cell.rowSpan > 1) attrs.push(`rowspan="${Math.floor(num(cell.rowSpan, 1, 1, 200))}"`);
  const css: string[] = [];
  const bg = safeColor(cell.background);
  if (bg) css.push(`background:${bg}`);
  const t = textCss(cell.style);
  if (t) css.push(t);
  const va = valign(cell.style);
  if (va) css.push(va);
  if (cell.padding) {
    const p = (k: keyof Box4) => px(cell.padding?.[k], 0, 0, 400);
    css.push(`padding:${p('top')} ${p('right')} ${p('bottom')} ${p('left')}`);
  }
  let inner = '';
  if (cell.image) inner += imageHtml(ctx, cell.image, cell.imageHeight ?? 36, imageLabel(cell.image));
  if (cell.text) inner += (inner ? ' ' : '') + mergeHtml(cell.text, ctx.scope);
  if (cell.vertical) {
    attrs.push('class="rk-vertical"');
    inner = `<span>${inner}</span>`;
  }
  return `<${tag} ${attrs.join(' ')} style="${css.join(';')}">${inner}</${tag}>`;
}

function staticRowHtml(ctx: RenderCtx, row: TableRowDef, fill = false): string {
  // A filling row takes a table's extra height (see TableBlock.minHeight).
  const h = fill ? ' style="height:100%"' : row.height ? ` style="height:${px(row.height, 20, 4, 1000)}"` : '';
  return `<tr${h}>${row.cells.map((c) => cellHtml(ctx, c)).join('')}</tr>`;
}

function tableOpen(cls: string, styleCss: string, widths: number[]): string {
  return `<table class="rk-table ${cls}" style="${styleCss}">${colgroup(widths)}`;
}

function barRow(text: string, bar: SkillsTableBlock['groupBar'], colspan: number, fallbackBg: string, ctx: RenderCtx): TableRow {
  return {
    html: `<tr><td class="rk-bar" colspan="${colspan}" style="${barCss(bar, fallbackBg, ctx.doc.theme)}">${escapeHtml(text)}</td></tr>`,
    keepWithNext: true,
  };
}

/** "Fine Motor Skills:" → "fine motor skills" (how groupStyles match). */
function groupKey(name: unknown): string {
  return normName(name).replace(/\s*:$/, '');
}

/** The group bar's style for one group: its groupStyles entry, else a fallback colour by position. */
function groupLook(block: SkillsTableBlock, name: string, index: number): { bar: SkillsTableBlock['groupBar']; style: SkillGroupStyle | null } {
  const key = groupKey(name);
  const style = (block.groupStyles ?? []).find((s) => s && groupKey(s.match) === key && key !== '') ?? null;
  const fallbacks = (block.fallbackGroupColors ?? []).filter((c) => !!safeColor(c));
  const background = safeColor(style?.background) || (style || fallbacks.length === 0 ? '' : fallbacks[index % fallbacks.length]);
  const color = safeColor(style?.color);
  if (!background && !color) return { bar: block.groupBar, style };
  return { bar: { ...block.groupBar, ...(background ? { background } : {}), ...(color ? { color } : {}) }, style };
}

function groupIconHtml(ctx: RenderCtx, style: SkillGroupStyle | null): string {
  if (!style?.icon) return '';
  const url = ctx.image(style.icon);
  if (!url) return '';
  const h = num(style.iconHeight, 29, 4, 200);
  return `<img class="rk-icon" src="${escapeHtml(url)}" alt="" style="height:${h}px;width:auto;margin-left:21px;vertical-align:middle">`;
}

// ─────────────────────────────────────────────────────────── blocks ──

function tableBlock(block: TableBlock, ctx: RenderCtx): string {
  const rows = block.rows.filter((r) => evaluateCondition(r.showWhen, ctx.scope));
  const min = block.minHeight ? num(block.minHeight, 0, 0, 3000) : 0;
  const css = [tableCss(block, ctx.doc.theme), min ? `height:${min}px` : ''].filter(Boolean).join(';');
  return `${tableOpen('', css, block.columns)}<tbody>${rows
    .map((r, i) => staticRowHtml(ctx, r, min > 0 && i === rows.length - 1))
    .join('')}</tbody></table>`;
}

function textBlock(block: Extract<Block, { type: 'text' }>, ctx: RenderCtx): string {
  return `<div style="${[textCss(block.style), boxCss(block.box)].filter(Boolean).join(';')}">${mergeHtml(block.text, ctx.scope)}</div>`;
}

function ratingKey(block: RatingKeyBlock, ctx: RenderCtx): string {
  const scale = ctx.scales.get(block.scaleId);
  if (!scale) return ctx.mode === 'editor' ? `<div class="rk-placeholder" style="height:40px">Pick a rating scale</div>` : '';
  const levels = scale.levels;
  const look = tableCss(block, ctx.doc.theme);
  const titleCss = barCss({ background: block.titleBackground, color: block.titleColor }, '', ctx.doc.theme);

  if (block.layout === 'row') {
    const chips = levels
      .map((l) => {
        const chipCss = [safeColor(l.color) && `background:${safeColor(l.color)}`, safeColor(l.textColor) && `color:${safeColor(l.textColor)}`]
          .filter(Boolean)
          .join(';');
        return `<span class="rk-chip"><b style="${chipCss}">${escapeHtml(l.code)}</b>${escapeHtml(l.label)}</span>`;
      })
      .join('');
    const title = block.title ? `<div class="rk-card-head" style="${titleCss}">${escapeHtml(block.title)}</div>` : '';
    return `<div class="rk-card" style="${look}">${title}<div class="rk-card-body"><div class="rk-chips">${chips}</div></div></div>`;
  }

  if (block.layout === 'grid') {
    const perRow = Math.max(1, Math.floor(num(block.columns, Math.min(4, levels.length), 1, 8)));
    const rows: string[] = [];
    for (let i = 0; i < levels.length; i += perRow) {
      const slice = levels.slice(i, i + perRow);
      const cells = slice.map((l) => {
        const desc = block.showDescriptions && l.description ? `<span class="rk-caption">${escapeHtml(l.description)}</span>` : '';
        return `<td class="rk-c" style="${ratingStyle(ctx, block.scaleId, true, l.code, block.id)}"><strong>${escapeHtml(l.code)}</strong> – ${escapeHtml(l.label)}${desc}</td>`;
      });
      while (cells.length < perRow) cells.push('<td></td>');
      rows.push(`<tr>${cells.join('')}</tr>`);
    }
    const title = block.title ? `<tr><td class="rk-bar rk-c" colspan="${perRow}" style="${titleCss}">${escapeHtml(block.title)}</td></tr>` : '';
    return `${tableOpen('', look, Array(perRow).fill(1))}<tbody>${title}${rows.join('')}</tbody></table>`;
  }

  // vertical: [side label] code | label (| description)
  const hasSide = !!block.sideLabel;
  const hasDesc = !!block.showDescriptions && levels.some((l) => l.description);
  const sideW = num(block.sideWidth, 10, 2, 40);
  const codeW = num(block.codeWidth, 10, 2, 40);
  const restW = 100 - (hasSide ? sideW : 0) - codeW;
  const widths = [...(hasSide ? [sideW] : []), codeW, hasDesc ? restW * 0.35 : restW, ...(hasDesc ? [restW * 0.65] : [])];
  const body = levels
    .map((l, i) => {
      const side =
        hasSide && i === 0
          ? `<td class="rk-vertical rk-bar" rowspan="${levels.length}" style="${[titleCss, textCss(block.sideStyle), 'text-align:center'].filter(Boolean).join(';')}"><span>${escapeHtml(block.sideLabel).replace(/\r?\n/g, '<br>')}</span></td>`
          : '';
      const desc = hasDesc ? `<td>${escapeHtml(l.description ?? '')}</td>` : '';
      const codeCss = [ratingStyle(ctx, block.scaleId, true, l.code, block.id), textCss(block.codeStyle)].filter(Boolean).join(';');
      return `<tr>${side}<td class="rk-rating" style="${codeCss}">${escapeHtml(l.code)}</td><td style="font-weight:700">${escapeHtml(l.label)}</td>${desc}</tr>`;
    })
    .join('');
  const title = block.title
    ? `<tr><td class="rk-bar" colspan="${widths.length}" style="${titleCss}">${escapeHtml(block.title)}</td></tr>`
    : '';
  return `${tableOpen('', look, widths)}<tbody>${title}${body}</tbody></table>`;
}

function filterGroups(groups: SkillGroup[], block: SkillsTableBlock): SkillGroup[] {
  const include = (block.includeGroups ?? []).map(normName).filter(Boolean);
  const exclude = (block.excludeGroups ?? []).map(normName).filter(Boolean);
  return groups.filter((g) => (include.length === 0 || include.includes(normName(g.name))) && !exclude.includes(normName(g.name)));
}

function skillValue(item: SkillItem, key: string): string {
  if (key === 'name') return item.name;
  if (key === 'description') return item.description;
  if (key === 'rating' || key === 't1' || key === 't2') return item[key];
  return '';
}

function skillsTable(block: SkillsTableBlock, ctx: RenderCtx): Flowable | null {
  const groups = filterGroups(ctx.data.skills, block);
  if (groups.length === 0 && block.hideWhenEmpty) return null;

  const cols = block.columns.length > 0 ? block.columns : [{ key: 'name' as const, label: '', width: 80 }, { key: 'rating' as const, label: '', width: 20 }];
  const ratingKeys = new Set(['rating', 't1', 't2']);
  const pairs = (block.sideBySide ?? []).filter((p) => Array.isArray(p) && p.length === 2).map((p) => p.map(normName));
  const groupByName = new Map(groups.map((g) => [normName(g.name), g]));
  const pairOf = (g: SkillGroup) => pairs.find((p) => p[0] === normName(g.name) && groupByName.has(p[1]));
  const pairMode = groups.some((g) => !!pairOf(g));

  // Pair mode prints singles on a 4-column grid (text spans 3) so the rating
  // column lines up with the pairs' right-hand rating column.
  const ratingCol = [...cols].reverse().find((c) => ratingKeys.has(c.key)) ?? cols[cols.length - 1];
  const nameCol = cols.find((c) => !ratingKeys.has(c.key)) ?? cols[0];
  const pairColumns = (block.pairColumns ?? []).map((w) => num(w, 0, 0, 100));
  const widths = pairMode
    ? pairColumns.length === 4 && pairColumns.every((w) => w > 0)
      ? pairColumns
      : (() => {
          const rw = num(ratingCol.width, 20, 1, 90);
          const rest = 100 - rw;
          const a = rest * 0.4;
          const b = rest * 0.1;
          return [a, b, rest - a - b, rw];
        })()
    : cols.map((c) => c.width);
  const rowHeight = block.rowHeight ? ` style="height:${px(block.rowHeight, 0, 0, 600)}"` : '';
  const pairRowHeight = block.pairRowHeight ? ` style="height:${px(block.pairRowHeight, 0, 0, 600)}"` : rowHeight;
  const span = widths.length;

  const rows: TableRow[] = [];
  const groupBg = '#d9d9d9';
  if (block.title) rows.push(barRow(block.title, block.titleBar, span, '#9bc2e6', ctx));

  // A group's bar: its own colour/icon (groupStyles), one merged cell or, with
  // groupBarColumns, the name over the text columns and a blank rating cell.
  const groupBarRow = (name: string, index: number): TableRow => {
    const look = groupLook(block, name, index);
    const css = barCss(look.bar, groupBg, ctx.doc.theme);
    const label = `${escapeHtml(name)}${groupIconHtml(ctx, look.style)}`;
    if (block.groupBarColumns && span > 1) {
      // The text columns come before the first rating column (pair mode: 3 of 4).
      const firstRating = pairMode ? span - 1 : cols.findIndex((c) => ratingKeys.has(c.key));
      const textSpan = firstRating > 0 ? firstRating : span - 1;
      const blanks = Array.from({ length: span - textSpan }, () => `<td class="rk-bar" style="${css}"></td>`).join('');
      return { html: `<tr><td class="rk-bar" colspan="${textSpan}" style="${css}">${label}</td>${blanks}</tr>`, keepWithNext: true };
    }
    return { html: `<tr><td class="rk-bar" colspan="${span}" style="${css}">${label}</td></tr>`, keepWithNext: true };
  };

  const headCells = (labelFor: (c: ColumnDef) => string) =>
    pairMode
      ? `<th colspan="3" style="${barCss(block.headerBar, '', ctx.doc.theme)}">${escapeHtml(labelFor(nameCol))}</th><th class="rk-c" style="${barCss(block.headerBar, '', ctx.doc.theme)}">${escapeHtml(labelFor(ratingCol))}</th>`
      : cols
          .map(
            (c) =>
              `<th class="${alignClass(c.align).trim()}" style="${barCss(block.headerBar, '', ctx.doc.theme)}${c.headerAlign ? `;text-align:${alignName(c.headerAlign)}` : ''}">${escapeHtml(labelFor(c))}</th>`,
          )
          .join('');
  const head = block.showColumnHeader && !block.groupAsColumnHeader ? `<thead><tr>${headCells((c) => c.label)}</tr></thead>` : '';

  const itemRow = (item: SkillItem, stripe: boolean): TableRow => {
    const cls = block.stripeRows && stripe ? ' class="rk-stripe"' : '';
    if (pairMode) {
      const v = skillValue(item, ratingCol.key);
      return {
        html: `<tr${cls}${rowHeight}><td colspan="3">${escapeHtml(item.name)}</td><td class="rk-rating" style="${ratingStyle(ctx, block.scaleId, block.colorRatings, v, block.id)}">${escapeHtml(v)}</td></tr>`,
        keepWithNext: false,
      };
    }
    const tds = cols
      .map((c) => {
        const v = skillValue(item, c.key);
        const own = c.style ? textCss(c.style) : '';
        if (ratingKeys.has(c.key)) {
          const css = [ratingStyle(ctx, block.scaleId, block.colorRatings, v, block.id), own].filter(Boolean).join(';');
          return `<td class="rk-rating${alignClass(c.align)}" style="${css}">${escapeHtml(v)}</td>`;
        }
        return `<td class="${alignClass(c.align).trim()}"${own ? ` style="${own}"` : ''}>${escapeHtml(v)}</td>`;
      })
      .join('');
    return { html: `<tr${cls}${rowHeight}>${tds}</tr>`, keepWithNext: false };
  };

  const commentRow = (g: SkillGroup): TableRow | null => {
    if (!block.showGroupComments || !g.comment) return null;
    const label = !block.groupCommentLabel
      ? ''
      : block.groupCommentLabelStyle
        ? `<div style="${textCss(block.groupCommentLabelStyle)}">${escapeHtml(block.groupCommentLabel)}</div>`
        : `<strong>${escapeHtml(block.groupCommentLabel)}</strong> `;
    const css = block.groupCommentBar ? ` style="${barCss({ fontWeight: 400, ...block.groupCommentBar }, '', ctx.doc.theme)}"` : '';
    return { html: `<tr><td colspan="${span}"${css}>${label}${dataHtml(g.comment)}</td></tr>`, keepWithNext: false };
  };
  // A blank row before every group but the first; its side borders are hidden
  // so the gap reads as white space. It goes to the next page with its group
  // and is left out there, so no page starts or ends on a gap.
  const gap = num(block.groupGap, 0, 0, 200);
  let groupsPlaced = 0;
  const openGroup = () => {
    if (gap > 0 && groupsPlaced > 0) {
      rows.push({
        html: `<tr class="rk-gap"><td colspan="${span}" style="height:${gap}px;padding:0;background:transparent;border-left-style:hidden;border-right-style:hidden"></td></tr>`,
        keepWithNext: true,
        dropAtTop: true,
      });
    }
    groupsPlaced += 1;
    return rows.length;
  };
  // Group rows from `start`, chained so the group stays together (when asked).
  const closeGroup = (start: number) => {
    if (block.keepGroupsTogether) for (let k = start; k < rows.length - 1; k++) rows[k].keepWithNext = true;
  };

  let lastGroup: string | null = null;
  const done = new Set<string>();
  for (const [gi, g] of groups.entries()) {
    const key = normName(g.name);
    if (done.has(key)) continue;
    done.add(key);
    const start = openGroup();

    const pair = pairOf(g);
    if (pair) {
      const right = groupByName.get(pair[1])!;
      done.add(pair[1]);
      lastGroup = null;
      const pairCell = (x: SkillGroup) => {
        const look = groupLook(block, x.name, groups.indexOf(x));
        return `<td class="rk-bar" colspan="2" style="${barCss(look.bar, groupBg, ctx.doc.theme)}">${escapeHtml(x.name)}${groupIconHtml(ctx, look.style)}</td>`;
      };
      rows.push({
        html: `<tr>${pairCell(g)}${pairCell(right)}</tr>`,
        keepWithNext: true,
      });
      const n = Math.max(g.items.length, right.items.length);
      for (let r = 0; r < n; r++) {
        const a = g.items[r];
        const b = right.items[r];
        const pairText = block.pairStyle ? ` style="${textCss(block.pairStyle)}"` : '';
        const av = a ? skillValue(a, ratingCol.key) : '';
        const bv = b ? skillValue(b, ratingCol.key) : '';
        rows.push({
          // A side-by-side pair is short; keep it in one piece.
          keepWithNext: r < n - 1,
          html: `<tr${pairRowHeight}><td${pairText}>${a ? escapeHtml(a.name) : ''}</td><td class="rk-rating" style="${ratingStyle(ctx, block.scaleId, block.colorRatings, av, block.id)}">${escapeHtml(av)}</td><td${pairText}>${b ? escapeHtml(b.name) : ''}</td><td class="rk-rating" style="${ratingStyle(ctx, block.scaleId, block.colorRatings, bv, block.id)}">${escapeHtml(bv)}</td></tr>`,
        });
      }
      for (const cg of [g, right]) {
        const c = commentRow(cg);
        if (c) rows.push(c);
      }
      closeGroup(start);
      continue;
    }

    if (block.groupAsColumnHeader) {
      rows.push({
        html: `<tr>${headCells((c) => c.label.replace(/\{\{\s*group\s*\}\}/g, g.name))}</tr>`.replace(/<th/g, '<td').replace(/<\/th>/g, '</td>'),
        keepWithNext: true,
      });
    } else {
      const m = block.splitGroupNames ? /^(.+?)\s+-\s+(.+)$/.exec(g.name) : null;
      if (m) {
        const parent = m[1].trim();
        if (normName(parent) !== lastGroup) rows.push(groupBarRow(parent, gi));
        rows.push(barRow(m[2].trim(), block.subgroupBar, span, '#bdd7ee', ctx));
        lastGroup = normName(parent);
      } else {
        rows.push(groupBarRow(g.name, gi));
        lastGroup = null;
      }
    }
    g.items.forEach((item, i) => rows.push(itemRow(item, i % 2 === 1)));
    const c = commentRow(g);
    if (c) rows.push(c);
    closeGroup(start);
  }

  return {
    kind: 'table',
    block,
    open: `${tableOpen('', tableCss(block, ctx.doc.theme), widths)}${head}<tbody>`,
    head,
    rows,
    close: '</tbody></table>',
    breakBefore: !!block.breakBefore,
    keepTogether: !!block.keepTogether,
  };
}

function commentRowsFor(block: CommentsTableBlock, data: ReportData): Array<{ label: string; caption: string; text: string }> {
  if (block.source === 'subjects') return data.subjects.map((s) => ({ label: s.name, caption: '', text: s.comment }));
  if (block.source === 'skillGroups') return data.skills.map((g) => ({ label: g.name, caption: '', text: g.comment }));
  return data.comments.map((c) => ({ label: c.label, caption: c.caption, text: c.text }));
}

function commentsTable(block: CommentsTableBlock, ctx: RenderCtx): Flowable | null {
  const all = commentRowsFor(block, ctx.data);
  const items = block.showEmptyRows ? all : all.filter((r) => r.text && r.text.trim());
  if (items.length === 0 && block.hideWhenEmpty) return null;
  const sw = num(block.subjectWidth, 22, 5, 80);
  const grid = block.grid && block.grid.length >= 2 ? block.grid : [sw, 100 - sw];
  const subjectSpan = Math.floor(num(block.subjectSpan, 1, 1, grid.length - 1));
  const commentSpan = grid.length - subjectSpan;
  const span = (n: number) => (n > 1 ? ` colspan="${n}"` : '');
  const headBar = barCss(block.headerBar, '#d0cece', ctx.doc.theme);
  const head = `<thead><tr><th class="rk-c"${span(subjectSpan)} style="${headBar}">${escapeHtml(block.subjectLabel)}</th><th class="rk-c"${span(commentSpan)} style="${headBar}">${escapeHtml(block.commentLabel)}</th></tr></thead>`;
  const subjectBg = safeColor(block.subjectBackground);
  const subjectCss = [textCss(block.subjectStyle), subjectBg ? `background:${subjectBg}` : '', valign(block.subjectStyle)].filter(Boolean).join(';');
  const captionCss = block.captionStyle ? ` style="${textCss(block.captionStyle)}"` : '';
  const commentCss = block.commentStyle ? ` style="${[textCss(block.commentStyle), valign(block.commentStyle)].filter(Boolean).join(';')}"` : '';
  const rowHeight = block.rowHeight ? ` style="height:${px(block.rowHeight, 0, 0, 600)}"` : '';
  const rows: TableRow[] = items.map((r) => ({
    html: `<tr${rowHeight}><td${span(subjectSpan)} style="${subjectCss}"><strong>${escapeHtml(r.label)}</strong>${r.caption ? `<span class="rk-caption"${captionCss}>${escapeHtml(r.caption)}</span>` : ''}</td><td${span(commentSpan)}${commentCss}>${dataHtml(r.text)}</td></tr>`,
    keepWithNext: false,
  }));
  if (block.footerRow && evaluateCondition(block.footerRow.showWhen, ctx.scope)) {
    rows.push({ html: staticRowHtml(ctx, block.footerRow), keepWithNext: false });
  }
  return {
    kind: 'table',
    block,
    open: `${tableOpen('', tableCss(block, ctx.doc.theme), grid)}${head}<tbody>`,
    head,
    rows,
    close: '</tbody></table>',
    breakBefore: !!block.breakBefore,
    keepTogether: !!block.keepTogether,
  };
}

function learningSkills(block: LearningSkillsBlock, ctx: RenderCtx): Flowable | null {
  const skills = ctx.data.learningSkills;
  if (skills.length === 0 && block.hideWhenEmpty) return null;
  const terms = block.termColumns.length > 0 ? block.termColumns : (['rating'] as const);
  const labels = { rating: 'Rating', t1: 'Term 1', t2: 'Term 2', ...(block.termLabels ?? {}) };
  const nameWidth = 100 - terms.length * 11;
  // An optional label cell splits the name column in the header; body name cells span both.
  const labelWidth = block.headerLabel ? num(block.headerLabelWidth, 16, 2, nameWidth - 2) : 0;
  const widths = [...(labelWidth ? [labelWidth, nameWidth - labelWidth] : [nameWidth]), ...terms.map(() => 11)];
  const bar = barCss(block.titleBar, '#d9d9d9', ctx.doc.theme);
  const labelCell = labelWidth ? `<th class="rk-c" style="${bar}">${escapeHtml(block.headerLabel)}</th>` : '';
  const head = `<thead><tr>${labelCell}<th style="${bar}">${escapeHtml(block.legend ?? 'Learning Skills')}</th>${terms
    .map((t) => `<th class="rk-c" style="${bar}">${escapeHtml(labels[t])}</th>`)
    .join('')}</tr></thead>`;
  const rows: TableRow[] = [];
  if (block.title) rows.push(barRow(block.title, block.titleBar, widths.length, '#d9d9d9', ctx));
  for (const s of skills) {
    const desc =
      block.showDescriptors && s.descriptors.length > 0
        ? `<ul class="rk-desc">${s.descriptors.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}</ul>`
        : '';
    const own = block.ratingStyle ? textCss(block.ratingStyle) : '';
    const cells = terms
      .map((t) => `<td class="rk-rating" style="${[ratingStyle(ctx, block.scaleId, false, s[t], block.id), own].filter(Boolean).join(';')}">${escapeHtml(s[t])}</td>`)
      .join('');
    const name = block.nameBar
      ? `<div style="${barCss(block.nameBar, '#e0e0e0', ctx.doc.theme)};margin:calc(-1 * var(--rk-pad,4px)) calc(-1 * (var(--rk-pad,4px) + 2px)) 6px">${escapeHtml(s.name)}</div>`
      : `<strong>${escapeHtml(s.name)}</strong>`;
    const span = labelWidth ? ' colspan="2"' : '';
    const top = block.nameBar ? ' style="vertical-align:top"' : '';
    rows.push({ html: `<tr><td${span}${top}>${name}${desc}</td>${cells}</tr>`, keepWithNext: false });
  }
  return {
    kind: 'table',
    block,
    open: `${tableOpen('', tableCss(block, ctx.doc.theme), widths)}${head}<tbody>`,
    head,
    rows,
    close: '</tbody></table>',
    breakBefore: !!block.breakBefore,
    keepTogether: !!block.keepTogether,
  };
}

function subjectFieldValue(subject: SubjectRow | { mark: SubjectRow['mark']; workHabits: string; behaviour: string; coreStandards?: string }, key: string, ctx: RenderCtx): string {
  if (key === 'mark') return formatMark(subject.mark, ctx.data.student.grade, ctx.doc.marks);
  if (key === 'workHabits') return subject.workHabits ?? '';
  if (key === 'behaviour') return subject.behaviour ?? '';
  if (key === 'overall') return overallRating(subject.workHabits, subject.behaviour);
  if (key === 'coreStandards') return subject.coreStandards ?? '';
  return '';
}

function subjectCard(block: SubjectCardsBlock, subject: SubjectRow, ctx: RenderCtx): string {
  const look = tableCss(block, ctx.doc.theme);
  const theme = ctx.doc.theme;
  const cs = block.cardStyle ?? {};
  const headBar = barCss(block.headerBar, theme.accent || '#2c5aa0', theme);
  const title = `${escapeHtml(subject.name)}${block.showTeacher && subject.teacher ? ` – ${escapeHtml(subject.teacher)}` : ''}`;
  const fields: ColumnDef<SubjectFieldKey>[] = block.fields.length > 0 ? block.fields : [{ key: 'mark', label: 'Grade', width: 1 }];
  const ratingKeys = new Set(['workHabits', 'behaviour', 'overall']);
  // An empty rating prints emptyRatingText; colours follow the raw value.
  const shown = (key: string, raw: string) => (ratingKeys.has(key) && !raw ? (block.emptyRatingText ?? '') : raw);
  const emptyCss = (key: string, raw: string) => {
    if (!cs.emptyRating || !ratingKeys.has(key) || raw) return '';
    const bg = safeColor(cs.emptyRating.background);
    const fg = safeColor(cs.emptyRating.color);
    return [bg ? `background:${bg}` : '', fg ? `color:${fg}` : ''].filter(Boolean).join(';');
  };
  const valueCss = (f: ColumnDef, raw: string, extra = '') =>
    [ratingKeys.has(f.key) ? ratingStyle(ctx, block.scaleId, block.colorRatings, raw, block.id) : '', f.style ? textCss(f.style) : '', emptyCss(f.key, raw), extra]
      .filter(Boolean)
      .join(';');
  const cell = (f: ColumnDef, raw: string, extra = '') =>
    `<td class="rk-c" style="${valueCss(f, raw, extra)}"><strong>${escapeHtml(shown(f.key, raw))}</strong></td>`;
  const headTh = (label: string, cls: string, align: 'left' | 'center', own?: ColumnDef['headerAlign']) => {
    const css = [cs.markHead ? barCss({ align, ...cs.markHead }, '', theme) : '', own ? `text-align:${alignName(own)}` : ''].filter(Boolean).join(';');
    return `<th${cls ? ` class="${cls}"` : ''}${css ? ` style="${css}"` : ''}>${escapeHtml(label)}</th>`;
  };

  let table: string;
  if (block.rows === 'terms') {
    const labels = { t1: 'First Term', t2: 'Second Term', final: 'Final Term', ...(block.termRowLabels ?? {}) };
    const head = `<tr>${headTh('Term', '', 'left')}${fields.map((f) => headTh(f.label, 'rk-c', 'center', f.headerAlign)).join('')}</tr>`;
    const finalBg = safeColor(cs.finalRowBackground);
    const body = (['t1', 't2', 'final'] as const)
      .map((t) => {
        const r = subject.terms[t] ?? { mark: null, workHabits: '', behaviour: '', comment: '' };
        const isFinal = t === 'final';
        const bg = isFinal && finalBg ? `background:${finalBg}` : '';
        const label = cs.termCell
          ? `<td style="${[barCss(cs.termCell, '', theme), bg].filter(Boolean).join(';')}">${escapeHtml(labels[t])}</td>`
          : `<td${bg ? ` style="${bg}"` : ''}><strong>${escapeHtml(labels[t])}</strong></td>`;
        return `<tr${isFinal && !bg ? ' class="rk-stripe"' : ''}>${label}${fields
          .map((f) => (isFinal && f.key !== 'mark' ? '<td></td>' : cell(f, subjectFieldValue({ ...r, coreStandards: '' }, f.key, ctx), bg)))
          .join('')}</tr>`;
      })
      .join('');
    table = `${tableOpen('', '', [22, ...fields.map(() => 78 / fields.length)])}<thead>${head}</thead><tbody>${body}</tbody></table>`;
  } else if (cs.markLayout === 'tiles') {
    const gap = num(cs.bodyPadding, 15, 0, 60);
    const labelCss = barCss({ align: 'center', ...cs.markHead }, '', theme);
    table = `<div style="display:grid;grid-template-columns:repeat(${fields.length},minmax(0,1fr));gap:${gap}px;margin-bottom:${gap}px">${fields
      .map((f) => {
        const raw = subjectFieldValue(subject, f.key, ctx);
        return `<div style="text-align:center"><div style="${labelCss};margin-bottom:5px">${escapeHtml(f.label)}</div><div style="${valueCss(
          f,
          raw,
          'padding:5px 10px;border-radius:3px;font-weight:700',
        )}">${escapeHtml(shown(f.key, raw))}</div></div>`;
      })
      .join('')}</div>`;
  } else {
    const head = `<tr>${fields.map((f) => headTh(f.label, 'rk-c', 'center', f.headerAlign)).join('')}</tr>`;
    const body = `<tr>${fields.map((f) => cell(f, subjectFieldValue(subject, f.key, ctx))).join('')}</tr>`;
    table = `${tableOpen('', '', fields.map(() => 1))}<thead>${head}</thead><tbody>${body}</tbody></table>`;
  }

  // Core standards / comment sections. With tiles the card body is one padded
  // area and a hairline separates its sections.
  const tiles = cs.markLayout === 'tiles' && block.rows !== 'terms';
  const pad = num(cs.bodyPadding, 15, 0, 60);
  const rule = safeColor(cs.sectionRule);
  const sectionCss = (first: boolean) =>
    tiles
      ? `${first ? '' : `margin-top:${pad}px;`}padding:${pad}px 0 0${rule ? `;border-top:1px solid ${rule}` : ''}`
      : [cs.bodyPadding !== undefined ? `padding:${pad}px` : '', rule ? `border-top:1px solid ${rule}` : ''].filter(Boolean).join(';');
  const section = (label: string, inner: string, first: boolean) => {
    const head = cs.labelBar
      ? `<div style="${barCss(cs.labelBar, '', theme)}">${escapeHtml(label)}</div>`
      : `<div class="rk-card-label"${cs.label ? ` style="${textCss(cs.label)}"` : ''}>${escapeHtml(label)}</div>`;
    const css = sectionCss(first);
    return `<div class="rk-card-body"${css ? ` style="${css}"` : ''}>${head}${inner}</div>`;
  };
  const boxed = (html: string, text?: TextStyle, panel = cs.panel) => {
    const css = [panelCss(panel), text ? textCss(text) : ''].filter(Boolean).join(';');
    return css ? `<div style="${css}">${html}</div>` : html;
  };

  const core =
    block.showCoreStandards && subject.coreStandards
      ? section(block.coreStandardsLabel ?? 'Core Standards Progress', boxed(dataHtml(subject.coreStandards)), true)
      : '';
  const commentText = block.rows === 'terms' ? subject.terms.t2?.comment || subject.comment : subject.comment;
  const comment =
    block.showComment && (commentText || !block.hideEmptyComment)
      ? section(
          block.commentLabel ?? 'Teacher Comments',
          boxed(commentText ? dataHtml(commentText) : `<em>${escapeHtml(block.emptyCommentText ?? '')}</em>`, cs.commentText, cs.commentPanel ?? cs.panel),
          !core,
        )
      : '';
  const cardCss = cs.radius ? `${look};border-radius:${px(cs.radius, 0, 0, 60)};overflow:hidden` : look;
  const bodyHtml = tiles ? `<div style="padding:${pad}px">${table}${core}${comment}</div>` : `${table}${core}${comment}`;
  return `<div class="rk-card" style="${cardCss}"><div class="rk-card-head" style="${headBar}">${title}</div>${bodyHtml}</div>`;
}

function signatures(block: SignaturesBlock, ctx: RenderCtx): string {
  const h = num(block.imageHeight, 48, 10, 300);
  const lineWidth = block.lineWidth ? num(block.lineWidth, 0, 20, 2000) : 0;
  const slots = block.slots
    .map(
      (s) =>
        `<div class="rk-sig"><div class="rk-sig-img" style="height:${h}px">${s.image ? imageHtml(ctx, s.image, h, imageLabel(s.image)) : ''}</div><div class="${
          s.showLine === false ? '' : 'rk-sig-line'
        }"${lineWidth && s.showLine !== false ? ` style="width:${lineWidth}px"` : ''}>${mergeHtml(s.label, ctx.scope)}</div></div>`,
    )
    .join('');
  const caption = block.caption ? `<div style="text-align:center;margin-top:10px">${mergeHtml(block.caption, ctx.scope)}</div>` : '';
  const rule = block.topRule ? 'border-top:2px solid currentColor;padding-top:14px;' : '';
  return `<div style="${rule}${textCss(block.style)}"><div class="rk-sigs">${slots}</div>${caption}</div>`;
}

/** A free-canvas element as absolutely positioned HTML. */
export function elementHtml(el: CanvasElement, ctx: RenderCtx): string {
  if (!evaluateCondition(el.showWhen, ctx.scope)) return '';
  const base = [
    `left:${px(el.x, 0, -2000, 5000)}`,
    `top:${px(el.y, 0, -2000, 5000)}`,
    `width:${px(el.w, 10, 1, 5000)}`,
    `height:${px(el.h, 10, 1, 5000)}`,
    el.z !== undefined ? `z-index:${Math.round(num(el.z, 0, -100, 1000))}` : '',
    el.rotation ? `transform:rotate(${num(el.rotation, 0, -360, 360)}deg)` : '',
    boxCss(el.box),
  ]
    .filter(Boolean)
    .join(';');
  const id = escapeHtml(el.id);

  if (el.type === 'text') {
    const v = el.style?.verticalAlign ?? 'top';
    const justify = v === 'middle' ? 'center' : v === 'bottom' ? 'flex-end' : 'flex-start';
    const fit = el.overflow === 'shrink' ? ' data-rk-fit="shrink"' : '';
    const clip = el.overflow === 'clip' || el.overflow === 'shrink' ? ' rk-clip' : '';
    return `<div class="rk-el rk-text${clip}" data-rk-el="${id}"${fit} style="${base};justify-content:${justify};${textCss(el.style, ctx.doc.theme)}"><div>${mergeHtml(
      el.text,
      ctx.scope,
    )}</div></div>`;
  }
  if (el.type === 'image') {
    const url = ctx.image(el.src);
    const fit = el.fit === 'cover' ? 'cover' : el.fit === 'fill' ? 'fill' : 'contain';
    const position = el.align === 'left' || el.align === 'right' ? `;object-position:${el.align} center` : '';
    const inner = url
      ? `<img class="rk-img" src="${escapeHtml(url)}" alt="" style="object-fit:${fit}${position}">`
      : ctx.mode === 'editor'
        ? `<div class="rk-placeholder">${escapeHtml(imageLabel(el.src))}</div>`
        : '';
    return `<div class="rk-el" data-rk-el="${id}" style="${base}">${inner}</div>`;
  }
  if (el.type === 'shape') {
    const stroke = safeColor(el.stroke, '#000');
    const sw = num(el.strokeWidth, 1, 0, 50);
    const fill = safeColor(el.fill, 'transparent');
    if (el.shape === 'line') {
      return `<div class="rk-el" data-rk-el="${id}" style="${base}"><div style="position:absolute;left:0;right:0;top:50%;border-top:${sw}px solid ${stroke};transform:translateY(-50%)"></div></div>`;
    }
    const radius = el.shape === 'ellipse' ? 'border-radius:50%;' : '';
    return `<div class="rk-el" data-rk-el="${id}" style="${base};${radius}background:${fill};${sw > 0 ? `border:${sw}px solid ${stroke}` : ''}"></div>`;
  }
  // block element: a smart block in a fixed box
  const inner = blockHtml(el.block, ctx);
  const fit = el.overflow === 'clip' ? 'clip' : 'shrink';
  return `<div class="rk-el" data-rk-el="${id}" data-rk-fit="${fit === 'shrink' ? 'block' : 'clip'}" style="${base};overflow:hidden"><div class="rk-fit-inner" style="transform-origin:top left">${inner}</div></div>`;
}

function canvasRegion(block: Extract<Block, { type: 'canvas' }>, ctx: RenderCtx): string {
  return `<div class="rk-region" style="height:${px(block.height, 100, 1, 3000)}">${block.elements.map((e) => elementHtml(e, ctx)).join('')}</div>`;
}

function columnsBlock(block: Extract<Block, { type: 'columns' }>, ctx: RenderCtx): string {
  const gap = num(block.gap, 12, 0, 200);
  const total = block.columns.reduce((s, c) => s + num(c.width, 1, 0, 100), 0) || 1;
  const cols = block.columns
    .map((c) => {
      const inner = c.blocks
        .filter((b) => evaluateCondition(b.showWhen, ctx.scope))
        .map((b) => `<div data-rk-block="${escapeHtml(b.id)}" style="margin-top:${px(b.marginTop, 0)};margin-bottom:${px(b.marginBottom, 0)}">${blockHtml(b, ctx)}</div>`)
        .join('');
      return `<div style="flex:${(num(c.width, 1, 0, 100) / total).toFixed(4)} 1 0">${inner}</div>`;
    })
    .join('');
  return `<div class="rk-cols" style="gap:${gap}px">${cols}</div>`;
}

// ─────────────────────────────────────────────────────────── public ──

function joinTable(f: Extract<Flowable, { kind: 'table' }>): string {
  return `${f.open}${f.rows.map((r) => r.html).join('')}${f.close}`;
}

/** A block as one piece of HTML (columns children, blocks in a fixed box). */
export function blockHtml(block: Block, ctx: RenderCtx): string {
  const flows = blockFlowables(block, ctx);
  return flows
    .map((f) => {
      if (f.kind === 'atomic') return f.html;
      if (f.kind === 'table') return joinTable(f);
      return '';
    })
    .join('');
}

/** A body block as the flowables the paginator places. Hidden blocks give []. */
export function blockFlowables(block: Block, ctx: RenderCtx): Flowable[] {
  if (!evaluateCondition(block.showWhen, ctx.scope)) return [];
  const atomic = (html: string): Flowable[] => [{ kind: 'atomic', block, html, breakBefore: !!block.breakBefore }];
  const table = (f: Flowable | null): Flowable[] => (f ? [f] : []);

  switch (block.type) {
    case 'table':
      return atomic(tableBlock(block, ctx));
    case 'text':
      return atomic(textBlock(block, ctx));
    case 'ratingKey':
      return atomic(ratingKey(block, ctx));
    case 'skillsTable':
      return table(skillsTable(block, ctx));
    case 'commentsTable':
      return table(commentsTable(block, ctx));
    case 'learningSkills':
      return table(learningSkills(block, ctx));
    case 'subjectCards': {
      const subjects = ctx.data.subjects;
      if (subjects.length === 0) {
        if (block.hideWhenEmpty || ctx.mode === 'print') return [];
        return atomic(`<div class="rk-placeholder" style="height:60px">No subjects for this student</div>`);
      }
      const per = Math.floor(num(block.perPage, 0, 0, 20));
      const gap = num(block.cardGap, 14, 0, 200);
      const groupPad = num(block.groupPadding, 0, 0, 400);
      // With groupPadding, each group of `perPage` cards gets space above it
      // and cards are `gap` apart only inside a group.
      const wrapCss = (i: number) => {
        if (groupPad <= 0) return `margin-bottom:${i < subjects.length - 1 ? gap : 0}px`;
        const first = per > 0 ? i % per === 0 : i === 0;
        const last = i === subjects.length - 1 || (per > 0 && (i + 1) % per === 0);
        return `${first ? `padding-top:${groupPad}px;` : ''}margin-bottom:${last ? 0 : gap}px`;
      };
      return subjects.map((s, i) => ({
        kind: 'atomic' as const,
        block,
        html: `<div style="${wrapCss(i)}">${subjectCard(block, s, ctx)}</div>`,
        breakBefore: i === 0 ? !!block.breakBefore : per > 0 && i % per === 0,
      }));
    }
    case 'signatures':
      return atomic(signatures(block, ctx));
    case 'columns':
      return atomic(columnsBlock(block, ctx));
    case 'canvas':
      return atomic(canvasRegion(block, ctx));
    case 'spacer':
      return atomic(`<div style="height:${px(block.height, 12, 0, 2000)}"></div>`);
    case 'pageBreak':
      return [{ kind: 'break', block }];
    case 'freePage':
      return [{ kind: 'fullPage', block }];
    default:
      return [];
  }
}
