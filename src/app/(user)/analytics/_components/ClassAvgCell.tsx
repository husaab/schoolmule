import React from 'react'
import type { SubjectClassRow } from '@/services/types/analytics'

const fmtPct = (v: number | null | undefined) => (v == null ? '—' : `${v}%`)

/**
 * A class's counted average (students a teacher left out of the class's
 * statistics don't count); while anyone is left out, the figure with
 * everyone sits underneath.
 */
export default function ClassAvgCell({ row }: { row: Pick<SubjectClassRow, 'classAvg' | 'classAvgAll' | 'leftOutCount'> }) {
  if (!row.leftOutCount) return <>{fmtPct(row.classAvg)}</>
  return (
    <span className="inline-flex flex-col items-end leading-tight" title={`${row.leftOutCount} left out by the teacher`}>
      {fmtPct(row.classAvg)}
      <span className="text-[10px] font-normal text-slate-400">{fmtPct(row.classAvgAll)} with everyone</span>
    </span>
  )
}
