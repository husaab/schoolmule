'use client'

// "3 present · 1 absent" as two small chips. Absent only turns red when
// there is something to see.

import React from 'react'

const PresentAbsentChips: React.FC<{ presentDays: number; absentDays: number }> = ({ presentDays, absentDays }) => (
  <>
    <span className="rounded-md bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">{presentDays} present</span>
    <span className={`rounded-md px-1.5 py-0.5 font-medium ${absentDays > 0 ? 'bg-rose-50 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
      {absentDays} absent
    </span>
  </>
)

export default PresentAbsentChips
