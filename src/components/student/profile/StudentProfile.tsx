'use client'

// The full student profile, shown inside the StudentProfileHost modal: the
// student's classes and grades, attendance, report cards, guardian
// conversations and record, with edit / archive / delete / message actions.
//
// The view (tab, term, open class) comes from the URL through the host, so
// refresh and shared links restore it; every change goes back through
// onView. Grades come from the same engine as analytics, so "Open in
// Analytics" always shows matching numbers.

import React, { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArchiveBoxArrowDownIcon, ArchiveBoxIcon, ChartBarIcon, ExclamationTriangleIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import type { MenuItem } from '@/components/shared/MenuButton'
import NewConversationModal from '@/components/messaging/NewConversationModal'
import StudentEditModal from '@/components/student/edit/studentEditModal'
import StudentDeleteModal from '@/components/student/delete/studentDeleteModal'
import StudentArchiveModal from '@/components/student/archive/studentArchiveModal'
import StudentUnarchiveModal from '@/components/student/archive/studentUnarchiveModal'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useStudentProfileStore } from '@/store/useStudentProfileStore'
import { getStudentOverview, getStudentTermGrades } from '@/services/studentProfileService'
import { listConversations } from '@/services/messagingService'
import { isApiError } from '@/services/apiClient'
import { gradebookHref, parseTab, type ProfileTab } from '@/lib/studentProfile'
import type { OpenStudentProfile, StudentProfileView } from '@/lib/studentProfileUrl'
import type { ConversationItem } from '@/services/types/messaging'
import type { StudentOverview, StudentTermGrades } from '@/services/types/studentProfile'
import ProfileHeader from './ProfileHeader'
import TermPicker from './TermPicker'
import OverviewTab from './OverviewTab'
import GradesTab from './GradesTab'
import AttendanceTab from './AttendanceTab'
import ReportsTab from './ReportsTab'
import MessagesTab from './MessagesTab'
import ProfileInfoTab from './ProfileInfoTab'
import { Card, EmptyState, type GradebookLink } from './ui'

type ModalKind = 'edit' | 'archive' | 'unarchive' | 'delete' | 'message'

interface StudentProfileProps {
  view: OpenStudentProfile
  onView: (patch: StudentProfileView) => void
  onClose: () => void
}

