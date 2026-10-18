// src/components/studentPortal/todo/TodoGroupList.tsx
// The groups of one To-do tab (Student-Todo board): a small heading ("Tomorrow",
// "Next week", "No due date", "Missing", "This week", "Earlier"; the server
// names and orders them) over the rows of that group.
'use client'

import TodoRow from '@/components/studentPortal/todo/TodoRow'
import type { TodoTab } from '@/lib/portalRoutes'
import type { TodoGroup } from '@/services/types/studentPortal'

interface TodoGroupListProps {
  groups: TodoGroup[]
  tab: TodoTab
  now?: Date
}

export default function TodoGroupList({ groups, tab, now = new Date() }: TodoGroupListProps) {
  return (
    <div className="flex flex-col gap-[22px]">
      {groups.map((group) => (
        <section key={group.label} className="flex flex-col gap-2.5" aria-label={group.label}>
          <h2 className={`text-sm font-semibold ${tab === 'missing' ? 'text-rose-700' : 'text-slate-600'}`}>{group.label}</h2>
          {group.items.map((item) => (
            <TodoRow key={item.itemId} item={item} tab={tab} group={group.label} now={now} />
          ))}
        </section>
      ))}
    </div>
  )
}
