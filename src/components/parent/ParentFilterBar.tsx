'use client'

import React from 'react'
import ChildFilterPills from './ChildFilterPills'

/**
 * Sticky toolbar for parent data pages: student pills on the left, page
 * filters (class, term, ...) on the right. Sticks just below the navbar so
 * filters stay reachable while scrolling long multi-child pages.
 */
const ParentFilterBar: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <div className="sticky top-[5.25rem] z-20 -mx-1 px-1 mb-6">
    <div className="bg-white/90 backdrop-blur rounded-2xl border border-stone-200/70 shadow-sm px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="min-w-0 flex-1">
        <ChildFilterPills />
      </div>
      {children && <div className="flex items-center gap-2 flex-wrap">{children}</div>}
    </div>
  </div>
)

export default ParentFilterBar
