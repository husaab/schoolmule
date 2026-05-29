'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import { useNotificationStore } from '@/store/useNotificationStore'
import {
  evaluateStudentView,
  downloadStudentViewCsv,
  downloadStudentViewCertificates,
} from '@/services/studentViewService'
import type { EvaluatedStudent, StudentViewPayload } from '@/services/types/studentView'
import {
  TrophyIcon,
  ArrowDownTrayIcon,
  DocumentTextIcon,
  DocumentArrowDownIcon,
  PencilSquareIcon,
  ShieldCheckIcon,
  LockClosedIcon,
  UsersIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { useUserStore } from '@/store/useUserStore'

export default function StudentViewDetailPage() {
  const { viewId } = useParams<{ viewId: string }>()
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [view, setView] = useState<StudentViewPayload | null>(null)
  const [students, setStudents] = useState<EvaluatedStudent[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, setBusy] = useState(false)
  const [downloadingStudentId, setDownloadingStudentId] = useState<string | null>(null)

  useEffect(() => {
    if (!viewId) return
    setLoading(true)
    evaluateStudentView(viewId)
      .then((r) => {
        setView(r.data.view)
        setStudents(r.data.students)
        setSelected(new Set(r.data.students.map((s) => s.studentId)))
      })
      .catch(() => showNotification('Failed to evaluate view', 'error'))
      .finally(() => setLoading(false))
  }, [viewId, showNotification])

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }
  const selectAll = () => setSelected(new Set(students.map((s) => s.studentId)))
  const clearAll = () => setSelected(new Set())

  const handleCsv = async () => {
    if (!view) return
    setBusy(true)
    try {
      await downloadStudentViewCsv(view.viewId, view.name.replace(/\s+/g, '_'))
    } catch {
      showNotification('CSV download failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  const handleSingleCertificate = async (s: EvaluatedStudent) => {
    if (!view) return
    setDownloadingStudentId(s.studentId)
    try {
      const safeStudent = s.studentName.replace(/\s+/g, '_')
      const safeView = view.name.replace(/\s+/g, '_')
      await downloadStudentViewCertificates(
        view.viewId,
        [s.studentId],
        `${safeView}_${safeStudent}`,
      )
    } catch {
      showNotification('Certificate download failed', 'error')
    } finally {
      setDownloadingStudentId(null)
    }
  }

  const handleCertificates = async () => {
    if (!view) return
    const ids = Array.from(selected)
    if (ids.length === 0) {
      showNotification('Select at least one student', 'error')
      return
    }
    setBusy(true)
    try {
      await downloadStudentViewCertificates(view.viewId, ids, view.name.replace(/\s+/g, '_'))
    } catch {
      showNotification('Certificate generation failed', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <main className="px-6 pt-28 pb-8 max-w-6xl mx-auto">
            <div className="flex flex-col items-center justify-center py-32">
              <Spinner size="lg" />
              <p className="text-sm text-slate-500 mt-6">Evaluating view…</p>
              <p className="text-xs text-slate-400 mt-1">This can take a few seconds for large schools.</p>
            </div>
          </main>
        </div>
      </div>
    )
  }

  if (!view) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <main className="px-6 pt-28 pb-8 max-w-6xl mx-auto text-sm text-slate-500">View not found.</main>
        </div>
      </div>
    )
  }

  // Admins can edit system views; everyone else can only edit views they own.
  const canEdit =
    (!view.isSystem && view.ownerUserId === user?.id) ||
    (view.isSystem && user?.role === 'ADMIN')

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        <main className="px-6 pt-28 pb-8 max-w-6xl mx-auto">
          <Link
            href="/student-views"
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to Student Views
          </Link>
          <div className="flex items-start justify-between gap-4 mb-8">
            <div className="flex items-start gap-3 min-w-0">
              <div className="p-2 bg-cyan-50 rounded-xl shrink-0">
                <TrophyIcon className="w-7 h-7 text-cyan-600" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-slate-900 truncate">{view.name}</h1>
                  {view.isSystem && <Badge icon={ShieldCheckIcon} label="System" tone="amber" />}
                  {!view.isSystem && view.isShared && <Badge icon={UsersIcon} label="Shared" tone="cyan" />}
                  {!view.isSystem && !view.isShared && <Badge icon={LockClosedIcon} label="Private" tone="slate" />}
                </div>
                <p className="text-sm text-slate-500 mt-1">{view.description}</p>
                <div className="text-xs text-slate-400 mt-2">
                  ≥{view.criteria.thresholdPercent}% · {view.criteria.aggregationMode.replace('_', ' ')} ·{' '}
                  {view.criteria.termScope.replace('_', ' ')}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleCsv}
                disabled={busy}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export CSV
              </button>
              <button
                onClick={handleCertificates}
                disabled={busy || selected.size === 0}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50"
              >
                <DocumentTextIcon className="w-4 h-4" />
                Certificates ({selected.size})
              </button>
              {canEdit && (
                <Link
                  href={`/student-views/${view.viewId}/edit`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  <PencilSquareIcon className="w-4 h-4" />
                  Edit
                </Link>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 bg-slate-50">
              <div className="text-sm text-slate-600">
                <span className="font-semibold text-slate-900">{students.length}</span> students match
              </div>
              <div className="flex items-center gap-3 text-xs">
                <button onClick={selectAll} className="text-cyan-700 hover:underline">
                  Select all
                </button>
                <button onClick={clearAll} className="text-slate-500 hover:underline">
                  Clear
                </button>
              </div>
            </div>
            {students.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                No students currently match these criteria.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-100">
                  <tr className="text-left text-xs text-slate-500 uppercase tracking-wide">
                    <th className="px-5 py-2 w-10"></th>
                    <th className="px-5 py-2">Name</th>
                    <th className="px-5 py-2">Grade</th>
                    <th className="px-5 py-2 text-right">Metric</th>
                    <th className="px-5 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => {
                    const isDownloading = downloadingStudentId === s.studentId
                    return (
                      <tr key={s.studentId} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-2">
                          <input
                            type="checkbox"
                            checked={selected.has(s.studentId)}
                            onChange={() => toggleSelect(s.studentId)}
                            className="rounded text-cyan-600"
                          />
                        </td>
                        <td className="px-5 py-2 font-medium text-slate-900">{s.studentName}</td>
                        <td className="px-5 py-2 text-slate-600">{s.grade}</td>
                        <td className="px-5 py-2 text-right text-slate-700">
                          {s.displayMetric.toFixed(1)}%
                        </td>
                        <td className="px-5 py-2 text-right">
                          <button
                            onClick={() => handleSingleCertificate(s)}
                            disabled={isDownloading || busy}
                            title="Download this student's certificate"
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-500 cursor-pointer hover:bg-cyan-50 hover:text-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isDownloading ? (
                              <Spinner size="sm" />
                            ) : (
                              <DocumentArrowDownIcon className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function Badge({
  icon: Icon,
  label,
  tone,
}: {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  label: string
  tone: 'amber' | 'cyan' | 'slate'
}) {
  const styles = {
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    slate: 'bg-slate-50 text-slate-600 border-slate-200',
  } as const
  return (
    <span
      className={`inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${styles[tone]}`}
    >
      <Icon className="w-3 h-3" />
      {label}
    </span>
  )
}
