// src/components/studentPortal/todo/TodoTabs.tsx
// "Assigned 4 · Missing 1 · Done" (Student-Todo board): the three tabs of the
// To-do in a pale track, the open one raised. The number beside Assigned is in
// indigo, beside Missing in rose. The open tab is `tab` in the URL.
// A proper tab list (final review M13): one tab stop, arrow keys (and Home and
// End) move to and open the next tab, and each tab names the panel it opens.
'use client'

import { useRef, type KeyboardEvent } from 'react'
import type { TodoTabEntry } from '@/lib/todoText'
import type { TodoTab } from '@/lib/portalRoutes'

interface TodoTabsProps {
  tabs: TodoTabEntry[]
  active: TodoTab
  onSelect: (tab: TodoTab) => void
  /** The id of the list the tabs open (role="tabpanel"). */
  panelId: string
}

/** The id of a tab, for the panel's aria-labelledby. */
export const todoTabId = (tab: TodoTab) => `todo-tab-${tab}`

const COUNT_INK: Record<TodoTab, string> = {
  assigned: 'text-indigo-700',
  missing: 'font-semibold text-rose-700',
  done: 'text-slate-500',
}

export default function TodoTabs({ tabs, active, onSelect, panelId }: TodoTabsProps) {
  const listRef = useRef<HTMLDivElement>(null)
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const at = tabs.findIndex((t) => t.id === active)
    const to =
      e.key === 'ArrowRight' ? (at + 1) % tabs.length
        : e.key === 'ArrowLeft' ? (at - 1 + tabs.length) % tabs.length
          : e.key === 'Home' ? 0
            : e.key === 'End' ? tabs.length - 1
              : -1
    if (to < 0 || at < 0) return
    e.preventDefault()
    onSelect(tabs[to].id)
    listRef.current?.querySelector<HTMLButtonElement>(`#${todoTabId(tabs[to].id)}`)?.focus()
  }
  return (
    <div
      ref={listRef}
      role="tablist"
      aria-label="To-do"
      onKeyDown={onKey}
      className="flex max-w-full gap-1.5 self-start rounded-[14px] bg-slate-100 p-[5px]"
    >
      {tabs.map((tab) => {
        const on = tab.id === active
        return (
          <button
            key={tab.id}
            id={todoTabId(tab.id)}
            type="button"
            role="tab"
            aria-selected={on}
            aria-controls={panelId}
            tabIndex={on ? 0 : -1}
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
