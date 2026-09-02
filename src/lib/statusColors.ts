// Resolves a status's palette token to Tailwind classes.
//
// Statuses store a token ('cyan', 'amber', …) rather than raw CSS, so the
// palette can be restyled here without touching stored data. The full class
// strings are written out because Tailwind scans source statically and would
// purge anything built by string interpolation.

import type { StatusColor } from '@/services/types/registrationStatus';

interface StatusStyle {
  /** Pill / badge, used in table cells and the detail header. */
  badge: string;
  /** Small colour swatch for the status manager and pickers. */
  dot: string;
}

const STYLES: Record<StatusColor, StatusStyle> = {
  cyan:    { badge: 'bg-cyan-100 text-cyan-700',       dot: 'bg-cyan-500' },
  emerald: { badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  amber:   { badge: 'bg-amber-100 text-amber-700',     dot: 'bg-amber-500' },
  rose:    { badge: 'bg-rose-100 text-rose-700',       dot: 'bg-rose-500' },
  violet:  { badge: 'bg-violet-100 text-violet-700',   dot: 'bg-violet-500' },
  blue:    { badge: 'bg-blue-100 text-blue-700',       dot: 'bg-blue-500' },
  slate:   { badge: 'bg-slate-100 text-slate-600',     dot: 'bg-slate-400' },
};

const FALLBACK: StatusStyle = STYLES.slate;

export const STATUS_COLORS = Object.keys(STYLES) as StatusColor[];

export const statusBadgeClass = (color: string | undefined): string =>
  (STYLES[color as StatusColor] || FALLBACK).badge;

export const statusDotClass = (color: string | undefined): string =>
  (STYLES[color as StatusColor] || FALLBACK).dot;
