'use client'

import React, { useEffect, useState } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import { getChildWeeklySummary } from '@/services/parentPortalService'
import { ChildWeeklySummary } from '@/services/types/parentPortal'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'

interface AiWeeklySummaryCardProps {
  studentId: string
  childFirstName: string
  termId?: string
}

/**
 * A short AI-written recap of one child's week.
 *
 * Fetched per child rather than in one batch: generation can take a couple
 * of seconds on a cache miss, and one slow or failed child shouldn't hold
 * up the others. The card is always safe to render — the endpoint returns
 * 200 with `unavailable: true` when generation fails or no key is set.
 *
 * The AI chip is deliberately visible in every state, not just when there
 * is text: a parent should never be unsure whether a person wrote this.
 */
const AiWeeklySummaryCard: React.FC<AiWeeklySummaryCardProps> = ({
  studentId,
  childFirstName,
  termId,
}) => {
  const [summary, setSummary] = useState<ChildWeeklySummary | null>(null)
  const [loading, setLoading] = useState(true)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    getChildWeeklySummary(studentId, termId)
      .then((res) => {
        if (!cancelled) setSummary(res.data ?? null)
      })
      .catch((err) => {
        console.error(err)
        if (!cancelled) setSummary(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [studentId, termId, selectedYearId])

  const unavailable = !loading && (!summary || summary.unavailable || !summary.content)

  return (
    <div className="h-full bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <SparklesIcon className="w-4 h-4 text-amber-600" />
        <h3 className="text-xs font-medium uppercase tracking-wider text-amber-700">
          This Week for {childFirstName}
        </h3>
        <span className="text-[10px] font-bold uppercase tracking-wide text-amber-700 bg-white/70 px-1.5 py-0.5 rounded-full">
          AI
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-3.5 bg-amber-100/80 rounded animate-pulse" />
          <div className="h-3.5 bg-amber-100/80 rounded animate-pulse w-11/12" />
          <div className="h-3.5 bg-amber-100/80 rounded animate-pulse w-3/4" />
        </div>
      ) : unavailable ? (
        <p className="text-sm text-slate-500">
          A weekly summary will appear here once there&rsquo;s enough activity to summarise.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-700 leading-relaxed">{summary?.content}</p>
          <p className="text-[10px] text-slate-500 mt-3">
            AI-generated summary of the past week · always confirm details with your child&rsquo;s
            teacher.
          </p>
        </>
      )}
    </div>
  )
}

export default AiWeeklySummaryCard
