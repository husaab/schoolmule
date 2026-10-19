'use client'

// The full student profile: one page per student with their classes and
// grades, attendance, report cards, guardian conversations and record.
// Reached from the Students list (row click / name), the quick-view modal,
// analytics' student view and the messaging context card.
//
// Tab, term and the open class live in the URL (?tab=&term=&class=) so Back,
// refresh and shared links restore the view. Grades come from the same
// engine as analytics, so "Open in Analytics" always shows matching numbers.

import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArchiveBoxArrowDownIcon, ArchiveBoxIcon, ArrowLeftIcon, ChartBarIcon, ExclamationTriangleIcon, TrashIcon, UserIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import BackLink from '@/components/shared/BackLink'
import type { MenuItem } from '@/components/shared/MenuButton'
import NewConversationModal from '@/components/messaging/NewConversationModal'
import StudentEditModal from '@/components/student/edit/studentEditModal'
import StudentDeleteModal from '@/components/student/delete/studentDeleteModal'
import StudentArchiveModal from '@/components/student/archive/studentArchiveModal'
import StudentUnarchiveModal from '@/components/student/archive/studentUnarchiveModal'
import { useFilterParams, useRememberedHref } from '@/hooks/useFilterParams'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { getStudentOverview, getStudentTermGrades } from '@/services/studentProfileService'
import { listConversations } from '@/services/messagingService'
import { isApiError } from '@/services/apiClient'
import { gradebookHref, parseTab, type ProfileTab } from '@/lib/studentProfile'
import type { ConversationItem } from '@/services/types/messaging'
import type { StudentOverview, StudentTermGrades } from '@/services/types/studentProfile'
import ProfileHeader from './_components/ProfileHeader'
import TermPicker from './_components/TermPicker'
import OverviewTab from './_components/OverviewTab'
import GradesTab from './_components/GradesTab'
import AttendanceTab from './_components/AttendanceTab'
import ReportsTab from './_components/ReportsTab'
import MessagesTab from './_components/MessagesTab'
import ProfileInfoTab from './_components/ProfileInfoTab'
import { Card, EmptyState, type GradebookLink } from './_components/ui'

type ModalKind = 'edit' | 'archive' | 'unarchive' | 'delete' | 'message'

const Shell = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <Sidebar />
    <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
    </main>
  </>
)

const backLinkClass = 'mb-4 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700'

function StudentProfileContent({ studentId }: { studentId: string }) {
  const router = useRouter()
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  // ?class= only says which class is open right now; never remember it.
  const { get, setParams } = useFilterParams({ transient: ['class'] })
  const studentsHref = useRememberedHref('/students')

  const tab = parseTab(get('tab'))
  const termParam = get('term') || null
  const openClassId = get('class') || null

  const [reloadKey, setReloadKey] = useState(0)
  const reload = useCallback(() => setReloadKey((k) => k + 1), [])
  const [modal, setModal] = useState<ModalKind | null>(null)

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
        // A ?term= from another school year: drop it and fall back to the default term.
        if (isApiError(err) && err.status === 400 && termParam) setParams({ term: null })
        else setGradesFailed(true)
      })
      .finally(() => {
        if (!cancelled) setGradesLoading(false)
      })
    return () => {
      cancelled = true
    }
    // setParams is only used on failure; keying on it would refetch on every URL change.
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
      <Shell>
        <div className="flex justify-center py-24">
          <Spinner size="lg" />
        </div>
      </Shell>
    )
  }

  if (status !== 'ready' || !overview) {
    return (
      <Shell>
        <BackLink to="/students" className={backLinkClass}>
          <ArrowLeftIcon className="h-4 w-4" />
          Back to Students
        </BackLink>
        <Card>
          <EmptyState icon={UserIcon} title={status === 'notFound' ? 'Student not found' : 'Could not load this student'}>
            {status === 'notFound'
              ? 'They may have been deleted, or belong to another school.'
              : 'Something went wrong loading the profile. Try refreshing the page.'}
          </EmptyState>
        </Card>
      </Shell>
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

  const goTab = (next: ProfileTab) => setParams({ tab: next === 'overview' ? null : next, class: null })
  const openClass = (classId: string) => setParams({ tab: 'grades', class: classId })
  const pickTerm = (id: string) => setParams({ term: id === overview.defaultTermId ? null : id, class: null })

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
    <Shell>
      <BackLink to="/students" className={backLinkClass}>
        <ArrowLeftIcon className="h-4 w-4" />
        Back to Students
      </BackLink>

      <ProfileHeader
        student={student}
        tab={tab}
        onTab={goTab}
        tabBadges={{ messages: openThreads, grades: numeric ? detail?.overall.missingCount : undefined }}
        onMessage={() => setModal('message')}
        onEdit={() => setModal('edit')}
        menuItems={menuItems}
      />

      {showTerms && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <TermPicker terms={overview.terms} value={termId} onChange={pickTerm} />
          {gradesPending && (
            <span className="inline-flex items-center gap-2 text-xs text-slate-400">
              <Spinner size="sm" />
              Loading grades…
            </span>
          )}
        </div>
      )}

      <div className={`mt-6 transition-opacity ${showTerms && gradesPending && grades ? 'opacity-60' : ''}`}>
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
            onToggleClass={(classId) => setParams({ class: classId })}
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

      {modal === 'edit' && (
        <StudentEditModal isOpen onClose={() => setModal(null)} student={student} onUpdate={reload} />
      )}
      {modal === 'archive' && (
        <StudentArchiveModal isOpen onClose={() => setModal(null)} student={student} onArchived={reload} />
      )}
      {modal === 'unarchive' && (
        <StudentUnarchiveModal isOpen onClose={() => setModal(null)} student={student} onUnarchived={reload} />
      )}
      {modal === 'delete' && (
        <StudentDeleteModal isOpen onClose={() => setModal(null)} student={student} onDeleted={() => router.push(studentsHref)} />
      )}
      <NewConversationModal
        isOpen={modal === 'message'}
        onClose={() => setModal(null)}
        tone="staff"
        role={isAdmin ? 'ADMIN' : 'TEACHER'}
        preset={{ studentId, mode: 'general' }}
        onCreated={(thread) => {
          setModal(null)
          router.push(`/messages?thread=${encodeURIComponent(thread.conversation.conversationId)}`)
        }}
      />
    </Shell>
  )
}

const StudentProfilePage = () => {
  const { studentId } = useParams<{ studentId: string }>()
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      {/* Keyed so moving between students starts from a clean slate. */}
      <StudentProfileContent key={studentId} studentId={studentId} />
    </Suspense>
  )
}

export default StudentProfilePage
