'use client'

// The student's to-do (Student-Todo board): Assigned · Missing · Done tabs
// (?tab=), a chip per class to narrow it (?class=), and the tab's work in the
// server's groups. Each row opens the assignment. Both filters live in the URL
// and are remembered for this browser tab. The numbers on the tabs, and the
// badge on the nav item, are the server's counts.

import { Suspense, useEffect } from 'react'
import LoadError from '@/components/classroom/LoadError'
import NothingHere from '@/components/classroom/NothingHere'
import StudentShell from '@/components/studentPortal/StudentShell'
import TodoGroupList from '@/components/studentPortal/todo/TodoGroupList'
import TodoTabs from '@/components/studentPortal/todo/TodoTabs'
import { setTodoBadgeCounts } from '@/components/studentPortal/useStudentBadges'
import { useStudentClasses } from '@/components/studentPortal/useStudentClasses'
import { useFilterParams } from '@/hooks/useFilterParams'
import { useLoad } from '@/hooks/useLoad'
import { parseTodoTab, type TodoTab } from '@/lib/portalRoutes'
import { emptyTodoMessage, todoTabs } from '@/lib/todoText'
import { getStudentTodo } from '@/services/studentPortalService'
import { useUserStore } from '@/store/useUserStore'

function StudentTodoContent() {
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const filters = useFilterParams()
  const tab = parseTodoTab(filters.get('tab'))
  const classId = filters.get('class') || null
  const { classes } = useStudentClasses()

  const todo = useLoad(userId && role === 'STUDENT' ? `todo:${userId}:${tab}:${classId ?? ''}` : null, () =>
    getStudentTodo(tab, classId).then((r) => r.data),
  )
  const { reload } = todo
  const data = todo.data
  const counts = (data ?? todo.previous)?.counts ?? null

  // The nav badge is the whole to-do, not one class's: only an unfiltered answer sets it.
  useEffect(() => {
    if (userId && data && !classId) setTodoBadgeCounts(userId, data.counts)
  }, [userId, data, classId])

  // Coming back to the tab: the teacher may have posted something.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible') reload()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [reload])

  const className = classId ? (classes?.find((c) => c.classId === classId)?.subject ?? null) : null
  const selectTab = (next: TodoTab) => filters.setParams({ tab: next === 'assigned' ? null : next })
  const selectClass = (next: string | null) => filters.setParams({ class: next })
  const now = new Date()

  return (
    <StudentShell title="To-do">
      <div className="flex max-w-[1000px] flex-col gap-[22px]">
        <TodoTabs tabs={todoTabs(counts)} active={tab} onSelect={selectTab} />

        {classes && classes.length > 1 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-wrap md:overflow-visible md:px-0 md:pb-0" role="group" aria-label="Class">
            <ClassChip label="All classes" on={!classId} onClick={() => selectClass(null)} />
            {classes.map((c) => (
              <ClassChip key={c.classId} label={c.subject} on={c.classId === classId} onClick={() => selectClass(c.classId)} />
            ))}
          </div>
        )}

        {todo.error && !data ? (
          <LoadError title="We couldn't load your to-do" message={todo.error.message} onRetry={reload} />
        ) : !data ? (
          <div className="flex flex-col gap-2.5" aria-label="Loading">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[82px] animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : data.groups.length === 0 ? (
          <NothingHere message={emptyTodoMessage(tab, className)} />
        ) : (
          <TodoGroupList groups={data.groups} tab={tab} now={now} />
        )}
      </div>
    </StudentShell>
  )
}

function ClassChip({ label, on, onClick }: { label: string; on: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-10 shrink-0 cursor-pointer rounded-full border px-[13px] py-[7px] text-sm transition-colors ${
        on ? 'border-indigo-200 bg-indigo-50 font-medium text-indigo-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      }`}
    >
      {label}
    </button>
  )
}

export default function StudentTodoPage() {
  return (
    <Suspense fallback={null}>
      <StudentTodoContent />
    </Suspense>
  )
}
