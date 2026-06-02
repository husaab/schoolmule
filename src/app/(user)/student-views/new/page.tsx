'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import CriteriaBuilder from '@/components/studentViews/CriteriaBuilder'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getTermsBySchool } from '@/services/termService'
import { getAllClasses } from '@/services/classService'
import {
  createStudentView,
  previewStudentView,
  getStudentView,
} from '@/services/studentViewService'
import type { StudentViewCriteria, EvaluatedStudent } from '@/services/types/studentView'
import type { TermPayload } from '@/services/types/term'
import Link from 'next/link'
import { TrophyIcon, ArrowLeftIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline'

const DEFAULT_CRITERIA: StudentViewCriteria = {
  termScope: 'active',
  termIds: [],
  thresholdPercent: 85,
  aggregationMode: 'overall_avg',
  gradeLevels: [],
  subjects: [],
  attendanceMinPercent: null,
}

export default function NewStudentViewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const duplicateFromId = searchParams.get('duplicateFrom')

  const user = useUserStore((s) => s.user)
  const showNotification = useNotificationStore((s) => s.showNotification)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isShared, setIsShared] = useState(false)
  const [isSystem, setIsSystem] = useState(false)
  const [criteria, setCriteria] = useState<StudentViewCriteria>(DEFAULT_CRITERIA)
  const isAdmin = user?.role === 'ADMIN'
  const [terms, setTerms] = useState<TermPayload[]>([])
  const [subjects, setSubjects] = useState<string[]>([])
  const [sourceName, setSourceName] = useState<string | null>(null)

  const [previewStudents, setPreviewStudents] = useState<EvaluatedStudent[] | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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

  // Pre-fill state from a source view when ?duplicateFrom=<viewId> is present.
  // Visibility inherits from the source; isSystem only sticks for admins.
  useEffect(() => {
    if (!duplicateFromId) return
    getStudentView(duplicateFromId)
      .then((r) => {
        const src = r.data
        setSourceName(src.name)
        setName(`${src.name} (Copy)`)
        setDescription(src.description)
        setCriteria(src.criteria)
        setIsShared(src.isShared)
        setIsSystem(isAdmin ? src.isSystem : false)
      })
      .catch(() => showNotification('Could not load source view', 'error'))
  }, [duplicateFromId, isAdmin, showNotification])

  // Live preview: debounce 500ms
  useEffect(() => {
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

  const canSave = name.trim().length > 0

  const handleSave = async () => {
    if (!canSave) {
      showNotification('Please give the view a name', 'error')
      return
    }
    try {
      const res = await createStudentView({
        name,
        description,
        isShared: isSystem ? true : isShared, // system views are always shared
        isSystem: isAdmin ? isSystem : undefined,
        criteria,
      })
      showNotification('View created', 'success')
      router.push(`/student-views/${res.data.viewId}`)
    } catch (e) {
      showNotification('Failed to create view', 'error')
    }
  }

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
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-50 rounded-xl">
              <TrophyIcon className="w-7 h-7 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {sourceName ? 'Duplicate Student View' : 'New Student View'}
              </h1>
              <p className="text-sm text-slate-500">
                {sourceName
                  ? 'Tweak anything below and save as a new view.'
                  : 'Define filter criteria and save for reuse'}
              </p>
            </div>
          </div>

          {sourceName && (
            <div className="mb-6 rounded-xl border border-cyan-200 bg-cyan-50/60 px-4 py-3 flex items-start gap-2.5">
              <DocumentDuplicateIcon className="w-5 h-5 text-cyan-600 mt-0.5 shrink-0" />
              <div className="text-sm text-cyan-900">
                Duplicating from <strong>&ldquo;{sourceName}&rdquo;</strong>. The original is unchanged
                — your edits below create a new view.
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
              {isAdmin && (
                <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <label className="flex items-start gap-2 text-sm text-amber-900 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSystem}
                      onChange={(e) => setIsSystem(e.target.checked)}
                      className="mt-0.5 rounded text-amber-600"
                    />
                    <span>
                      <strong>Make this a system view</strong>
                      <span className="block text-xs text-amber-700 mt-0.5">
                        Permanent, school-wide, visible to everyone. Cannot be deleted (only edited).
                      </span>
                    </span>
                  </label>
                </div>
              )}

              <CriteriaBuilder
                name={name}
                description={description}
                isShared={isSystem ? true : isShared}
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
                  onClick={() => router.push('/student-views')}
                  className="px-4 py-2 text-sm rounded-lg text-slate-700 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  className="px-4 py-2 text-sm rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save view
                </button>
              </div>
            </div>

            <PreviewPanel students={previewStudents} loading={previewLoading} />
          </div>
        </main>
      </div>
    </div>
  )
}

function PreviewPanel({
  students,
  loading,
}: {
  students: EvaluatedStudent[] | null
  loading: boolean
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 sticky top-24 h-fit">
      <h3 className="font-semibold text-slate-900 mb-2">Live preview</h3>
      <p className="text-xs text-slate-500 mb-4">
        Students who currently qualify under the criteria above.
      </p>
      {loading && <div className="text-sm text-slate-500">Computing…</div>}
      {!loading && students && (
        <>
          <div className="text-2xl font-bold text-cyan-700 mb-3">{students.length}</div>
          <div className="max-h-[32rem] overflow-y-auto space-y-1 pr-1">
            {students.map((s) => (
              <div key={s.studentId} className="flex justify-between text-sm py-1 border-b border-slate-100 last:border-0">
                <span className="text-slate-700">{s.studentName}</span>
                <span className="text-slate-500">{s.displayMetric.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </>
      )}
      {!loading && !students && (
        <div className="text-sm text-slate-400">Preview unavailable</div>
      )}
    </div>
  )
}
