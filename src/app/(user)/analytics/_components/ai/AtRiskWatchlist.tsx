'use client'

// Early-warning watchlist. Risk scores are computed deterministically and
// instantly client-side (computeAtRiskScore); the AI is only used for the
// on-demand per-student explanation + interventions.

import React, { useMemo, useState } from 'react'
import {
  ShieldExclamationIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline'
import { SnapshotData, SnapshotStudent, AtRiskResult } from '@/services/types/analytics'
import { computeAtRiskScore } from '@/lib/analyticsUtils'
import { UseAnalyticsParams } from '../../_hooks/useAnalyticsParams'

interface AtRiskWatchlistProps {
  snapshot: SnapshotData | null
  loading: boolean
  params: UseAnalyticsParams
}

type ScoredStudent = SnapshotStudent & { risk: AtRiskResult }

const tierStyles: Record<AtRiskResult['tier'], { badge: string; label: string }> = {
  high: { badge: 'bg-rose-100 text-rose-700 border-rose-200', label: 'High' },
  moderate: { badge: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Moderate' },
  low: { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Low' },
}

const StudentCard: React.FC<{ student: ScoredStudent; params: UseAnalyticsParams }> = ({
  student,
  params,
}) => {
  const [explanation, setExplanation] = useState<string | null>(null)
  const [loadingExplain, setLoadingExplain] = useState(false)
  const [explainError, setExplainError] = useState(false)

  const explain = async (e: React.MouseEvent) => {
    e.stopPropagation()
    setLoadingExplain(true)
    setExplainError(false)
    try {
      const res = await fetch('/api/ai/analytics/at-risk-explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: student.studentName,
          gradePercent: student.overallAvg,
          attendancePercent: student.attendancePct,
          missingWorkCount: student.missingCount,
          trajectoryDelta: 0,
          riskScore: student.risk.score,
          riskFlags: student.risk.flags,
          classContext: student.lowestSubject
            ? `Grade ${student.gradeLevel}; weakest subject ${student.lowestSubject} at ${student.lowestPct}%`
            : `Grade ${student.gradeLevel}`,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setExplanation(data.explanation)
    } catch {
      setExplainError(true)
    } finally {
      setLoadingExplain(false)
    }
  }

  const t = tierStyles[student.risk.tier]

  return (
    <div
      onClick={() => params.drillTo('student', { studentId: student.studentId })}
      className="p-3 rounded-xl border border-slate-100 hover:border-cyan-200 hover:bg-cyan-50/30 cursor-pointer transition-colors"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-900 truncate">{student.studentName}</p>
          <p className="text-xs text-slate-500">
            Grade {student.gradeLevel} · avg {student.overallAvg ?? '—'}% · att{' '}
            {student.attendancePct ?? '—'}% · {student.missingCount} missing
          </p>
        </div>
        <div className="text-right flex-shrink-0">
          <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase border rounded-full ${t.badge}`}>
            {t.label} {student.risk.score}
          </span>
        </div>
      </div>

      {student.risk.flags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {student.risk.flags.map((f) => (
            <span key={f} className="px-1.5 py-0.5 text-[10px] bg-slate-50 border border-slate-100 text-slate-500 rounded-md">
              {f}
            </span>
          ))}
        </div>
      )}

      <div className="mt-2">
        {explanation ? (
          <p className="text-xs text-slate-600 italic leading-relaxed bg-slate-50 rounded-lg p-2.5">{explanation}</p>
        ) : explainError ? (
          <button onClick={explain} className="text-xs text-rose-500 hover:text-rose-700">
            Explanation unavailable — retry
          </button>
        ) : (
          <button
            onClick={explain}
            disabled={loadingExplain}
            className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-800 disabled:opacity-50 transition-colors"
          >
            <SparklesIcon className={`w-3.5 h-3.5 ${loadingExplain ? 'animate-pulse' : ''}`} />
            {loadingExplain ? 'Thinking…' : 'Explain & suggest interventions'}
          </button>
        )}
      </div>
    </div>
  )
}

const AtRiskWatchlist: React.FC<AtRiskWatchlistProps> = ({ snapshot, loading, params }) => {
  const [showModerate, setShowModerate] = useState(true)

  const scored = useMemo<ScoredStudent[]>(() => {
    if (!snapshot) return []
    return snapshot.students
      .map((s) => ({
        ...s,
        risk: computeAtRiskScore({
          gradePercent: s.overallAvg,
          attendancePercent: s.attendancePct,
          missingWorkCount: s.missingCount,
          trajectoryDelta: 0,
        }),
      }))
      .filter((s) => s.risk.tier !== 'low')
      .sort((a, b) => b.risk.score - a.risk.score)
  }, [snapshot])

  const high = scored.filter((s) => s.risk.tier === 'high')
  const moderate = scored.filter((s) => s.risk.tier === 'moderate')

  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <h3 className="text-sm font-semibold text-slate-900 inline-flex items-center gap-2 mb-1">
        <ShieldExclamationIcon className="w-4 h-4 text-rose-500" />
        Early-Warning Watchlist
      </h3>
      <p className="text-xs text-slate-500 mb-4">
        Deterministic score from grades, attendance &amp; missing work
      </p>

      {loading ? (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-16 bg-slate-50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : scored.length === 0 ? (
        <p className="text-sm text-slate-400 py-4 text-center">
          No students currently need attention 🎉
        </p>
      ) : (
        <div className="space-y-2">
          {high.map((s) => (
            <StudentCard key={s.studentId} student={s} params={params} />
          ))}

          {moderate.length > 0 && (
            <>
              <button
                onClick={() => setShowModerate((v) => !v)}
                className="w-full flex items-center justify-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-700 py-1.5"
              >
                {showModerate ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
                {moderate.length} moderate-risk student{moderate.length === 1 ? '' : 's'}
              </button>
              {showModerate && moderate.map((s) => <StudentCard key={s.studentId} student={s} params={params} />)}
            </>
          )}
        </div>
      )}
    </div>
  )
}

export default AtRiskWatchlist