const StudentProfile: React.FC<StudentProfileProps> = ({ view, onView, onClose }) => {
  const { studentId } = view
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const notifyChanged = useStudentProfileStore((s) => s.notifyChanged)

  const tab = parseTab(view.tab)
  const termParam = view.term || null
  const openClassId = view.classId || null

  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  const [modal, setModal] = useState<ModalKind | null>(null)

  // A change made here also refreshes the page underneath (e.g. the Students list).
  const changed = useCallback(() => {
    reload()
    notifyChanged()
  }, [reload, notifyChanged])

  // ── Profile, terms, attendance, reports (one call) ──
  const [overview, setOverview] = useState<StudentOverview | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'notFound' | 'error'>('loading')
  useEffect(() => {
    let cancelled = false
    getStudentOverview(studentId)
      .then((res) => {
        if (cancelled) return
        setOverview(res.data)
        setStatus('ready')
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Error loading student profile', err)
        setStatus(isApiError(err) && err.status === 404 ? 'notFound' : 'error')
      })
    return () => {
      cancelled = true
    }
  }, [studentId, reloadKey])

  // ── One term's grades; runs alongside the overview (the server picks the default term) ──
  const [grades, setGrades] = useState<StudentTermGrades | null>(null)
  const [gradesLoading, setGradesLoading] = useState(true)
  const [gradesFailed, setGradesFailed] = useState(false)
  useEffect(() => {
    let cancelled = false
    setGradesLoading(true)
    setGradesFailed(false)
    getStudentTermGrades(studentId, termParam)
      .then((res) => {
        if (!cancelled) setGrades(res.data)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('Error loading student grades', err)
        // A term from another school year: drop it and fall back to the default term.
        if (isApiError(err) && err.status === 400 && termParam) onView({ term: null })
        else setGradesFailed(true)
      })
      .finally(() => {
        if (!cancelled) setGradesLoading(false)
      })
    return () => {
      cancelled = true
    }
    // onView is only used on failure; keying on it would refetch whenever the URL moves.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, termParam, reloadKey])

  // ── Guardian conversations the viewer can see (year-scoped like the inbox) ──
  const [threads, setThreads] = useState<ConversationItem[] | null>(null)
  const [threadsLoading, setThreadsLoading] = useState(true)
  const [threadsError, setThreadsError] = useState<string | null>(null)
  useEffect(() => {
    let cancelled = false
    setThreadsLoading(true)
    listConversations({ studentId, status: 'all', limit: 100 })
      .then((res) => {
        if (cancelled) return
        setThreads(res.data ?? [])
        setThreadsError(null)
      })
      .catch((err: Error) => {
        if (!cancelled) setThreadsError(err.message || 'Could not load conversations')
      })
      .finally(() => {
        if (!cancelled) setThreadsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [studentId, selectedYearId, reloadKey])

  if (status === 'loading') {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Spinner size="lg" />
      </div>
    )
  }

  if (status !== 'ready' || !overview) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <EmptyState icon={UserIcon} title={status === 'notFound' ? 'Student not found' : 'Could not load this student'}>
          {status === 'notFound'
            ? 'They may have been deleted, or belong to another school.'
            : 'Something went wrong loading the profile. Close it and try again.'}
        </EmptyState>
      </div>
    )
  }

  const student = overview.student
  const archived = Boolean(student.isArchived)
  const isAdmin = user.role === 'ADMIN'
  const numeric = overview.gradingMode === 'numeric'

  // The picker shows the chosen term at once; the content keeps the last
  // loaded term (dimmed) until that term's grades arrive.
  const termId = termParam ?? grades?.termId ?? overview.defaultTermId
  const shownTermId = grades?.termId ?? termId
  const shownTerm = overview.terms.find((t) => t.termId === shownTermId) ?? null
  const detail = grades?.detail ?? null
  const gradesPending = !gradesFailed && (gradesLoading || (grades != null && grades.termId !== termId))

  const analyticsLink = (classId?: string): string | null => {
    if (!numeric || archived || !shownTermId) return null
    return classId
      ? `/analytics?view=class&classId=${encodeURIComponent(classId)}&termId=${encodeURIComponent(shownTermId)}`
      : `/analytics?view=student&studentId=${encodeURIComponent(studentId)}&termId=${encodeURIComponent(shownTermId)}`
  }
  // Admins open any gradebook; a teacher only their own class's.
  const gradebookLink: GradebookLink = (e) =>
    isAdmin || (e.teacherId != null && e.teacherId === user.id) ? gradebookHref(e.classId, e.grade) : null

  const goTab = (next: ProfileTab) => onView({ tab: next === 'overview' ? null : next, classId: null })
  const openClass = (classId: string) => onView({ tab: 'grades', classId })
  const pickTerm = (id: string) => onView({ term: id === overview.defaultTermId ? null : id, classId: null })

  const studentAnalytics = analyticsLink()
  const menuItems: MenuItem[] = [
    ...(studentAnalytics
      ? [{ key: 'analytics', label: 'Open in Analytics', icon: ChartBarIcon, onSelect: () => router.push(studentAnalytics) }]
      : []),
    archived
      ? { key: 'restore', label: 'Restore student', icon: ArchiveBoxIcon, onSelect: () => setModal('unarchive') }
      : { key: 'archive', label: 'Archive student', icon: ArchiveBoxArrowDownIcon, onSelect: () => setModal('archive') },
    { key: 'delete', label: 'Delete student', icon: TrashIcon, danger: true, onSelect: () => setModal('delete') },
  ]

  const showTerms = (tab === 'overview' || tab === 'grades') && overview.terms.length > 0
  const openThreads = threads?.filter((t) => t.status === 'open').length ?? 0

  return (
    <div className="min-h-full bg-slate-50">
      <ProfileHeader
        student={student}
        tab={tab}
        onTab={goTab}
        tabBadges={{ messages: openThreads, grades: numeric ? detail?.overall.missingCount : undefined }}
        onMessage={() => setModal('message')}
        onEdit={() => setModal('edit')}
        menuItems={menuItems}
      />

      <div className="px-4 py-5 sm:px-6">
        {showTerms && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <TermPicker terms={overview.terms} value={termId} onChange={pickTerm} />
            {gradesPending && (
              <span className="inline-flex items-center gap-2 text-xs text-slate-400">
                <Spinner size="sm" />
                Loading grades…
              </span>
            )}
          </div>
        )}

        <div className={`transition-opacity ${showTerms && gradesPending && grades ? 'opacity-60' : ''}`}>
          {(tab === 'overview' || tab === 'grades') && gradesFailed ? (
            <Card>
              <EmptyState icon={ExclamationTriangleIcon} title="Could not load grades">
                <button onClick={reload} className="cursor-pointer font-medium text-cyan-600 hover:text-cyan-700">
                  Try again
                </button>
              </EmptyState>
            </Card>
          ) : (tab === 'overview' || tab === 'grades') && gradesLoading && !grades ? (
            <div className="flex justify-center py-16">
              <Spinner size="lg" />
            </div>
          ) : tab === 'overview' ? (
            <OverviewTab
              overview={overview}
              term={shownTerm}
              detail={detail}
              analyticsHref={studentAnalytics}
              gradebookLink={gradebookLink}
              onOpenClass={openClass}
              onTab={goTab}
            />
          ) : tab === 'grades' ? (
            <GradesTab
              overview={overview}
              term={shownTerm}
              detail={detail}
              openClassId={openClassId}
              onToggleClass={(classId) => onView({ classId })}
              classAnalyticsHref={(classId) => analyticsLink(classId)}
              gradebookLink={gradebookLink}
            />
          ) : tab === 'attendance' ? (
            <AttendanceTab overview={overview} />
          ) : tab === 'reports' ? (
            <ReportsTab overview={overview} />
          ) : tab === 'messages' ? (
            <MessagesTab
              threads={threads}
              loading={threadsLoading}
              error={threadsError}
              isAdmin={isAdmin}
              archived={archived}
              onNew={() => setModal('message')}
            />
          ) : (
            <ProfileInfoTab overview={overview} onEdit={archived ? null : () => setModal('edit')} />
          )}
        </div>
      </div>

      {modal === 'edit' && <StudentEditModal isOpen onClose={() => setModal(null)} student={student} onUpdate={changed} />}
      {modal === 'archive' && <StudentArchiveModal isOpen onClose={() => setModal(null)} student={student} onArchived={changed} />}
      {modal === 'unarchive' && <StudentUnarchiveModal isOpen onClose={() => setModal(null)} student={student} onUnarchived={changed} />}
      {modal === 'delete' && (
        <StudentDeleteModal
          isOpen
          onClose={() => setModal(null)}
          student={student}
          onDeleted={() => {
            notifyChanged()
            onClose()
          }}
        />
      )}
      <NewConversationModal
        isOpen={modal === 'message'}
        onClose={() => setModal(null)}
        tone="staff"
        role={isAdmin ? 'ADMIN' : 'TEACHER'}
        preset={{ studentId, mode: 'general' }}
        onCreated={() => {
          // Stay on the profile: the new thread shows up on its Messages tab.
          setModal(null)
          showNotification('Message sent', 'success')
          onView({ tab: 'messages', classId: null })
          reload()
        }}
      />
    </div>
  )
}

export default StudentProfile
