/**
 * Page-break planning from measured heights. Pure: the renderer measures
 * every block (and every table row) at the real content width with the real
 * fonts, then this decides what goes on which page. Kept free of the DOM so
 * every rule is unit-tested.
 *
 * Rules:
 *   - A block that doesn't fit moves to the next page; on an empty page it
 *     stays and is flagged `oversize` (the renderer shrinks it).
 *   - Tables split between rows. Their column-header rows (`head`) repeat on
 *     every page they reach. A row marked keepWithNext (a title or group bar)
 *     never ends a page while more rows follow.
 *   - A split carries at least `widows` (2) rows onto the next page.
 *   - breakBefore starts a new page unless the page is still empty.
 *   - A block's top margin is dropped at the top of a page.
 *   - A full page (a free-canvas page) always sits alone.
 */

export interface PlanRow {
  height: number;
  keepWithNext?: boolean;
}

export type PlanItem =
  | { kind: 'atomic'; height: number; marginTop?: number; marginBottom?: number; breakBefore?: boolean }
  | {
      kind: 'table';
      head: number;
      chrome: number;
      rows: PlanRow[];
      marginTop?: number;
      marginBottom?: number;
      breakBefore?: boolean;
      keepTogether?: boolean;
      /** Fewest rows a split may carry onto the next page (default 2). */
      widows?: number;
    }
  | { kind: 'break' }
  | { kind: 'fullPage' };

export interface Fragment {
  item: number;
  /** Table rows [start, end) on this page. */
  rows?: [number, number];
  withHead?: boolean;
  marginTop: number;
  marginBottom: number;
  height: number;
  oversize?: boolean;
}

export interface PlannedPage {
  fragments: Fragment[];
  /** Index of the free-canvas item that fills this page. */
  fullPage?: number;
}

export interface Plan {
  pages: PlannedPage[];
  /** Items that didn't fit even an empty page. */
  oversize: number[];
}

export function planPages(items: PlanItem[], bodyHeight: (pageIndex: number) => number, slack = 1): Plan {
  const pages: PlannedPage[] = [];
  const oversize = new Set<number>();
  let page: PlannedPage = { fragments: [] };
  let y = 0;

  const open = () => {
    page = { fragments: [] };
    pages.push(page);
    y = 0;
  };
  open();

  const avail = () => bodyHeight(pages.length - 1) - slack;
  const hasContent = () => page.fragments.length > 0 || page.fullPage !== undefined;
  const leaveFullPage = () => {
    if (page.fullPage !== undefined) open();
  };

  const placeAtomic = (index: number, height: number, marginTop: number, marginBottom: number, breakBefore: boolean) => {
    leaveFullPage();
    if (breakBefore && hasContent()) open();
    let mt = hasContent() ? marginTop : 0;
    if (hasContent() && y + mt + height > avail()) {
      open();
      mt = 0;
    }
    const tooBig = y + mt + height > avail();
    if (tooBig) oversize.add(index);
    page.fragments.push({ item: index, marginTop: mt, marginBottom, height, oversize: tooBig || undefined });
    y += mt + height + marginBottom;
  };

  items.forEach((item, index) => {
    if (item.kind === 'break') {
      if (hasContent()) open();
      return;
    }

    if (item.kind === 'fullPage') {
      if (hasContent()) open();
      page.fullPage = index;
      return;
    }

    const marginTop = item.marginTop ?? 0;
    const marginBottom = item.marginBottom ?? 0;

    if (item.kind === 'atomic') {
      placeAtomic(index, item.height, marginTop, marginBottom, !!item.breakBefore);
      return;
    }

    // Table.
    const { rows, head, chrome } = item;
    const total = chrome + head + rows.reduce((sum, r) => sum + r.height, 0);
    const fitsOnePage = total <= bodyHeight(pages.length - 1) - slack;
    if (rows.length === 0 || (item.keepTogether && fitsOnePage)) {
      placeAtomic(index, total, marginTop, marginBottom, !!item.breakBefore);
      return;
    }

    let i = 0;
    let first = true;
    while (i < rows.length) {
      leaveFullPage();
      if (first && item.breakBefore && hasContent()) open();
      const mt = first && hasContent() ? marginTop : 0;
      const base = mt + chrome + head;

      let used = base;
      let j = i;
      while (j < rows.length && y + used + rows[j].height <= avail()) {
        used += rows[j].height;
        j++;
      }
      // Don't carry a lonely row or two onto the next page.
      const widows = item.widows ?? 2;
      const left = rows.length - j;
      if (j < rows.length && left < widows && j - i > widows) {
        const pull = widows - left;
        for (let k = 0; k < pull; k++) {
          j--;
          used -= rows[j].height;
        }
      }
      // Never end a page on a title/group bar while rows follow it.
      while (j < rows.length && j > i && rows[j - 1].keepWithNext) {
        j--;
        used -= rows[j].height;
      }

      let tooBig = false;
      if (j === i) {
        if (hasContent()) {
          open();
          continue;
        }
        // Even an empty page can't hold the next row (with its bars): place
        // the bars and one row anyway and let the renderer shrink them.
        used = base;
        do {
          used += rows[j].height;
          j++;
        } while (j < rows.length && rows[j - 1].keepWithNext);
        tooBig = true;
        oversize.add(index);
      }

      const last = j >= rows.length;
      page.fragments.push({
        item: index,
        rows: [i, j],
        withHead: head > 0,
        marginTop: mt,
        marginBottom: last ? marginBottom : 0,
        height: used - mt,
        oversize: tooBig || undefined,
      });
      y += used + (last ? marginBottom : 0);
      i = j;
      first = false;
      if (!last) open();
    }
  });

  // A trailing page left empty by a final break carries nothing.
  while (pages.length > 1 && pages[pages.length - 1].fragments.length === 0 && pages[pages.length - 1].fullPage === undefined) {
    pages.pop();
  }

  return { pages, oversize: [...oversize] };
}
