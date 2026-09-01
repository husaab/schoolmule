'use client'

import React from 'react'

interface SectionHeaderProps {
  title: string
  hint?: string
  /** Right-aligned control: a filter, a link, a menu. */
  action?: React.ReactNode
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, hint, action }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
    <div>
      <h2 className="font-display text-base font-semibold text-slate-900">{title}</h2>
      {hint && <p className="text-xs text-slate-500 mt-0.5">{hint}</p>}
    </div>
    {action}
  </div>
)

export default SectionHeader
