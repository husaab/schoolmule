// File: src/app/(user)/classes/page.tsx
// The Classes home (the Teacher-Home board): the caller's classes as cards
// (or the dense grade-grouped List), with To review, Coming up and Drafts &
// scheduled beside them. A whole card opens the class; its ⋮ menu changes the
// banner, opens Settings, copies the class to the next term, messages the
// parents or archives it. Filters live in the URL: view, term, archived and,
// for admins, subject, grade and teacher.
'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import ClassAddModal from '@/components/classes/add/classAddModal'
import ClassDeleteModal from '@/components/classes/delete/classDeleteModal'
import ClassDuplicateModal from '@/components/classes/duplicate/classDuplicateModal'
import ClassListFilters from '@/components/classes/ClassListFilters'
import ClassIdentityModal from '@/components/classes/identity/ClassIdentityModal'
import ArchiveClassModal from '@/components/classes/home/ArchiveClassModal'
import ClassCardGrid from '@/components/classes/home/ClassCardGrid'
import ClassListView from '@/components/classes/home/ClassListView'
import ClassesHomeHeader, { type ClassesView } from '@/components/classes/home/ClassesHomeHeader'
import ComingUpPanel from '@/components/classes/home/ComingUpPanel'
import DraftsPanel from '@/components/classes/home/DraftsPanel'
import ToReviewPanel from '@/components/classes/home/ToReviewPanel'
import { useFilterParams } from '@/hooks/useFilterParams'
import { gradeOptions, knownOrAll, subjectOptions, teacherOptions } from '@/lib/classListFilters'
import { cardAsClassPayload, classTitle, filterCards, gradeShort, homeSummary, termLabel } from '@/lib/classesHome'
import { getClassCards, unarchiveClass } from '@/services/classroomService'
import { getTermsBySchool } from '@/services/termService'
import type { ClassPayload } from '@/services/types/class'
import type { ClassCard, ClassCardsData } from '@/services/types/classroom'
import type { TermPayload } from '@/services/types/term'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSchoolYearStore, useSelectedYear } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'

interface LoadResult {
  /** Which year and archived setting the answer is for. */
  key: string
  data: ClassCardsData | null
  error: string | null
}

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback)

const CardSkeleton = () => (
  <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(min(260px,100%),1fr))]" aria-hidden="true">
    {[0, 1, 2, 3].map((i) => (
      <div key={i} className="h-[236px] animate-pulse rounded-2xl border border-slate-200/70 bg-white">
        <div className="h-28 rounded-t-2xl bg-slate-100" />
      </div>
    ))}
  </div>
)

