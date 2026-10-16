'use client'

import React from 'react'
import { ChildLite } from '@/store/useSelectedChildStore'
import ChildAvatar from './ChildAvatar'

/** Avatar + name header shown above each child's section in "All children" mode. */
const ChildSectionHeader: React.FC<{ child: ChildLite }> = ({ child }) => {
  return (
    <div className="flex items-center gap-3 mb-4">
      <ChildAvatar studentId={child.studentId} name={child.name} avatar={child.avatar} size={40} />
      <div>
        <h2 className="text-lg font-semibold text-slate-900 leading-tight">{child.name}</h2>
        {child.grade != null && <p className="text-sm text-slate-500">Grade {child.grade}</p>}
      </div>
    </div>
  )
}

export default ChildSectionHeader
