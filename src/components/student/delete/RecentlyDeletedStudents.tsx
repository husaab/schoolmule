// src/components/student/delete/RecentlyDeletedStudents.tsx
'use client'
// Students > Recently deleted: students deleted this school year. They're
// hidden everywhere else, but every record was kept; Restore puts each one
// back where they were (the list, or Archived). Nothing here erases anyone.
import { useCallback, useEffect, useState } from 'react'
import { ArrowUturnLeftIcon, TrashIcon } from '@heroicons/react/24/outline'
import { getDeletedStudents, restoreStudent, type DeletedStudent } from '@/services/studentService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { getGradeDisplayName } from '@/lib/schoolUtils'
import { studentAvatar } from '@/lib/studentAvatar'
import Avatar from '@/components/avatar/Avatar'
import Spinner from '@/components/Spinner'

interface Props {
  searchTerm: string
  gradeFilter: string | null
  /** Changes when the school year does, so the list reloads. */
  yearKey: string | null
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString('en-CA', { timeZone: 'America/Toronto', month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })

export default function RecentlyDeletedStudents({ searchTerm, gradeFilter, yearKey }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [students, setStudents] = useState<DeletedStudent[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [reload, setReload] = useState(0)

  useEffect(() => {
    let current = true
    getDeletedStudents()
      .then((res) => {
        if (!current) return
        setStudents(res.data)
        setError(null)
      })
      .catch((e) => {
        if (current) setError(e instanceof Error ? e.message : 'Could not load deleted students')
      })
    return () => {
      current = false
    }
  }, [yearKey, reload])

  const restore = useCallback(
    async (s: DeletedStudent) => {
      setRestoring(s.studentId)
      try {
        const res = await restoreStudent(s.studentId)
        showNotification(res.message || `${s.name} restored`, 'success')
        setStudents((list) => (list ? list.filter((x) => x.studentId !== s.studentId) : list))
      } catch (e) {
        showNotification(e instanceof Error ? e.message : 'Could not restore the student', 'error')
        setReload((n) => n + 1)
      } finally {
        setRestoring(null)
      }
    },
    [showNotification]
  )

  if (error && !students) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">{error}</p>
        <button type="button" onClick={() => setReload((n) => n + 1)} className="mt-2 text-sm text-cyan-600 hover:text-cyan-700 font-medium cursor-pointer">Try again</button>
      </div>
    )
  }
  if (!students) {
    return (
      <div className="flex justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  const q = searchTerm.trim().toLowerCase()
  const shown = students.filter((s) => (!q || s.name.toLowerCase().includes(q)) && (!gradeFilter || s.grade === gradeFilter))

  if (shown.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
          <TrashIcon className="h-8 w-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{students.length === 0 ? 'Nothing deleted' : 'No Matching Students'}</h3>
        <p className="text-sm text-slate-500">
          {students.length === 0 ? 'Students you delete this school year show up here, ready to restore.' : 'Try adjusting your search or filters.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">
        Deleted students are hidden from every list, class, report and portal. Their grades, attendance and report cards are kept.
      </p>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100">
        {shown.map((s) => (
          <li key={s.studentId} className="flex items-center gap-4 px-4 py-3">
            <Avatar student name={s.name} avatar={studentAvatar(s)} photoUrl={s.photoUrl ?? null} size={36} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
              <p className="text-xs text-slate-500">
                {s.grade ? getGradeDisplayName(s.grade) : 'No grade'} · deleted {fmtDate(s.deletedAt)}
                {s.deletedByName ? ` by ${s.deletedByName}` : ''}
                {s.wasArchived ? ' · was archived' : ''}
              </p>
            </div>
            <button
              type="button"
              onClick={() => restore(s)}
              disabled={restoring === s.studentId}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
            >
              <ArrowUturnLeftIcon className="h-4 w-4" />
              {restoring === s.studentId ? 'Restoring…' : 'Restore'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
