'use client'

import React from 'react'
import { ChildLite } from '@/store/useSelectedChildStore'
import { childColor, childInitial } from './childColors'

/** Avatar + name header shown above each child's section in "All children" mode. */
const ChildSectionHeader: React.FC<{ child: ChildLite }> = ({ child }) => {
  const color = childColor(child.studentId)
  return (
    <div className="flex items-center gap-3 mb-4">
      <span
        className={`w-10 h-10 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white font-semibold`}
      >
        {childInitial(child.name)}
      </span>
      <div>
        <h2 className="text-lg font-semibold text-slate-900 leading-tight">{child.name}</h2>
        {child.grade != null && <p className="text-sm text-slate-500">Grade {child.grade}</p>}
      </div>
    </div>
  )
}

export default ChildSectionHeader
