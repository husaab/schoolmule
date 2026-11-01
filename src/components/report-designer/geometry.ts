/**
 * Pointer geometry for free-canvas editing: moving and resizing boxes in
 * page px, with snapping to guide lines. Pure, unit-tested.
 */

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

export type Handle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const HANDLES: Handle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'];

export interface Guides {
  x: number[]; // vertical lines (x positions)
  y: number[]; // horizontal lines
}

export interface SnapResult {
  box: Box;
  lines: { x: number[]; y: number[] };
}

const MIN = 6;

/** The box after dragging a resize handle by (dx, dy). Shift keeps the aspect ratio (corners). */
export function resizeBox(start: Box, handle: Handle, dx: number, dy: number, keepAspect = false): Box {
  let { x, y, w, h } = start;
  if (handle.includes('e')) w = start.w + dx;
  if (handle.includes('s')) h = start.h + dy;
  if (handle.includes('w')) {
    w = start.w - dx;
    x = start.x + dx;
  }
  if (handle.includes('n')) {
    h = start.h - dy;
    y = start.y + dy;
  }
  if (keepAspect && handle.length === 2 && start.w > 0 && start.h > 0) {
    const ratio = start.w / start.h;
    if (Math.abs(w / start.w) > Math.abs(h / start.h)) h = w / ratio;
    else w = h * ratio;
    if (handle.includes('w')) x = start.x + start.w - w;
    if (handle.includes('n')) y = start.y + start.h - h;
  }
  if (w < MIN) {
    if (handle.includes('w')) x -= MIN - w;
    w = MIN;
  }
  if (h < MIN) {
    if (handle.includes('n')) y -= MIN - h;
    h = MIN;
  }
  return { x, y, w, h };
}

/**
 * Snap a moving box's edges/centre to the nearest guide within `threshold`.
 * When resizing, only the edges being dragged snap.
 */
export function snapBox(box: Box, guides: Guides, threshold: number, handle: Handle | 'move' = 'move'): SnapResult {
  const out = { ...box };
  const lines = { x: [] as number[], y: [] as number[] };

  const best = (candidates: Array<{ value: number; apply: (g: number) => void }>, targets: number[], axis: 'x' | 'y') => {
    let hit: { d: number; g: number; apply: (g: number) => void } | null = null;
    for (const c of candidates) {
      for (const g of targets) {
        const d = Math.abs(c.value - g);
        if (d <= threshold && (!hit || d < hit.d)) hit = { d, g, apply: c.apply };
      }
    }
    if (hit) {
      hit.apply(hit.g);
      lines[axis].push(hit.g);
    }
  };

  if (handle === 'move') {
    best(
      [
        { value: box.x, apply: (g) => (out.x = g) },
        { value: box.x + box.w / 2, apply: (g) => (out.x = g - box.w / 2) },
        { value: box.x + box.w, apply: (g) => (out.x = g - box.w) },
      ],
      guides.x,
      'x',
    );
    best(
      [
        { value: box.y, apply: (g) => (out.y = g) },
        { value: box.y + box.h / 2, apply: (g) => (out.y = g - box.h / 2) },
        { value: box.y + box.h, apply: (g) => (out.y = g - box.h) },
      ],
      guides.y,
      'y',
    );
    return { box: out, lines };
  }

  if (handle.includes('e')) best([{ value: box.x + box.w, apply: (g) => (out.w = g - box.x) }], guides.x, 'x');
  if (handle.includes('w')) best([{ value: box.x, apply: (g) => ((out.w = box.x + box.w - g), (out.x = g)) }], guides.x, 'x');
  if (handle.includes('s')) best([{ value: box.y + box.h, apply: (g) => (out.h = g - box.y) }], guides.y, 'y');
  if (handle.includes('n')) best([{ value: box.y, apply: (g) => ((out.h = box.y + box.h - g), (out.y = g)) }], guides.y, 'y');
  return { box: out, lines };
}

/** Guide lines for a container: its edges and centre, the page margins, and the other boxes. */
export function guidesFor(container: { w: number; h: number }, others: Box[], extraX: number[] = []): Guides {
  const x = [0, container.w / 2, container.w, ...extraX];
  const y = [0, container.h / 2, container.h];
  for (const o of others) {
    x.push(o.x, o.x + o.w / 2, o.x + o.w);
    y.push(o.y, o.y + o.h / 2, o.y + o.h);
  }
  return { x, y };
}

export const round = (v: number, step = 1) => Math.round(v / step) * step;

export function roundBox(b: Box): Box {
  return { x: round(b.x), y: round(b.y), w: round(b.w), h: round(b.h) };
}
