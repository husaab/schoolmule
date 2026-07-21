'use client'

import React from 'react'
import { Squares2X2Icon } from '@heroicons/react/24/outline'
import {
  ALL_CHILDREN,
  useSelectedChildStore,
} from '@/store/useSelectedChildStore'
import { childColor, childInitial } from './childColors'

/**
 * Horizontal student filter pills for page toolbars. Drives the same
 * selected-child store as the sidebar switcher, so both stay in sync.
 * A selected child's pill lights up in that child's own avatar color.
 */
const ChildFilterPills: React.FC = () => {
  const children = useSelectedChildStore((s) => s.children)
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId)
  const selectChild = useSelectedChildStore((s) => s.selectChild)

  if (children.length === 0) return null

  const basePill =
    'flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border text-sm whitespace-nowrap transition-all duration-200 cursor-pointer'

  return (
    <div className="flex items-center gap-2 overflow-x-auto py-0.5">
      <button
        onClick={() => selectChild(ALL_CHILDREN)}
        className={`${basePill} ${
          selectedChildId === ALL_CHILDREN
            ? 'bg-amber-50 border-amber-200 text-amber-800 font-medium'
            : 'border-stone-200 text-slate-500 hover:bg-stone-50'
        }`}
      >
        <span className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center flex-shrink-0">
          <Squares2X2Icon className="w-3.5 h-3.5 text-white" />
        </span>
        All
      </button>

      {children.map((child) => {
        const color = childColor(child.studentId)
        const active = selectedChildId === child.studentId
        const firstName = child.name.split(' ')[0]
        return (
          <button
            key={child.studentId}
            onClick={() => selectChild(child.studentId)}
            title={child.name}
            className={`${basePill} ${
              active
                ? `${color.bg} ${color.border} ${color.text} font-medium`
                : 'border-stone-200 text-slate-500 hover:bg-stone-50'
            }`}
          >
            <span
              className={`w-6 h-6 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-[10px] font-semibold flex-shrink-0`}
            >
              {childInitial(child.name)}
            </span>
            {firstName}
          </button>
        )
      })}
    </div>
  )
}

export default ChildFilterPills
