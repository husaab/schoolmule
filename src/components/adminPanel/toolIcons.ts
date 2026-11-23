// The web's icons and hues for lib/adminTools' keys. A group's hue marks
// which group a tool belongs to; amber, rose and emerald stay free to mean
// "needs you", "broken" and "fine" (components/ui/StatTile).

import type React from 'react'
import {
  BookOpenIcon,
  CalendarDaysIcon,
  ChatBubbleOvalLeftEllipsisIcon,
  ClipboardDocumentListIcon,
  ClockIcon,
  CogIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  KeyIcon,
  LockClosedIcon,
  PhotoIcon,
  ShieldCheckIcon,
  SparklesIcon,
  TableCellsIcon,
  UserGroupIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'
import type { AdminToolIcon, AdminToolTone } from '@/lib/adminTools'
import type { StatusTone } from '@/lib/adminOverview'

export const TOOL_ICONS: Record<AdminToolIcon, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  users: UsersIcon,
  lock: LockClosedIcon,
  key: KeyIcon,
  shield: ShieldCheckIcon,
  family: UserGroupIcon,
  chat: ChatBubbleOvalLeftEllipsisIcon,
  cog: CogIcon,
  calendar: CalendarDaysIcon,
  photo: PhotoIcon,
  document: DocumentTextIcon,
  table: TableCellsIcon,
  clock: ClockIcon,
  book: BookOpenIcon,
  forms: ClipboardDocumentListIcon,
  finance: CurrencyDollarIcon,
  sparkles: SparklesIcon,
}

/** The small square behind a tool's icon. */
export const TONE_CHIP: Record<AdminToolTone, string> = {
  cyan: 'bg-cyan-50 text-cyan-700',
  violet: 'bg-violet-50 text-violet-700',
  indigo: 'bg-indigo-50 text-indigo-700',
  teal: 'bg-teal-50 text-teal-700',
  slate: 'bg-slate-100 text-slate-600',
}

export const STATUS_TEXT: Record<StatusTone, string> = {
  neutral: 'text-slate-500',
  good: 'text-emerald-700',
  warn: 'text-amber-700',
  bad: 'text-rose-700',
}
