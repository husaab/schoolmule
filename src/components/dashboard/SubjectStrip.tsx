'use client'

// Every subject on one 0–100 track, weakest first, so the principal's eye
// lands on French at 64% before it reaches Islamic Studies at 86%. Colour is
// status, not identity: below 65 reads as trouble, below 75 as watch, and
// everything else stays the brand cyan.

import React from 'react'
import Link from 'next/link'
import type { SubjectStats } from '@/services/types/analytics'
import { analyticsHref } from './dashboardPaths'

interface SubjectStripProps {
  subjects: SubjectStats[]
  termId: string | null
}

const barColour = (avg: number) => (avg < 65 ? '#f43f5e' : avg < 75 ? '#f59e0b' : '#0891b2')

const SubjectStrip: React.FC<SubjectStripProps> = ({ subjects, termId }) => {
  const rows = [...subjects].sort((a, b) => {
    if (!a.stats && !b.stats) return a.subject.localeCompare(b.subject)
    if (!a.stats) return 1
    if (!b.stats) return -1
    return a.stats.avg - b.stats.avg
  })

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
      {rows.map((s) => {
        const avg = s.stats?.avg ?? null
        return (
          <Link
            key={s.subject}
            href={analyticsHref({ view: 'subject', subject: s.subject, termId })}
            className="group flex items-center gap-3 rounded-lg px-1 py-1.5 hover:bg-cyan-50/40 transition-colors"
            title={`${s.subject} · ${s.classCount} class${s.classCount === 1 ? '' : 'es'}`}
          >
            <span className="w-32 sm:w-40 shrink-0 text-sm text-slate-700 truncate group-hover:text-slate-900">
              {s.subject}
            </span>
            <span className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
              {avg != null && (
                <span
                  className="block h-full rounded-full"
                  style={{ width: `${Math.max(2, Math.min(100, avg))}%`, background: barColour(avg) }}
                />
              )}
            </span>
            <span className="w-12 shrink-0 text-right text-sm tabular-nums font-medium text-slate-800">
              {avg != null ? `${Math.round(avg)}%` : <span className="text-xs font-normal text-slate-400">no grades</span>}
            </span>
          </Link>
        )
      })}
    </div>
  )
}

export default SubjectStrip
