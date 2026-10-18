// src/components/studentPortal/todo/TodoRow.tsx
// One piece of work on the To-do (Student-Todo board): the class icon, the
// title, "Science · Ms. Siddiqui", and on the right when it is due ("Fri 3:30
// pm", amber when it is today or tomorrow; "Anytime" in slate) with what kind
// of work it is ("Assignment · photo or file"). The whole row opens the
// assignment.
'use client'

import Link from 'next/link'
import { todoKindLine, todoMeta, todoWhen, type TodoWhen } from '@/lib/todoText'
import { studentItemHref, type TodoTab } from '@/lib/portalRoutes'
import type { TodoItem } from '@/services/types/studentPortal'

interface TodoRowProps {
  item: TodoItem
  tab: TodoTab
  /** The group's label from the server ("Tomorrow", "Next week"…); it decides how the date is written. */
  group: string
  now?: Date
}

const WHEN_INK: Record<TodoWhen['tone'], string> = {
  amber: 'text-amber-800',
  ink: 'text-slate-900',
  slate: 'text-slate-500',
  rose: 'text-rose-700',
  emerald: 'text-emerald-700',
  indigo: 'text-indigo-700',
}

export default function TodoRow({ item, tab, group, now = new Date() }: TodoRowProps) {
  const when = todoWhen(item, tab, group, now)
  return (
    <Link
      href={studentItemHref(item.itemId, { from: 'todo' })}
      className={`flex items-center gap-4 rounded-2xl border bg-white px-[18px] py-4 text-slate-900 transition-colors hover:bg-slate-50 ${
        tab === 'missing' ? 'border-rose-200' : 'border-slate-200/70'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static class icon */}
      <img src={item.iconUrl} alt="" className="h-12 w-12 shrink-0 rounded-[14px]" />
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate text-base font-medium">{item.title}</span>
        <span className="truncate text-[13px] text-slate-500">{todoMeta(item)}</span>
      </span>
      <span className="flex shrink-0 flex-col items-end gap-1 text-right">
        <span className={`text-sm font-medium ${WHEN_INK[when.tone]}`}>{when.text}</span>
        <span className="text-xs text-slate-500">{todoKindLine(item)}</span>
      </span>
    </Link>
  )
}
