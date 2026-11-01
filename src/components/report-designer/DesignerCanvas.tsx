'use client';

/**
 * The designer's page view. Real pages, rendered by the same engine that
 * prints the PDF, inside an iframe (so the app's CSS can't leak into the
 * report). A transparent overlay on top does hover, selection, drag, resize
 * and snapping; edits update the iframe's DOM live and are committed to the
 * document on pointer-up, which re-renders.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ensureFonts, renderReport } from '@/reportkit/render';
import { blockLabel } from '@/reportkit/factory';
import { PAGE_SIZES, type CanvasElement, type ReportData, type TemplateDoc } from '@/reportkit/types';
import { useDesignerStore } from './store';
import {
  ZONE_LABELS,
  duplicateBlock,
  findBlock,
  findElement,
  moveBlock,
  removeBlock,
  updateBlock,
  updateElement,
  updateZone,
  type Selection,
  type ZoneKey,
} from './docOps';
import { HANDLES, guidesFor, resizeBox, roundBox, snapBox, type Box, type Handle } from './geometry';
import { ArrowDownIcon, ArrowUpIcon, DocumentDuplicateIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface LayoutMap {
  height: number;
  pages: Array<{ index: number; rect: Rect }>;
  blocks: Array<{ id: string; rect: Rect; page: number }>;
  elements: Array<{ id: string; container: Rect; page: number; containerKind: 'zone' | 'block'; zone?: ZoneKey }>;
  zones: Array<{ key: ZoneKey; rect: Rect; page: number }>;
  regions: Array<{ id: string; rect: Rect; page: number }>;
}

const EMPTY_LAYOUT: LayoutMap = { height: 0, pages: [], blocks: [], elements: [], zones: [], regions: [] };

const SRC_DOC =
  '<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent;overflow:hidden}</style></head><body><div id="rk" class="rk-screen"></div></body></html>';

function rectOf(el: Element, origin: DOMRect): Rect {
  const r = el.getBoundingClientRect();
  return { x: r.left - origin.left, y: r.top - origin.top, w: r.width, h: r.height };
}

function pageOf(el: Element): number {
  const p = el.closest('[data-rk-page]');
  return p ? Number(p.getAttribute('data-rk-page')) : 0;
}

function measure(root: HTMLElement): LayoutMap {
  const origin = root.getBoundingClientRect();
  const layout: LayoutMap = { ...EMPTY_LAYOUT, pages: [], blocks: [], elements: [], zones: [], regions: [] };
  root.querySelectorAll('[data-rk-page]').forEach((p) => layout.pages.push({ index: Number(p.getAttribute('data-rk-page')), rect: rectOf(p, origin) }));
  root.querySelectorAll('[data-rk-block]').forEach((b) =>
    layout.blocks.push({ id: b.getAttribute('data-rk-block')!, rect: rectOf(b, origin), page: pageOf(b) }),
  );
  root.querySelectorAll('[data-rk-zone]').forEach((z) =>
    layout.zones.push({ key: z.getAttribute('data-rk-zone') as ZoneKey, rect: rectOf(z, origin), page: pageOf(z) }),
  );
  root.querySelectorAll('.rk-region').forEach((r) => {
    const host = r.closest('[data-rk-block]');
    if (host) layout.regions.push({ id: host.getAttribute('data-rk-block')!, rect: rectOf(r, origin), page: pageOf(r) });
  });
  root.querySelectorAll('[data-rk-el]').forEach((e) => {
    const parent = e.parentElement;
    if (!parent) return;
    const zone = parent.getAttribute('data-rk-zone') as ZoneKey | null;
    layout.elements.push({
      id: e.getAttribute('data-rk-el')!,
      container: rectOf(parent, origin),
      page: pageOf(e),
      containerKind: zone ? 'zone' : 'block',
      zone: zone ?? undefined,
    });
  });
  layout.height = Math.ceil(root.scrollHeight);
  return layout;
}

const inside = (r: Rect, x: number, y: number) => x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
const area = (r: Rect) => r.w * r.h;

type Drag =
  | {
      kind: 'move' | 'resize';
      id: string;
      handle?: Handle;
      start: Box;
      px: number;
      py: number;
      guides: { x: number[]; y: number[] };
      moved: boolean;
      /** Latest box (pointer-up may come before React re-renders). */
      box?: Box;
    }
  | { kind: 'zone'; zone: ZoneKey; startH: number; py: number; edge: 'bottom' | 'top'; current: number }
  | { kind: 'width'; id: string; startW: number; px: number; contentW: number; current: number }
  | { kind: 'region'; id: string; startH: number; py: number; current: number };

