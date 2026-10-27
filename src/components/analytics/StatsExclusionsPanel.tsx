'use client'

// Analytics → school overview: every student a teacher left out of a class's
// statistics this term, with who did it and their note. Someone who can open
// every class's gradebook (classes.all) can count a student again from here.
// Shown only when the list isn't empty.

import React, { useCallback, useEffect, useState } from 'react'
import { getSchoolStatsExclusions, removeStatsExclusion } from '@/services/classStatsExclusionService'
import type { SchoolStatsExclusion } from '@/services/types/classStatsExclusion'
import { useAccess } from '@/hooks/useAccess'
import { useNotificationStore } from '@/store/useNotificationStore'

interface StatsExclusionsPanelProps {
  /** The analytics term, or 'all'. */
  termId: string
}

const scopeText = (e: SchoolStatsExclusion) =>
  e.scope === 'class' ? 'Whole class' : e.assessmentNames.join(', ') || `${e.assessmentIds.length} assessments`

export default function StatsExclusionsPanel({ termId }: StatsExclusionsPanelProps) {
  const { can } = useAccess()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [rows, setRows] = useState<SchoolStatsExclusion[]>([])
  const [busyKey, setBusyKey] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const res = await getSchoolStatsExclusions(termId)
      setRows(res.data ?? [])
    } catch (err) {
      // Informational: the rest of the page works without it.
      console.error('Error loading class statistics exclusions:', err)
    }
  }, [termId])

  useEffect(() => {
    void load()
  }, [load])

  if (rows.length === 0) return null
  const canCountAgain = can('classes.all')

  const countAgain = async (e: SchoolStatsExclusion) => {
    const key = `${e.classId}|${e.studentId}`
    setBusyKey(key)
    try {
      await removeStatsExclusion(e.classId, e.studentId)
      setRows((prev) => prev.filter((r) => `${r.classId}|${r.studentId}` !== key))
      showNotification(`${e.studentName} counts in Grade ${e.grade} ${e.subject}'s average again`, 'success')
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "That didn't save. Try again.", 'error')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
      <h2 className="mb-1 text-lg font-semibold text-slate-900">Left out of class averages</h2>
      <p className="mb-4 text-sm text-slate-500">
        Teachers left these students out of a class&apos;s statistics. Their own grades are unchanged, and the school figures above still
        count them.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs font-medium text-slate-500">
              <th className="py-2 pr-3">Class</th>
              <th className="py-2 pr-3">Student</th>
              <th className="py-2 pr-3">Left out of</th>
              <th className="py-2 pr-3">Note</th>
              <th className="py-2 pr-3">Set by</th>
              {canCountAgain && <th className="py-2" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const key = `${e.classId}|${e.studentId}`
              return (
                <tr key={key} className="border-b border-slate-100 align-top last:border-0">
                  <td className="py-2.5 pr-3 text-slate-900">
                    Grade {e.grade} {e.subject}
                    {e.teacherName && <span className="block text-xs text-slate-500">{e.teacherName}</span>}
                  </td>
                  <td className="py-2.5 pr-3 font-medium text-slate-900">{e.studentName}</td>
                  <td className="py-2.5 pr-3 text-slate-700">{scopeText(e)}</td>
                  <td className="py-2.5 pr-3 text-slate-700">{e.note ?? <span className="text-slate-400">No note</span>}</td>
                  <td className="py-2.5 pr-3 text-slate-500">
                    {e.createdByName ?? '—'} · {new Date(e.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                  </td>
                  {canCountAgain && (
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        disabled={busyKey === key}
                        onClick={() => void countAgain(e)}
                        className="cursor-pointer whitespace-nowrap text-sm font-medium text-cyan-700 hover:text-cyan-800 disabled:cursor-wait disabled:opacity-60"
                      >
                        Count again
                      </button>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