function ClassesHomeContent() {
  const user = useUserStore((s) => s.user)
  const school = user.school ?? ''
  const isAdmin = user.role === 'ADMIN'
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const selectedYear = useSelectedYear()
  // A past school year is read-only for teachers.
  const canWrite = isAdmin || selectedYear?.isActive !== false
  const showNotification = useNotificationStore((s) => s.showNotification)

  const { get, setParams } = useFilterParams()
  const view: ClassesView = get('view') === 'list' ? 'list' : 'cards'
  const term = get('term', 'active')
  const showArchived = view === 'list' && get('archived') === '1'

  // ───── Classes ─────
  const fetchKey = `${selectedYearId ?? ''}|${showArchived ? 'archived' : 'active'}`
  const [result, setResult] = useState<LoadResult | null>(null)
  const seq = useRef(0)
  const load = useCallback(async () => {
    const ticket = ++seq.current
    try {
      const res = await getClassCards({ archived: showArchived })
      if (ticket === seq.current) setResult({ key: fetchKey, data: res.data, error: null })
    } catch (err) {
      if (ticket !== seq.current) return
      const error = errorText(err, 'Error loading classes')
      setResult((prev) => ({ key: fetchKey, data: prev?.key === fetchKey ? prev.data : null, error }))
    }
  }, [fetchKey, showArchived])
  useEffect(() => {
    if (!user.id) return
    void load()
  }, [load, user.id])
  const current = result?.key === fetchKey ? result : null
  const data = current?.data ?? null

  const patchCard = (classId: string, patch: Partial<ClassCard>) =>
    setResult((prev) =>
      prev?.data
        ? {
            ...prev,
            data: {
              ...prev.data,
              classes: prev.data.classes.map((c) => (c.classId === classId ? { ...c, ...patch } : c)),
            },
          }
        : prev,
    )

  // ───── Terms ─────
  const [terms, setTerms] = useState<TermPayload[]>([])
  useEffect(() => {
    if (!school) return
    let live = true
    const loadTerms = async () => {
      try {
        const res = await getTermsBySchool(school)
        if (live && res.status === 'success') setTerms(res.data)
      } catch (err) {
        console.error('Error loading terms:', err)
      }
    }
    void loadTerms()
    return () => {
      live = false
    }
  }, [school, selectedYearId]) // refetch when the selected school year changes
  const activeTerm = terms.find((t) => t.isActive)

  // ───── Filters ─────
  const allCards = data?.classes ?? []
  const activeCards = allCards.filter((c) => !c.archivedAt)
  const pool = showArchived ? allCards : activeCards
  // Options come from the loaded classes, so they only offer what exists.
  const payloads = pool.map((c) => cardAsClassPayload(c, school))
  const subjects = subjectOptions(payloads)
  const teachers = teacherOptions(payloads)
  const grades = gradeOptions(payloads)
  // Subject, grade and teacher are admin filters; a stale value that matches
  // no option would silently empty the page while its control reads "All".
  const filterValues = {
    subject: isAdmin ? knownOrAll(get('subject'), subjects.map((o) => o.value)) : '',
    teacher: isAdmin ? knownOrAll(get('teacher'), teachers.map((o) => o.value)) : '',
    grade: isAdmin ? knownOrAll(get('grade'), grades.map((g) => String(g.value))) : '',
    term,
  }
  const filterOpts = { isAdmin, activeTermName: activeTerm?.name }
  const shownActive = filterCards(activeCards, filterValues, filterOpts)
  const shownList = view === 'list' ? filterCards(pool, filterValues, filterOpts) : shownActive
  const hasAdminFilters = isAdmin && !!(filterValues.subject || filterValues.teacher || filterValues.grade)
  const classSizes = new Map(allCards.map((c) => [c.classId, c.studentCount]))

  // ───── Card and row actions ─────
  const [showAdd, setShowAdd] = useState(false)
  const [identityCard, setIdentityCard] = useState<ClassCard | null>(null)
  const [archiveCard, setArchiveCard] = useState<ClassCard | null>(null)
  // The modals read the class payload; it is built once when a modal opens.
  const [duplicateTarget, setDuplicateTarget] = useState<ClassPayload | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ClassPayload | null>(null)
  const [unarchivingId, setUnarchivingId] = useState<string | null>(null)

  const unarchive = async (card: ClassCard) => {
    setUnarchivingId(card.classId)
    try {
      const res = await unarchiveClass(card.classId)
      patchCard(card.classId, { archivedAt: res.data.archivedAt })
      showNotification(`${classTitle(card.grade, card.subject)} is back on class cards`, 'success')
    } catch (err) {
      showNotification(errorText(err, "The class couldn't be unarchived. Try again."), 'error')
    } finally {
      setUnarchivingId(null)
    }
  }

  const cardActions = {
    canWrite,
    onChangeBanner: (card: ClassCard) => setIdentityCard(card),
    onCopy: (card: ClassCard) => setDuplicateTarget(cardAsClassPayload(card, school)),
    onArchive: (card: ClassCard) => setArchiveCard(card),
  }

  // ───── Body ─────
  let body: React.ReactNode
  if (!current) {
    body = <CardSkeleton />
  } else if (!data) {
    body = (
      <div className="rounded-2xl border border-rose-100 bg-white px-6 py-12 text-center">
        <p className="text-rose-600">{current.error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="mt-4 cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
        >
          Try again
        </button>
      </div>
    )
  } else if ((view === 'cards' ? shownActive : shownList).length === 0) {
    const none = pool.length === 0
    body = (
      <div className="rounded-2xl border border-slate-200/70 bg-white px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <AcademicCapIcon className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">{none ? 'No classes yet' : 'No matching classes'}</h2>
        <p className="text-sm text-slate-500">
          {none
            ? isAdmin
              ? 'Add your first class to get started.'
              : 'Classes you teach will show up here.'
            : 'Try another term or clear the filters.'}
        </p>
      </div>
    )
  } else if (view === 'cards') {
    body = <ClassCardGrid cards={shownActive} grouped={isAdmin} {...cardActions} />
  } else {
    body = (
      <ClassListView
        cards={shownList}
        isAdmin={isAdmin}
        canWrite={canWrite}
        unarchivingId={unarchivingId}
        onDuplicate={(card) => setDuplicateTarget(cardAsClassPayload(card, school))}
        onDelete={(card) => setDeleteTarget(cardAsClassPayload(card, school))}
        onUnarchive={(card) => void unarchive(card)}
      />
    )
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 p-6 lg:p-8">
          <ClassesHomeHeader
            summary={homeSummary(termLabel(term, activeTerm?.name), shownActive)}
            term={term}
            terms={terms}
            activeTerm={activeTerm}
            onTermChange={(v) => setParams({ term: v === 'active' ? null : v })}
            view={view}
            onViewChange={(v) => setParams({ view: v === 'cards' ? null : v })}
            onAdd={isAdmin ? () => setShowAdd(true) : undefined}
          />

          {isAdmin && (
            <div className="rounded-2xl border border-slate-200/70 bg-white p-5">
              <ClassListFilters
                values={filterValues}
                setParams={setParams}
                subjects={subjects}
                teachers={teachers}
                grades={grades}
                terms={terms}
                activeTerm={activeTerm}
                showTeacher
                showTerm={false}
              />
              {hasAdminFilters && (
                <div className="mt-4 flex items-center gap-3">
                  <span className="text-sm text-slate-500">
                    Showing {shownList.length} of {pool.length} classes
                  </span>
                  <button
                    type="button"
                    onClick={() => setParams({ grade: null, subject: null, teacher: null })}
                    className="cursor-pointer text-sm font-medium text-cyan-600 hover:text-cyan-700"
                  >
                    Clear filters
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
              {view === 'list' && (
                <label className="flex items-center gap-2 self-end text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={showArchived}
                    onChange={(e) => setParams({ archived: e.target.checked ? '1' : null })}
                    className="h-4 w-4 cursor-pointer accent-cyan-600"
                  />
                  Show archived
                </label>
              )}
              {body}
            </div>
            {data && (
              <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                <ToReviewPanel rows={data.toReview} />
                <ComingUpPanel rows={data.comingUp} classSizes={classSizes} />
                <DraftsPanel rows={data.draftsAndScheduled} />
              </aside>
            )}
          </div>
        </div>
      </main>

      {showAdd && <ClassAddModal isOpen onClose={() => setShowAdd(false)} onAdd={() => void load()} />}

      {identityCard && (
        <ClassIdentityModal
          isOpen
          classId={identityCard.classId}
          subject={identityCard.subject}
          gradeLabel={gradeShort(identityCard.grade)}
          teacherName={identityCard.teacherName ?? ''}
          identity={identityCard.identity}
          onClose={() => setIdentityCard(null)}
          onSaved={(identity) => patchCard(identityCard.classId, { identity })}
        />
      )}

      {archiveCard && (
        <ArchiveClassModal
          isOpen
          onClose={() => setArchiveCard(null)}
          classId={archiveCard.classId}
          label={classTitle(archiveCard.grade, archiveCard.subject)}
          onArchived={(archivedAt) => {
            patchCard(archiveCard.classId, { archivedAt })
            showNotification(`${classTitle(archiveCard.grade, archiveCard.subject)} is archived`, 'success')
          }}
        />
      )}

      {duplicateTarget && (
        <ClassDuplicateModal
          isOpen
          onClose={() => setDuplicateTarget(null)}
          sourceClass={duplicateTarget}
          onDuplicated={() => void load()}
        />
      )}

      {deleteTarget && isAdmin && (
        <ClassDeleteModal
          isOpen
          onClose={() => setDeleteTarget(null)}
          classData={deleteTarget}
          onDeleted={() => void load()}
        />
      )}
    </>
  )
}

export default function ClassesPage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <ClassesHomeContent />
    </Suspense>
  )
}
