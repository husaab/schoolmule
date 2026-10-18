// src/components/studentPortal/todo/TodoTabs.tsx
// "Assigned 4 · Missing 1 · Done" (Student-Todo board): the three tabs of the
// To-do in a pale track, the open one raised. The number beside Assigned is in
// indigo, beside Missing in rose. The open tab is `tab` in the URL.
'use client'

import type { TodoTabEntry } from '@/lib/todoText'
import type { TodoTab } from '@/lib/portalRoutes'

interface TodoTabsProps {
  tabs: TodoTabEntry[]
  active: TodoTab
  onSelect: (tab: TodoTab) => void
}

const COUNT_INK: Record<TodoTab, string> = {
  assigned: 'text-indigo-700',
  missing: 'font-semibold text-rose-700',
  done: 'text-slate-500',
}

export default function TodoTabs({ tabs, active, onSelect }: TodoTabsProps) {
  return (
    <div role="tablist" aria-label="To-do" className="flex max-w-full gap-1.5 self-start rounded-[14px] bg-slate-100 p-[5px]">
      {tabs.map((tab) => {
        const on = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(tab.id)}
            className={`min-h-11 cursor-pointer rounded-[10px] px-[18px] py-2.5 text-[15px] transition-colors ${
              on ? 'bg-white font-medium text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.08)]' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
            {tab.count !== null && <span className={`ml-1.5 ${COUNT_INK[tab.id]}`}>{tab.count}</span>}
          </button>
        )
      })}
    </div>
  )
}
