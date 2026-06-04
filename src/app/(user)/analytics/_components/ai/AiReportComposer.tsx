'use client'

// AI report composer: pick sections + audience → generate markdown →
// rendered document preview in an iframe (print = save as PDF), with an
// optional raw-markdown edit mode.

import React, { useMemo, useRef, useState } from 'react'
import {
  PrinterIcon,
  ClipboardIcon,
  ArrowLeftIcon,
  SparklesIcon,
  PencilSquareIcon,
  EyeIcon,
} from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { markdownToHtml } from '@/lib/analyticsUtils'
import { TermPayload } from '@/services/types/term'
import { UseAnalyticsParams } from '../../_hooks/useAnalyticsParams'
import StudentPicker, { PickerStudent } from '../StudentPicker'

interface AiReportComposerProps {
  isOpen: boolean
  onClose: () => void
  schoolName: string
  termName: string
  /** What the report covers, e.g. "Whole School", "Grade 3", "Math (Gr 7)", a student name. */
  scopeLabel: string
  params: UseAnalyticsParams
  terms: TermPayload[]
  grades: string[]
  subjects: string[]
  students: PickerStudent[]
  /** True while the page is re-loading data after a scope change. */
  dataLoading: boolean
}

const SECTIONS = ['Overview', 'Highlights', 'Areas of Concern', 'Recommendations']

