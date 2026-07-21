'use client'

import React, { useEffect } from 'react'
import { Squares2X2Icon } from '@heroicons/react/24/outline'
import { useUserStore } from '@/store/useUserStore'
import {
  ALL_CHILDREN,
  useSelectedChildStore,
  useChildStoreHydrated,
} from '@/store/useSelectedChildStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { childColor, childInitial } from './childColors'

/**
 * Persistent child selector shown at the top of the parent sidebar.
 * "All children" renders every child stacked on data pages; picking a
 * child filters the whole portal. Selection persists across reloads.
 */
const ChildSwitcher: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const children = useSelectedChildStore((s) => s.children)
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId)
  const setChildren = useSelectedChildStore((s) => s.setChildren)
  const selectChild = useSelectedChildStore((s) => s.selectChild)
  const hydrated = useChildStoreHydrated()
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId) // refetch when the selected school year changes

  useEffect(() => {
    if (!user?.id || user.role !== 'PARENT') return
    getStudentsByParentId(user.id)
      .then((res) => {
        const list = (res.data || []).map((link) => ({
          studentId: link.studentId,
          name: link.student?.name || 'Unnamed Student',
          grade: link.student?.grade ?? null,
        }))
        setChildren(list)
      })
      .catch(() => {})
  }, [user?.id, user?.role, setChildren, selectedYearId])

  if (!hydrated || children.length === 0) return null

  const pillClass = (active: boolean) =>
    `w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-200 cursor-pointer text-left ${
      active
        ? 'bg-amber-50 border border-amber-200 text-amber-800 font-medium'
        : 'border border-transparent text-slate-600 hover:bg-slate-50'
    }`

  return (
    <div className="pb-3">
      <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
        Viewing
      </p>
      <div className="space-y-1">
        <button
          onClick={() => selectChild(ALL_CHILDREN)}
          className={pillClass(selectedChildId === ALL_CHILDREN)}
        >
          <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
            <Squares2X2Icon className="w-4 h-4 text-white" />
          </span>
          <span className="text-sm">All children</span>
        </button>

        {children.map((child) => {
          const color = childColor(child.studentId)
          const active = selectedChildId === child.studentId
          return (
            <button
              key={child.studentId}
              onClick={() => selectChild(child.studentId)}
              className={pillClass(active)}
            >
              <span
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-sm font-semibold flex-shrink-0`}
              >
                {childInitial(child.name)}
              </span>
              <span className="min-w-0">
                <span className="block text-sm truncate">{child.name}</span>
                {child.grade != null && (
                  <span className="block text-xs text-slate-400">Grade {child.grade}</span>
                )}
              </span>
            </button>
          )
        })}
      </div>
      <div className="pt-3">
        <div className="border-t border-slate-100" />
      </div>
    </div>
  )
}

export default ChildSwitcher
