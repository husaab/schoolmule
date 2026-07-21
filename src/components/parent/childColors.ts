// Deterministic per-child avatar colors for the parent portal. Every class
// string below is a full literal so Tailwind v4 can see it at build time —
// never assemble these dynamically.

export type ChildColor = {
  solid: string; // avatar gradient
  bg: string;
  text: string;
  border: string;
  dot: string;
};

const CHILD_COLORS: ChildColor[] = [
  {
    solid: 'from-amber-400 to-orange-400',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
  },
  {
    solid: 'from-rose-400 to-pink-400',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    dot: 'bg-rose-400',
  },
  {
    solid: 'from-violet-400 to-purple-400',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    dot: 'bg-violet-400',
  },
  {
    solid: 'from-emerald-400 to-teal-400',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    dot: 'bg-emerald-400',
  },
  {
    solid: 'from-sky-400 to-blue-400',
    bg: 'bg-sky-50',
    text: 'text-sky-700',
    border: 'border-sky-200',
    dot: 'bg-sky-400',
  },
  {
    solid: 'from-fuchsia-400 to-pink-400',
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

/** First letter of the child's name, for the avatar circle. */
export function childInitial(name: string | null | undefined): string {
  return (name?.trim()?.[0] || '?').toUpperCase();
}

/** App-wide grade color convention: >=80 green, >=60 neutral, else red. */
export function gradeTextColor(pct: number | null | undefined): string {
  if (pct == null) return 'text-slate-400';
  if (pct >= 80) return 'text-emerald-600';
  if (pct >= 60) return 'text-slate-900';
  return 'text-rose-600';
}
