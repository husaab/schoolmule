import { describe, expect, it } from 'vitest';
import { planPages, type PlanItem } from './splitPlan';

const page = (h: number) => () => h;
const rows = (n: number, h = 10, keepWithNext: number[] = []) =>
  Array.from({ length: n }, (_, i) => ({ height: h, keepWithNext: keepWithNext.includes(i) }));

describe('planPages', () => {
  it('stacks atomic blocks on one page while they fit', () => {
    const items: PlanItem[] = [
      { kind: 'atomic', height: 40 },
      { kind: 'atomic', height: 40, marginTop: 10 },
    ];
    const plan = planPages(items, page(200));
    expect(plan.pages).toHaveLength(1);
    expect(plan.pages[0].fragments.map((f) => f.marginTop)).toEqual([0, 10]);
  });

  it('moves a block that does not fit to the next page and drops its top margin there', () => {
    const items: PlanItem[] = [
      { kind: 'atomic', height: 150 },
      { kind: 'atomic', height: 80, marginTop: 20 },
    ];
    const plan = planPages(items, page(200));
    expect(plan.pages).toHaveLength(2);
    expect(plan.pages[1].fragments[0]).toMatchObject({ item: 1, marginTop: 0 });
  });

  it('flags a block taller than an empty page as oversize and keeps it', () => {
    const plan = planPages([{ kind: 'atomic', height: 500 }], page(200));
    expect(plan.pages).toHaveLength(1);
    expect(plan.oversize).toEqual([0]);
    expect(plan.pages[0].fragments[0].oversize).toBe(true);
  });

  it('honours breakBefore only when the page already has content', () => {
    const items: PlanItem[] = [
      { kind: 'atomic', height: 10, breakBefore: true },
      { kind: 'atomic', height: 10, breakBefore: true },
    ];
    const plan = planPages(items, page(200));
    expect(plan.pages.map((p) => p.fragments.map((f) => f.item))).toEqual([[0], [1]]);
  });

  it('splits a table between rows and repeats the header on each page', () => {
    // body 100 - slack 1 = 99; chrome 2 + head 10 = 12 → 8 rows of 10 = 92 fit
    const items: PlanItem[] = [{ kind: 'table', head: 10, chrome: 2, rows: rows(20) }];
    const plan = planPages(items, page(100));
    expect(plan.pages.map((p) => p.fragments[0].rows)).toEqual([
      [0, 8],
      [8, 16],
      [16, 20],
    ]);
    expect(plan.pages.every((p) => p.fragments[0].withHead)).toBe(true);
  });

  it('starts a table on the current page after other content', () => {
    const items: PlanItem[] = [
      { kind: 'atomic', height: 50 },
      { kind: 'table', head: 0, chrome: 0, rows: rows(10) },
    ];
    const plan = planPages(items, page(100));
    // 99 - 50 = 49 → 4 rows on page 1, 6 on page 2
    expect(plan.pages[0].fragments[1].rows).toEqual([0, 4]);
    expect(plan.pages[1].fragments[0].rows).toEqual([4, 10]);
  });

  it('never leaves a group bar alone at the bottom of a page', () => {
    // rows: 0..3 items, 4 = group bar (keepWithNext), 5..9 items; 5 rows fit (49)
    const items: PlanItem[] = [{ kind: 'table', head: 0, chrome: 0, rows: rows(10, 10, [4]) }];
    const plan = planPages(items, page(50));
    expect(plan.pages[0].fragments[0].rows).toEqual([0, 4]);
    expect(plan.pages[1].fragments[0].rows?.[0]).toBe(4);
  });

  it('keeps a chain of bars (title, group, sub-group) with the first row', () => {
    const items: PlanItem[] = [
      { kind: 'atomic', height: 70 },
      { kind: 'table', head: 0, chrome: 0, rows: rows(6, 10, [0, 1, 2]) },
    ];
    // after 70, 29 left: bars 0,1 fit (20) but bar 2 + row 3 don't → whole table moves
    const plan = planPages(items, page(100));
    expect(plan.pages[0].fragments).toHaveLength(1);
    expect(plan.pages[1].fragments[0].rows).toEqual([0, 6]);
  });

  it('keeps a keepTogether table whole when it fits a page', () => {
    const items: PlanItem[] = [
      { kind: 'atomic', height: 60 },
      { kind: 'table', head: 0, chrome: 0, rows: rows(5), keepTogether: true },
    ];
    const plan = planPages(items, page(100));
    expect(plan.pages).toHaveLength(2);
    expect(plan.pages[1].fragments[0].rows).toBeUndefined();
  });

  it('splits a keepTogether table anyway when it is taller than a page', () => {
    const items: PlanItem[] = [{ kind: 'table', head: 0, chrome: 0, rows: rows(30), keepTogether: true }];
    const plan = planPages(items, page(100));
    expect(plan.pages.length).toBeGreaterThan(1);
    expect(plan.oversize).toEqual([]);
  });

  it('forces progress when one row is taller than a page', () => {
    const items: PlanItem[] = [{ kind: 'table', head: 0, chrome: 0, rows: [{ height: 10 }, { height: 500 }, { height: 10 }] }];
    const plan = planPages(items, page(100));
    expect(plan.pages.map((p) => p.fragments[0].rows)).toEqual([
      [0, 1],
      [1, 2],
      [2, 3],
    ]);
    expect(plan.oversize).toEqual([0]);
  });

  it('uses a different body height for page 1 (taller first-page header)', () => {
    const items: PlanItem[] = [{ kind: 'table', head: 0, chrome: 0, rows: rows(10) }];
    const plan = planPages(items, (i) => (i === 0 ? 31 : 101));
    expect(plan.pages.map((p) => p.fragments[0].rows)).toEqual([
      [0, 3],
      [3, 10],
    ]);
  });

  it('puts a full (free-canvas) page alone and continues after it', () => {
    const items: PlanItem[] = [{ kind: 'atomic', height: 10 }, { kind: 'fullPage' }, { kind: 'atomic', height: 10 }];
    const plan = planPages(items, page(100));
    expect(plan.pages).toHaveLength(3);
    expect(plan.pages[1].fullPage).toBe(1);
    expect(plan.pages[2].fragments[0].item).toBe(2);
  });

  it('a break at the end leaves no empty trailing page', () => {
    const items: PlanItem[] = [{ kind: 'atomic', height: 10 }, { kind: 'break' }];
    expect(planPages(items, page(100)).pages).toHaveLength(1);
  });

  it('never carries a single row onto the next page (widows)', () => {
    // 9 rows fit (99/10); 10 rows → 1 left over → pull one back so 2 move
    const items: PlanItem[] = [{ kind: 'table', head: 0, chrome: 0, rows: rows(10) }];
    const plan = planPages(items, page(100));
    expect(plan.pages.map((p) => p.fragments[0].rows)).toEqual([
      [0, 8],
      [8, 10],
    ]);
  });

  it('carries the bottom margin only on the last fragment of a split table', () => {
    const items: PlanItem[] = [{ kind: 'table', head: 0, chrome: 0, rows: rows(15), marginBottom: 8 }];
    const plan = planPages(items, page(100));
    expect(plan.pages[0].fragments[0].marginBottom).toBe(0);
    expect(plan.pages[1].fragments[0].marginBottom).toBe(8);
  });
});
