'use client'

// Auto-generated narrative for the current analytics view. Re-fires when
// the snapshot changes (contextVersion), with a manual regenerate button.

import React, { useCallback, useEffect, useRef, useState } from 'react'
import { SparklesIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'

const AiInsightsPanel: React.FC = () => {
  const serializedContext = useAnalyticsStore((s) => s.serializedContext)
  const contextVersion = useAnalyticsStore((s) => s.contextVersion)
  const viewLevel = useAnalyticsStore((s) => s.snapshot?.viewLevel)

  const [insight, setInsight] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const lastFiredVersion = useRef(0)

  const generate = useCallback(async () => {
    if (!serializedContext) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/analytics/insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: serializedContext, viewLevel }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate insights')
      setInsight(data.insight)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
    } finally {
      setLoading(false)
    }
  }, [serializedContext, viewLevel])

  // Auto-fire once per snapshot change (debounced so rapid filter
  // changes don't burn tokens).
  useEffect(() => {
    if (!serializedContext || contextVersion === lastFiredVersion.current) return
    const timer = setTimeout(() => {
      lastFiredVersion.current = contextVersion
      generate()
    }, 800)
    return () => clearTimeout(timer)
  }, [contextVersion, serializedContext, generate])

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-teal-50 border border-cyan-100 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-slate-900 inline-flex items-center gap-2">
          <SparklesIcon className="w-4 h-4 text-cyan-500" />
          AI Insights
        </h3>
        <button
          onClick={generate}
          disabled={loading || !serializedContext}
          aria-label="Regenerate insights"
          className="inline-flex items-center gap-1 text-xs font-medium text-cyan-600 hover:text-cyan-800 disabled:opacity-40 transition-colors"
        >
          <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Regenerate
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          <div className="h-3 bg-cyan-100/80 rounded animate-pulse" />
          <div className="h-3 bg-cyan-100/80 rounded animate-pulse w-11/12" />
          <div className="h-3 bg-cyan-100/80 rounded animate-pulse w-4/5" />
          <div className="h-3 bg-cyan-100/80 rounded animate-pulse w-2/3" />
        </div>
      ) : error ? (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
          {error}
        </div>
      ) : insight ? (
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{insight}</p>
      ) : (
        <p className="text-sm text-slate-400">Insights will appear once data is loaded.</p>
      )}

      <p className="text-[10px] text-slate-400 mt-3">Powered by GPT-4o mini · verify before acting</p>
    </div>
  )
}

export default AiInsightsPanel
