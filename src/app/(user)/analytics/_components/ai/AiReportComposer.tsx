'use client'

// AI report composer: pick sections + audience → generate markdown →
// edit in a textarea → print (browser PDF) or copy.

import React, { useState } from 'react'
import {
  DocumentTextIcon,
  PrinterIcon,
  ClipboardIcon,
  ArrowLeftIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { markdownToHtml } from '@/lib/analyticsUtils'

interface AiReportComposerProps {
  isOpen: boolean
  onClose: () => void
  schoolName: string
  termName: string
}

const SECTIONS = ['Overview', 'Highlights', 'Areas of Concern', 'Recommendations']

const AiReportComposer: React.FC<AiReportComposerProps> = ({
  isOpen,
  onClose,
  schoolName,
  termName,
}) => {
  const serializedContext = useAnalyticsStore((s) => s.serializedContext)
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [phase, setPhase] = useState<'configure' | 'preview'>('configure')
  const [sections, setSections] = useState<string[]>([...SECTIONS])
  const [audience, setAudience] = useState<'principal' | 'parent-night'>('principal')
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)

  const toggleSection = (s: string) =>
    setSections((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/analytics/report-composer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context: serializedContext, sections, audience, schoolName, termName }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate report')
      setReport(data.report)
      setPhase('preview')
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to generate report', 'error')
    } finally {
      setLoading(false)
    }
  }

  const print = () => {
    const target = document.getElementById('analytics-print-target')
    if (!target) return
    target.innerHTML = markdownToHtml(report)
    window.print()
  }

  const copy = async () => {
    await navigator.clipboard.writeText(report)
    showNotification('Report copied to clipboard', 'success')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Performance Report" style="w-full max-w-3xl">
      {phase === 'configure' ? (
        <div className="space-y-5 p-1">
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Audience</p>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { key: 'principal', label: 'Principal / Admin', desc: 'May reference individual students' },
                  { key: 'parent-night', label: 'Parent Night', desc: 'Aggregate statements only' },
                ] as const
              ).map((a) => (
                <button
                  key={a.key}
                  onClick={() => setAudience(a.key)}
                  className={`p-3 rounded-xl border text-left transition-colors ${
                    audience === a.key
                      ? 'border-cyan-400 bg-cyan-50 ring-1 ring-cyan-200'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="text-sm font-semibold text-slate-900">{a.label}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{a.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Sections</p>
            <div className="space-y-1.5">
              {SECTIONS.map((s) => (
                <label key={s} className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sections.includes(s)}
                    onChange={() => toggleSection(s)}
                    className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <p className="text-xs text-slate-400">
            The report is written from the analytics view currently on screen.
          </p>

          <button
            onClick={generate}
            disabled={loading || sections.length === 0 || !serializedContext}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl shadow-sm hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 transition-all"
          >
            <SparklesIcon className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
            {loading ? 'Writing report…' : 'Generate Report'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 p-1">
          <textarea
            value={report}
            onChange={(e) => setReport(e.target.value)}
            rows={18}
            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPhase('configure')}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Back
            </button>
            <div className="flex-1" />
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ClipboardIcon className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={print}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl shadow-sm hover:from-cyan-600 hover:to-teal-600 transition-all"
            >
              <PrinterIcon className="w-4 h-4" /> Print / PDF
            </button>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <DocumentTextIcon className="w-3.5 h-3.5" />
            Edit the markdown above, then print to save as PDF.
          </p>
        </div>
      )}
    </Modal>
  )
}

export default AiReportComposer