interface Props {
  data: ReportData | null;
}

export default function DesignerCanvas({ data }: Props) {
  const doc = useDesignerStore((s) => s.doc);
  const zoom = useDesignerStore((s) => s.zoom);
  const selection = useDesignerStore((s) => s.selection);
  const select = useDesignerStore((s) => s.select);
  const commit = useDesignerStore((s) => s.commit);
  const setRenderInfo = useDesignerStore((s) => s.setRenderInfo);
  const editingTextId = useDesignerStore((s) => s.editingTextId);
  const setEditingText = useDesignerStore((s) => s.setEditingText);

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [frameReady, setFrameReady] = useState(false);
  const [layout, setLayout] = useState<LayoutMap>(EMPTY_LAYOUT);
  const [hover, setHover] = useState<Selection>(null);
  const [liveBox, setLiveBox] = useState<{ id: string; box: Box } | null>(null);
  const [snapLines, setSnapLines] = useState<{ x: number[]; y: number[]; container: Rect } | null>(null);
  const [liveEdge, setLiveEdge] = useState<{ y?: number; x?: number; label: string } | null>(null);
  const dragRef = useRef<Drag | null>(null);

  const size = PAGE_SIZES[doc?.page.size ?? 'letter'] ?? PAGE_SIZES.letter;

  // ── render (serialised: one at a time, latest wins) ──
  const renderState = useRef<{ busy: boolean; pending: boolean }>({ busy: false, pending: false });
  const latest = useRef<{ doc: TemplateDoc | null; data: ReportData | null }>({ doc, data });
  latest.current = { doc, data };

  const runRender = useCallback(async () => {
    const st = renderState.current;
    if (st.busy) {
      st.pending = true;
      return;
    }
    const frame = iframeRef.current;
    const root = frame?.contentDocument?.getElementById('rk');
    if (!frame || !root) return;
    st.busy = true;
    try {
      do {
        st.pending = false;
        const { doc: d, data: rd } = latest.current;
        if (!d || !rd) break;
        const result = await renderReport(root, d, rd, { mode: 'editor' });
        const map = measure(root);
        frame.style.height = `${map.height}px`;
        setLayout(map);
        setRenderInfo({ warnings: result.warnings, pageCount: result.pageCount });
      } while (st.pending);
    } catch (err) {
      console.error('Report render failed', err);
    } finally {
      st.busy = false;
    }
  }, [setRenderInfo]);

  useEffect(() => {
    if (frameReady && doc && data) void runRender();
  }, [frameReady, doc, data, runRender]);

  const onFrameLoad = () => {
    const d = iframeRef.current?.contentDocument;
    if (!d) return;
    ensureFonts(d, (file) => `/report-fonts/${file}`);
    setFrameReady(true);
  };

  // ── hit testing ──
  const toPage = (e: { clientX: number; clientY: number }) => {
    const r = overlayRef.current!.getBoundingClientRect();
    return { x: (e.clientX - r.left) / zoom, y: (e.clientY - r.top) / zoom };
  };

  const elementBox = useCallback(
    (id: string, page?: number): { rect: Rect; container: Rect; el: CanvasElement } | null => {
      if (!doc) return null;
      const found = findElement(doc, id);
      const at = layout.elements.find((l) => l.id === id && (page === undefined || l.page === page)) ?? layout.elements.find((l) => l.id === id);
      if (!found || !at) return null;
      const el = found.element;
      return { el, container: at.container, rect: { x: at.container.x + el.x, y: at.container.y + el.y, w: el.w, h: el.h } };
    },
    [doc, layout],
  );

  const hitTest = useCallback(
    (x: number, y: number): Selection => {
      if (!doc) return null;
      // Free elements first (the smallest under the pointer wins).
      let bestEl: { id: string; a: number } | null = null;
      for (const l of layout.elements) {
        const found = findElement(doc, l.id);
        if (!found) continue;
        const r = { x: l.container.x + found.element.x, y: l.container.y + found.element.y, w: found.element.w, h: found.element.h };
        if (inside(r, x, y) && (!bestEl || area(r) < bestEl.a)) bestEl = { id: l.id, a: area(r) };
      }
      if (bestEl) return { kind: 'element', id: bestEl.id };
      let bestBlock: { id: string; a: number } | null = null;
      for (const b of layout.blocks) {
        if (inside(b.rect, x, y) && (!bestBlock || area(b.rect) < bestBlock.a)) bestBlock = { id: b.id, a: area(b.rect) };
      }
      if (bestBlock) return { kind: 'block', id: bestBlock.id };
      for (const z of layout.zones) if (inside(z.rect, x, y)) return { kind: 'zone', zone: z.key };
      for (const p of layout.pages) if (inside(p.rect, x, y)) return { kind: 'page' };
      return null;
    },
    [doc, layout],
  );

  // ── live DOM edits inside the iframe while dragging ──
  const liveApply = (id: string, box: Box) => {
    const d = iframeRef.current?.contentDocument;
    d?.querySelectorAll<HTMLElement>(`[data-rk-el="${CSS.escape(id)}"]`).forEach((n) => {
      n.style.left = `${box.x}px`;
      n.style.top = `${box.y}px`;
      n.style.width = `${box.w}px`;
      n.style.height = `${box.h}px`;
    });
  };

  const guidesForElement = (id: string, container: Rect) => {
    if (!doc) return { x: [], y: [] };
    const found = findElement(doc, id);
    const others = (found?.list ?? []).filter((e) => e.id !== id).map((e) => ({ x: e.x, y: e.y, w: e.w, h: e.h }));
    const margins = found?.container.kind === 'zone' ? [doc.page.margin.left, size.width - doc.page.margin.right] : [];
    return guidesFor({ w: container.w, h: container.h }, others, margins);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!doc || e.button !== 0) return;
    const { x, y } = toPage(e);
    const target = hitTest(x, y);

    // Clicking inside the current selection's box keeps it (so a selected
    // element can be dragged even when another sits on top).
    let sel: Selection = target;
    if (selection?.kind === 'element') {
      const box = elementBox(selection.id);
      if (box && inside(box.rect, x, y)) sel = selection;
    }
    if (JSON.stringify(sel) !== JSON.stringify(selection)) select(sel);
    if (sel?.kind === 'element') {
      const box = elementBox(sel.id);
      if (!box || box.el.locked) return;
      (e.target as Element).setPointerCapture(e.pointerId);
      dragRef.current = {
        kind: 'move',
        id: sel.id,
        start: { x: box.el.x, y: box.el.y, w: box.el.w, h: box.el.h },
        px: e.clientX,
        py: e.clientY,
        guides: guidesForElement(sel.id, box.container),
        moved: false,
      };
    }
  };

  const startHandle = (e: React.PointerEvent, handle: Handle) => {
    e.stopPropagation();
    if (!doc || selection?.kind !== 'element') return;
    const box = elementBox(selection.id);
    if (!box || box.el.locked) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = {
      kind: 'resize',
      id: selection.id,
      handle,
      start: { x: box.el.x, y: box.el.y, w: box.el.w, h: box.el.h },
      px: e.clientX,
      py: e.clientY,
      guides: guidesForElement(selection.id, box.container),
      moved: false,
    };
  };

  const startZone = (e: React.PointerEvent, zone: ZoneKey) => {
    e.stopPropagation();
    if (!doc) return;
    const z = doc[zone];
    if (!z) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const edge = zone === 'footer' || zone === 'firstFooter' ? 'top' : 'bottom';
    dragRef.current = { kind: 'zone', zone, startH: z.height, py: e.clientY, edge, current: z.height };
  };

  const startWidth = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (!doc) return;
    const found = findBlock(doc, id);
    if (!found) return;
    (e.target as Element).setPointerCapture(e.pointerId);
    const contentW = size.width - doc.page.margin.left - doc.page.margin.right;
    const w = found.block.width ?? 100;
    dragRef.current = { kind: 'width', id, startW: w, px: e.clientX, contentW, current: w };
  };

  const startRegion = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    if (!doc) return;
    const found = findBlock(doc, id);
    if (!found || found.block.type !== 'canvas') return;
    (e.target as Element).setPointerCapture(e.pointerId);
    dragRef.current = { kind: 'region', id, startH: found.block.height, py: e.clientY, current: found.block.height };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag) {
      const { x, y } = toPage(e);
      const h = hitTest(x, y);
      if (JSON.stringify(h) !== JSON.stringify(hover)) setHover(h);
      return;
    }
    const dx = (e.clientX - ('px' in drag ? drag.px : e.clientX)) / zoom;
    const dy = (e.clientY - ('py' in drag ? drag.py : e.clientY)) / zoom;

    if (drag.kind === 'move' || drag.kind === 'resize') {
      if (!drag.moved && Math.abs(dx) + Math.abs(dy) < 2) return;
      drag.moved = true;
      const raw =
        drag.kind === 'move'
          ? { ...drag.start, x: drag.start.x + dx, y: drag.start.y + dy }
          : resizeBox(drag.start, drag.handle!, dx, dy, e.shiftKey);
      const snapped = e.metaKey || e.altKey ? { box: raw, lines: { x: [], y: [] } } : snapBox(raw, drag.guides, 5 / zoom, drag.kind === 'move' ? 'move' : drag.handle);
      const box = roundBox(snapped.box);
      drag.box = box;
      liveApply(drag.id, box);
      setLiveBox({ id: drag.id, box });
      const container = elementBox(drag.id)?.container;
      if (container) setSnapLines({ ...snapped.lines, container });
      return;
    }
    if (drag.kind === 'zone') {
      const delta = drag.edge === 'bottom' ? dy : -dy;
      drag.current = Math.max(0, Math.min(size.height / 2, Math.round(drag.startH + delta)));
      const z = layout.zones.find((l) => l.key === drag.zone);
      if (z) {
        const yLine = drag.edge === 'bottom' ? z.rect.y + drag.current : z.rect.y + z.rect.h - drag.current;
        setLiveEdge({ y: yLine, label: `${ZONE_LABELS[drag.zone]} · ${drag.current}px` });
      }
      return;
    }
    if (drag.kind === 'width') {
      const pct = Math.max(10, Math.min(100, Math.round((drag.startW + (dx / drag.contentW) * 100) / 5) * 5));
      drag.current = pct;
      const b = layout.blocks.find((l) => l.id === drag.id);
      if (b) setLiveEdge({ x: b.rect.x + (drag.contentW * pct) / 100, label: `Width ${pct}%` });
      return;
    }
    if (drag.kind === 'region') {
      drag.current = Math.max(20, Math.round(drag.startH + dy));
      const r = layout.regions.find((l) => l.id === drag.id);
      if (r) setLiveEdge({ y: r.rect.y + drag.current, label: `Height ${drag.current}px` });
    }
  };

  const onPointerUp = () => {
    const drag = dragRef.current;
    dragRef.current = null;
    setSnapLines(null);
    setLiveEdge(null);
    if (!drag || !doc) return;
    if ((drag.kind === 'move' || drag.kind === 'resize') && drag.moved && drag.box) {
      commit(updateElement(doc, drag.id, drag.box));
      setLiveBox(null);
      return;
    }
    setLiveBox(null);
    if (drag.kind === 'zone' && drag.current !== drag.startH) commit(updateZone(doc, drag.zone, { height: drag.current }));
    if (drag.kind === 'width' && drag.current !== drag.startW) commit(updateBlock(doc, drag.id, { width: drag.current }));
    if (drag.kind === 'region' && drag.current !== drag.startH) commit(updateBlock(doc, drag.id, { height: drag.current } as never));
  };

  const onDoubleClick = (e: React.MouseEvent) => {
    if (!doc) return;
    const { x, y } = toPage(e);
    const hit = hitTest(x, y);
    if (hit?.kind === 'element') {
      const found = findElement(doc, hit.id);
      if (found?.element.type === 'text' && !found.element.locked) setEditingText(hit.id);
    }
  };

  // Bring a newly selected block/element into view (added from the palette,
  // picked in Layers, or jumped to from a warning).
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!selection || (selection.kind !== 'block' && selection.kind !== 'element')) return;
    const scroller = hostRef.current?.closest('[data-testid="designer-scroll"]') as HTMLElement | null;
    if (!scroller || !hostRef.current) return;
    let rect: Rect | null = null;
    if (selection.kind === 'block') rect = layout.blocks.find((b) => b.id === selection.id)?.rect ?? null;
    else rect = elementBox(selection.id)?.rect ?? null;
    if (!rect) return;
    const top = hostRef.current.offsetTop + rect.y * zoom;
    const bottom = top + rect.h * zoom;
    const viewTop = scroller.scrollTop;
    const viewBottom = viewTop + scroller.clientHeight;
    if (top < viewTop + 24 || bottom > viewBottom - 24) {
      scroller.scrollTo({ top: Math.max(0, top - 80), behavior: 'smooth' });
    }
    // Only when the selection changes (or its first layout arrives).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selection, layout.blocks.length]);

  // ── what to draw ──
  const selectedBlockRects = useMemo(
    () => (selection?.kind === 'block' ? layout.blocks.filter((b) => b.id === selection.id) : []),
    [selection, layout],
  );
  const hoverRects = useMemo(() => {
    if (!hover || JSON.stringify(hover) === JSON.stringify(selection)) return [];
    if (hover.kind === 'block') return layout.blocks.filter((b) => b.id === hover.id).map((b) => b.rect);
    if (hover.kind === 'element') {
      const b = elementBox(hover.id);
      return b ? [b.rect] : [];
    }
    if (hover.kind === 'zone') return layout.zones.filter((z) => z.key === hover.zone).map((z) => z.rect);
    return [];
  }, [hover, selection, layout, elementBox]);

  const selectedEl = selection?.kind === 'element' ? elementBox(selection.id) : null;
  const elRect = selectedEl ? (liveBox && liveBox.id === selectedEl.el.id ? { ...liveBox.box, x: selectedEl.container.x + liveBox.box.x, y: selectedEl.container.y + liveBox.box.y } : selectedEl.rect) : null;
  const inv = 1 / zoom;
  const selectedBlock = selection?.kind === 'block' && doc ? findBlock(doc, selection.id)?.block : null;

  const blockAction = (fn: 'up' | 'down' | 'dup' | 'del') => {
    if (!doc || selection?.kind !== 'block') return;
    if (fn === 'up') commit(moveBlock(doc, selection.id, -1));
    if (fn === 'down') commit(moveBlock(doc, selection.id, 1));
    if (fn === 'dup') {
      const r = duplicateBlock(doc, selection.id);
      commit(r.doc);
      if (r.newId) select({ kind: 'block', id: r.newId });
    }
    if (fn === 'del') {
      commit(removeBlock(doc, selection.id));
      select(null);
    }
  };

  const scaledW = size.width * zoom;
  const scaledH = Math.max(layout.height, size.height) * zoom;

  return (
    <div ref={hostRef} className="relative mx-auto" style={{ width: scaledW, height: scaledH }} data-testid="designer-canvas">
      <div className="absolute left-0 top-0 origin-top-left" style={{ width: size.width, transform: `scale(${zoom})` }}>
        <iframe
          ref={iframeRef}
          title="Report pages"
          srcDoc={SRC_DOC}
          onLoad={onFrameLoad}
          sandbox="allow-same-origin"
          className="block border-0"
          style={{ width: size.width, height: Math.max(layout.height, size.height) }}
        />
        <div
          ref={overlayRef}
          className="absolute inset-0 select-none"
          style={{ touchAction: 'none', cursor: dragRef.current ? 'grabbing' : 'default' }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onPointerLeave={() => !dragRef.current && setHover(null)}
          onDoubleClick={onDoubleClick}
          data-testid="designer-overlay"
        >
          {/* hover */}
          {hoverRects.map((r, i) => (
            <div key={`h${i}`} className="pointer-events-none absolute border border-indigo-400/70" style={{ left: r.x, top: r.y, width: r.w, height: r.h, borderWidth: inv }} />
          ))}

          {/* zones: dashed frame + height handle when selected */}
          {selection?.kind === 'zone' &&
            layout.zones
              .filter((z) => z.key === selection.zone)
              .map((z, i) => {
                const isFooter = z.key === 'footer' || z.key === 'firstFooter';
                return (
                  <div key={`z${i}`} className="absolute border-dashed border-indigo-500 bg-indigo-500/5" style={{ left: z.rect.x, top: z.rect.y, width: z.rect.w, height: z.rect.h, borderWidth: 2 * inv }}>
                    <span className="absolute left-1 whitespace-nowrap rounded bg-indigo-600 px-1.5 py-0.5 font-sans font-semibold text-white" style={{ top: isFooter ? undefined : '100%', bottom: isFooter ? '100%' : undefined, fontSize: 10 * inv, marginTop: 2 * inv }}>
                      {ZONE_LABELS[z.key]}
                    </span>
                    <div
                      onPointerDown={(e) => startZone(e, z.key)}
                      onPointerMove={onPointerMove}
                      onPointerUp={onPointerUp}
                      className="absolute left-1/2 cursor-ns-resize rounded-full border border-white bg-indigo-600 shadow"
                      style={{ width: 36 * inv, height: 8 * inv, marginLeft: -18 * inv, [isFooter ? 'top' : 'bottom']: -4 * inv }}
                      title="Drag to change the height"
                      data-testid="zone-height-handle"
                    />
                  </div>
                );
              })}

          {/* selected block (every fragment) */}
          {selectedBlockRects.map((b, i) => (
            <div key={`b${i}`} className="pointer-events-none absolute border-indigo-600" style={{ left: b.rect.x, top: b.rect.y, width: b.rect.w, height: b.rect.h, borderWidth: 2 * inv }}>
              {i === 0 && selectedBlock && (
                <div className="pointer-events-auto absolute right-0 flex items-center gap-0.5 rounded-lg bg-slate-900 p-0.5 text-white shadow-lg" style={{ bottom: '100%', marginBottom: 4 * inv, transform: `scale(${inv})`, transformOrigin: 'bottom right' }}>
                  <span className="px-2 text-[11px] font-semibold">{selectedBlock.name || blockLabel(selectedBlock.type)}</span>
                  <button type="button" className="rounded p-1 hover:bg-white/15" title="Move up" onPointerDown={(e) => e.stopPropagation()} onClick={() => blockAction('up')} data-testid="block-up">
                    <ArrowUpIcon className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="rounded p-1 hover:bg-white/15" title="Move down" onPointerDown={(e) => e.stopPropagation()} onClick={() => blockAction('down')} data-testid="block-down">
                    <ArrowDownIcon className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="rounded p-1 hover:bg-white/15" title="Duplicate" onPointerDown={(e) => e.stopPropagation()} onClick={() => blockAction('dup')}>
                    <DocumentDuplicateIcon className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" className="rounded p-1 text-rose-300 hover:bg-rose-500/30" title="Delete" onPointerDown={(e) => e.stopPropagation()} onClick={() => blockAction('del')} data-testid="block-delete">
                    <TrashIcon className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
              {i === 0 && selectedBlock && selectedBlock.type !== 'freePage' && selectedBlock.type !== 'pageBreak' && (
                <div
                  className="pointer-events-auto absolute top-1/2 cursor-ew-resize rounded-full border border-white bg-indigo-600 shadow"
                  style={{ right: -5 * inv, width: 8 * inv, height: 32 * inv, marginTop: -16 * inv }}
                  onPointerDown={(e) => startWidth(e, selectedBlock.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  title="Drag to change the width"
                  data-testid="block-width-handle"
                />
              )}
            </div>
          ))}
          {selectedBlock?.type === 'canvas' &&
            layout.regions
              .filter((r) => r.id === selectedBlock.id)
              .map((r, i) => (
                <div
                  key={`r${i}`}
                  className="absolute left-1/2 cursor-ns-resize rounded-full border border-white bg-indigo-600 shadow"
                  style={{ top: r.rect.y + r.rect.h - 4 * inv, width: 36 * inv, height: 8 * inv, marginLeft: -18 * inv }}
                  onPointerDown={(e) => startRegion(e, selectedBlock.id)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  title="Drag to change the height"
                />
              ))}

          {/* selected element */}
          {elRect && selectedEl && (
            <div
              className="pointer-events-none absolute"
              style={{
                left: elRect.x,
                top: elRect.y,
                width: elRect.w,
                height: elRect.h,
                outline: `${2 * inv}px solid ${selectedEl.el.locked ? '#94a3b8' : '#4f46e5'}`,
                transform: selectedEl.el.rotation ? `rotate(${selectedEl.el.rotation}deg)` : undefined,
              }}
              data-testid="element-selection"
            >
              {!selectedEl.el.locked &&
                editingTextId !== selectedEl.el.id &&
                HANDLES.map((h) => (
                  <div
                    key={h}
                    onPointerDown={(e) => startHandle(e, h)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    className="pointer-events-auto absolute rounded-sm border border-indigo-600 bg-white"
                    data-testid={`handle-${h}`}
                    style={{
                      width: 9 * inv,
                      height: 9 * inv,
                      left: h.includes('w') ? -5 * inv : h.includes('e') ? undefined : `calc(50% - ${4.5 * inv}px)`,
                      right: h.includes('e') ? -5 * inv : undefined,
                      top: h.includes('n') ? -5 * inv : h.includes('s') ? undefined : `calc(50% - ${4.5 * inv}px)`,
                      bottom: h.includes('s') ? -5 * inv : undefined,
                      cursor: `${h}-resize`,
                    }}
                  />
                ))}
              {liveBox && (
                <span className="absolute left-0 whitespace-nowrap rounded bg-slate-900 px-1.5 py-0.5 font-sans text-white" style={{ top: '100%', marginTop: 4 * inv, fontSize: 10 * inv }}>
                  {Math.round(liveBox.box.x)}, {Math.round(liveBox.box.y)} · {Math.round(liveBox.box.w)}×{Math.round(liveBox.box.h)}
                </span>
              )}
            </div>
          )}

          {/* inline text editing */}
          {editingTextId && selectedEl && selectedEl.el.type === 'text' && elRect && (
            <InlineTextEditor
              key={editingTextId}
              rect={elRect}
              element={selectedEl.el}
              onDone={(text) => {
                setEditingText(null);
                if (doc && text !== (selectedEl.el as { text: string }).text) commit(updateElement(doc, selectedEl.el.id, { text } as Partial<CanvasElement>));
              }}
            />
          )}

          {/* snapping guides */}
          {snapLines &&
            snapLines.x.map((x, i) => (
              <div key={`sx${i}`} className="pointer-events-none absolute bg-fuchsia-500" style={{ left: snapLines.container.x + x, top: snapLines.container.y - 40, width: inv, height: snapLines.container.h + 80 }} />
            ))}
          {snapLines &&
            snapLines.y.map((y, i) => (
              <div key={`sy${i}`} className="pointer-events-none absolute bg-fuchsia-500" style={{ top: snapLines.container.y + y, left: 0, height: inv, width: size.width }} />
            ))}
          {liveEdge && (
            <>
              {liveEdge.y !== undefined && <div className="pointer-events-none absolute bg-indigo-600" style={{ top: liveEdge.y, left: 0, width: size.width, height: 2 * inv }} />}
              {liveEdge.x !== undefined && <div className="pointer-events-none absolute bg-indigo-600" style={{ left: liveEdge.x, top: 0, width: 2 * inv, height: layout.height }} />}
              <span className="pointer-events-none absolute rounded bg-indigo-600 px-1.5 py-0.5 font-sans text-white" style={{ left: (liveEdge.x ?? 24) + 6 * inv, top: (liveEdge.y ?? 24) + 6 * inv, fontSize: 11 * inv }}>
                {liveEdge.label}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function InlineTextEditor({ rect, element, onDone }: { rect: Rect; element: CanvasElement; onDone: (text: string) => void }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const el = element as CanvasElement & { text: string; style?: { fontSize?: number; align?: string } };
  const [value, setValue] = useState(el.text);
  useEffect(() => {
    ref.current?.focus();
    ref.current?.select();
  }, []);
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onPointerDown={(e) => e.stopPropagation()}
      onBlur={() => onDone(value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Escape') onDone(el.text);
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onDone(value);
      }}
      className="absolute z-10 resize-none rounded border-2 border-indigo-600 bg-white/95 p-1 font-sans text-slate-900 shadow-lg outline-none"
      style={{ left: rect.x, top: rect.y, width: Math.max(rect.w, 160), height: Math.max(rect.h, 48), fontSize: Math.max(11, Math.min(20, el.style?.fontSize ?? 13)) }}
      data-testid="inline-text-editor"
    />
  );
}
