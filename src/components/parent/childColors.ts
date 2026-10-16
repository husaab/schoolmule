// Deterministic per-child accent colors for the parent portal (e.g. the
// selected child's filter pill). A child is pictured by their avatar, never a
// letter. Every class string below is a full literal so Tailwind v4 can see
// it at build time — never assemble these dynamically.

export type ChildColor = {
  bg: string;
  text: string;
  border: string;
  dot: string;
};

const CHILD_COLORS: ChildColor[] = [
  {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-400',
  },
  {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    dot: 'bg-violet-400',
  },
  {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
  },
  {
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-400',
  },
  {
    bg: 'bg-fuchsia-50',
    text: 'text-fuchsia-700',
    border: 'border-fuchsia-200',
    dot: 'bg-fuchsia-400',
  },
];

/** Stable color for a child, derived from their studentId. */
export function childColor(studentId: string): ChildColor {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = (hash * 31 + studentId.charCodeAt(i)) >>> 0;
  }
  return CHILD_COLORS[hash % CHILD_COLORS.length];
}

/** App-wide grade color convention: >=80 green, >=60 neutral, else red. */
export function gradeTextColor(pct: number | null | undefined): string {
  if (pct == null) return 'text-slate-400';
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 60) return 'text-slate-900';
  return 'text-rose-600';
}
