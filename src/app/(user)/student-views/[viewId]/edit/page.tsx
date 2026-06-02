'use client'

import React, { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import CriteriaBuilder from '@/components/studentViews/CriteriaBuilder'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getTermsBySchool } from '@/services/termService'
import { getAllClasses } from '@/services/classService'
import {
  getStudentView,
  updateStudentView,
  previewStudentView,
} from '@/services/studentViewService'
import type {
  StudentViewCriteria,
  EvaluatedStudent,
  StudentViewPayload,
} from '@/services/types/studentView'
import type { TermPayload } from '@/services/types/term'
import Link from 'next/link'
import { TrophyIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'

export default function EditStudentViewPage() {
  const { viewId } = useParams<{ viewId: string }>()
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [view, setView] = useState<StudentViewPayload | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isShared, setIsShared] = useState(false)
  // Mirrors the row's current system flag in the form; admins can flip it.
  // Stays null until the source view loads so we can distinguish "unchanged"
  // from "explicitly toggled" on save.
  const [systemFlag, setSystemFlag] = useState<boolean | null>(null)
  const [criteria, setCriteria] = useState<StudentViewCriteria | null>(null)
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [previewStudents, setPreviewStudents] = useState<EvaluatedStudent[] | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!viewId) return
    getStudentView(viewId)
      .then((r) => {
        const v = r.data
        setView(v)
        setName(v.name)
        setDescription(v.description)
        setIsShared(v.isShared)
        setSystemFlag(v.isSystem)
        setCriteria(v.criteria)
      })
      .catch(() => showNotification('Failed to load view', 'error'))
  }, [viewId, showNotification])

  useEffect(() => {
    if (!user?.school) return
    getTermsBySchool(user.school).then((r) => setTerms(r.data || [])).catch(() => {})
    getAllClasses(user.school)
      .then((r) => {
        const unique = Array.from(new Set((r.data || []).map((c: { subject: string }) => c.subject))).sort()
        setSubjects(unique)
      })
      .catch(() => {})
  }, [user?.school])

  useEffect(() => {
    if (!criteria) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setPreviewLoading(true)
      try {
        const res = await previewStudentView(criteria)
        setPreviewStudents(res.data.students.filter((s) => s.qualified))
      } catch {
        setPreviewStudents(null)
      } finally {
        setPreviewLoading(false)
      }
    }, 500)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [criteria])

  if (!view || !criteria) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <main className="px-6 pt-28 pb-8 max-w-6xl mx-auto text-sm text-slate-500">Loading…</main>
        </div>
      </div>
    )
  }

  // System views are editable only by admins. Non-admins see a friendly notice.
  if (view.isSystem && user?.role !== 'ADMIN') {
    return (
      <div className="min-h-screen bg-slate-50">
        <Sidebar />
        <div className="lg:pl-72">
          <Navbar />
          <main className="px-6 pt-28 pb-8 max-w-6xl mx-auto text-sm text-slate-500">
            System views can only be edited by administrators.
          </main>
        </div>
      </div>
    )
  }

  const isAdmin = user?.role === 'ADMIN'
  // Only include isSystem in the PATCH body when an admin actually flipped it.
  // If unchanged, leave it out so the backend takes the no-op COALESCE path.
  const systemFlagChanged =
    isAdmin && systemFlag !== null && systemFlag !== view.isSystem

  const handleSave = async () => {
    if (!name.trim()) {
      showNotification('View name is required', 'error')
      return
    }
    try {
      await updateStudentView(viewId, {
        name,
        description,
        isShared,
        criteria,
        ...(systemFlagChanged ? { isSystem: systemFlag as boolean } : {}),
      })
      showNotification('View saved', 'success')
      router.push(`/student-views/${viewId}`)
    } catch {
      showNotification('Save failed', 'error')
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <div className="lg:pl-72">
        <Navbar />
        <main className="px-6 pt-28 pb-8 max-w-6xl mx-auto">
          <Link
            href={`/student-views/${viewId}`}
            className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-4"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            Back to view
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-50 rounded-xl">
              <TrophyIcon className="w-7 h-7 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Edit View</h1>
              <p className="text-sm text-slate-500">Update criteria and save</p>
            </div>
          </div>

          {view.isSystem && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              You&apos;re editing a <strong>system view</strong>. Your changes apply school-wide for everyone.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
              {isAdmin && systemFlag !== null && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <label className="flex items-start gap-2 text-sm text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemFlag}
                      onChange={(e) => setSystemFlag(e.target.checked)}
                      className="mt-0.5 rounded text-amber-600"
                    />
                    <span>
                      {view.isSystem ? (
                        <>
                          <strong>System view (school-wide)</strong>
                          <span className="block text-xs text-amber-700 mt-0.5">
                            Uncheck to convert this back to a personal view. You will become the
                            owner; other teachers will lose access unless you keep sharing on.
                          </span>
                        </>
                      ) : (
                        <>
                          <strong>Promote to system view</strong>
                          <span className="block text-xs text-amber-700 mt-0.5">
                            Make this permanent and school-wide. Sharing will be forced on and the
                            view will no longer have an individual owner.
                          </span>
                        </>
                      )}
                    </span>
                  </label>
                </div>
              )}

              <CriteriaBuilder
                name={name}
                description={description}
                isShared={isShared}
                criteria={criteria}
                terms={terms}
                subjects={subjects}
                onNameChange={setName}
                onDescriptionChange={setDescription}
                onIsSharedChange={setIsShared}
                onCriteriaChange={setCriteria}
              />
              <div className="flex justify-end gap-2 mt-8 pt-6 border-t border-slate-100">
                <button
                  onClick={() => router.push(`/student-views/${viewId}`)}
                  className="px-4 py-2 text-sm rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm rounded-lg bg-cyan-600 text-white hover:bg-cyan-700"
                >
                  Save changes
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24 h-fit">
              <h3 className="font-semibold text-slate-900 mb-2">Live preview</h3>
              <p className="text-xs text-slate-500 mb-4">Current matches under the criteria above.</p>
              {previewLoading && <div className="text-sm text-slate-500">Computing…</div>}
              {!previewLoading && previewStudents && (
                <>
                  <div className="text-2xl font-bold text-cyan-700 mb-3">{previewStudents.length}</div>
                  <div className="max-h-[32rem] overflow-y-auto space-y-1 pr-1">
                    {previewStudents.map((s) => (
                      <div key={s.studentId} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                        <span className="text-slate-700">{s.studentName}</span>
                        <span className="text-slate-500">{s.displayMetric.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
              {!previewLoading && !previewStudents && (
                <div className="text-sm text-slate-400">Preview unavailable</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