/** Wrap the rendered markdown in a complete, print-ready HTML document. */
function buildReportDocument(markdown: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body {
    font-family: Georgia, 'Times New Roman', serif;
    color: #1e293b;
    line-height: 1.65;
    max-width: 720px;
    margin: 0 auto;
    padding: 2.5rem 2rem;
    font-size: 15px;
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    margin: 0 0 1.25rem;
    border-bottom: 2px solid #0891b2;
    padding-bottom: 0.6rem;
  }
  h2 {
    font-size: 1.15rem;
    font-weight: 700;
    margin: 1.5rem 0 0.5rem;
    color: #0e7490;
  }
  ul { margin: 0.5rem 0 0.9rem 1.25rem; padding: 0; }
  li { margin-bottom: 0.35rem; }
  p { margin: 0 0 0.7rem; }
  @media print {
    body { padding: 0; }
  }
</style>
</head>
<body>
${markdownToHtml(markdown)}
</body>
</html>`
}

const AiReportComposer: React.FC<AiReportComposerProps> = ({
  isOpen,
  onClose,
  schoolName,
  termName,
  scopeLabel,
  params,
  terms,
  grades,
  subjects,
  students,
  dataLoading,
}) => {
  const serializedContext = useAnalyticsStore((s) => s.serializedContext)
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [phase, setPhase] = useState<'configure' | 'preview'>('configure')
  const [editing, setEditing] = useState(false)
  const [sections, setSections] = useState<string[]>([...SECTIONS])
  const [audience, setAudience] = useState<'principal' | 'parent-night'>('principal')
  const [report, setReport] = useState('')
  const [loading, setLoading] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  const reportHtml = useMemo(() => buildReportDocument(report), [report])

  const toggleSection = (s: string) =>
    setSections((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]))

  const generate = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/ai/analytics/report-composer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: serializedContext,
          sections,
          audience,
          schoolName,
          termName,
          scope: scopeLabel,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate report')
      setReport(data.report)
      setEditing(false)
      setPhase('preview')
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Failed to generate report', 'error')
    } finally {
      setLoading(false)
    }
  }

  // Print just the iframe's document — the browser's print dialog offers
  // "Save as PDF", so this is the PDF export.
  const print = () => {
    const win = iframeRef.current?.contentWindow
    if (!win) return
    win.focus()
    win.print()
  }

  const copy = async () => {
    await navigator.clipboard.writeText(report)
    showNotification('Report copied to clipboard', 'success')
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="AI Performance Report" style="w-full max-w-3xl">
      {phase === 'configure' ? (
        <div className="space-y-6 p-6">
          {/* Report scope — these drive the page filters behind the modal,
              so the generated report always matches the loaded data. */}
          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Report scope</p>
            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Report term"
                value={params.termId ?? ''}
                onChange={(e) =>
                  params.setParams({
                    termId: e.target.value,
                    ...(e.target.value === 'all' ? { compareTerm: null } : {}),
                  })
                }
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer"
              >
                {terms.map((t) => (
                  <option key={t.termId} value={t.termId}>
                    {t.name} {t.academicYear}
                  </option>
                ))}
                {terms.length > 1 && <option value="all">All terms (combined)</option>}
              </select>

              <select
                aria-label="Report grade"
                value={params.view === 'student' || params.view === 'class' ? '' : (params.grade ?? '')}
                disabled={params.view === 'student' || params.view === 'class'}
                onChange={(e) => {
                  const grade = e.target.value || null
                  if (params.subject) params.drillTo('subject', { grade })
                  else if (grade) params.drillTo('grade', { grade })
                  else params.drillTo('school')
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer disabled:opacity-50"
              >
                <option value="">Whole school</option>
                {grades.map((g) => (
                  <option key={g} value={g}>
                    Grade {g}
                  </option>
                ))}
              </select>

              <select
                aria-label="Report subject"
                value={params.view === 'student' || params.view === 'class' ? '' : (params.subject ?? '')}
                disabled={params.view === 'student' || params.view === 'class'}
                onChange={(e) => {
                  const subject = e.target.value || null
                  if (subject) params.drillTo('subject', { subject })
                  else if (params.grade) params.drillTo('grade', { grade: params.grade, subject: null })
                  else params.drillTo('school')
                }}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer disabled:opacity-50"
              >
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <StudentPicker
                students={students}
                onSelect={(s) => params.drillTo('student', { studentId: s.studentId, grade: s.grade })}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">
              This report will cover:{' '}
              <span className="font-semibold text-cyan-700">
                {schoolName} — {scopeLabel} — {termName}
              </span>
              {(params.view === 'student' || params.view === 'class') && (
                <>
                  {' '}
                  <button
                    onClick={() => params.drillTo('school')}
                    className="text-cyan-600 hover:text-cyan-800 underline"
                  >
                    reset to whole school
                  </button>
                </>
              )}
            </p>
          </div>

          <div>
            <p className="text-sm font-medium text-slate-700 mb-2">Audience</p>
            <div className="grid grid-cols-2 gap-3">
              {(
                [
                  { key: 'principal', label: 'Principal / Admin', desc: 'May reference individual students' },
                  { key: 'parent-night', label: 'Parent Night', desc: 'Aggregate statements only' },
                ] as const
              ).map((a) => (
                <button
                  key={a.key}
                  onClick={() => setAudience(a.key)}
                  className={`p-4 rounded-xl border text-left transition-colors ${
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
            <div className="space-y-2">
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

          <button
            onClick={generate}
            disabled={loading || dataLoading || sections.length === 0 || !serializedContext}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl shadow-sm hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 transition-all"
          >
            <SparklesIcon className={`w-4 h-4 ${loading || dataLoading ? 'animate-pulse' : ''}`} />
            {loading ? 'Writing report…' : dataLoading ? 'Loading scope data…' : 'Generate Report'}
          </button>
        </div>
      ) : (
        <div className="space-y-4 p-6">
          {editing ? (
            <textarea
              value={report}
              onChange={(e) => setReport(e.target.value)}
              rows={18}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          ) : (
            <iframe
              ref={iframeRef}
              srcDoc={reportHtml}
              title="Report preview"
              className="w-full h-[55vh] bg-white border border-slate-200 rounded-xl"
            />
          )}

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPhase('configure')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Back
            </button>
            <button
              onClick={() => setEditing((e) => !e)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              {editing ? (
                <>
                  <EyeIcon className="w-4 h-4" /> Preview
                </>
              ) : (
                <>
                  <PencilSquareIcon className="w-4 h-4" /> Edit
                </>
              )}
            </button>
            <div className="flex-1" />
            <button
              onClick={copy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-slate-600 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <ClipboardIcon className="w-4 h-4" /> Copy
            </button>
            <button
              onClick={print}
              disabled={editing}
              title={editing ? 'Switch to Preview before printing' : undefined}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl shadow-sm hover:from-cyan-600 hover:to-teal-600 disabled:opacity-50 transition-all"
            >
              <PrinterIcon className="w-4 h-4" /> Save as PDF
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default AiReportComposer
