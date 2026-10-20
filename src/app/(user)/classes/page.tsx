// File: src/app/(user)/classes/page.tsx
// The Classes home (the Teacher-Home board): the caller's classes as cards
// (or the dense List), with To review, Coming up and Drafts & scheduled
// beside them. Every card says its grade; a teacher's cards are one grid in
// grade order, an admin's sit under grade sections (classGradeSections). A
// whole card opens the class; its ⋮ menu changes the banner, opens Settings,
// copies the class to the next term, messages the parents, archives it or
// unarchives it. Filters live in the URL: view, term, grade, archived and,
// for admins, subject and teacher.
'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { AcademicCapIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import ClassAddModal from '@/components/classes/add/classAddModal'
import ClassDeleteModal from '@/components/classes/delete/classDeleteModal'
import ClassDuplicateModal from '@/components/classes/duplicate/classDuplicateModal'
import ClassIdentityModal from '@/components/classes/identity/ClassIdentityModal'
import ArchiveClassModal from '@/components/classes/home/ArchiveClassModal'
import ClassCardGrid from '@/components/classes/home/ClassCardGrid'
import ClassListView from '@/components/classes/home/ClassListView'
import ClassesHomeHeader, { type ClassesView } from '@/components/classes/home/ClassesHomeHeader'
import ClassesToolbar from '@/components/classes/home/ClassesToolbar'
import ComingUpPanel from '@/components/classes/home/ComingUpPanel'
import DraftsPanel from '@/components/classes/home/DraftsPanel'
import ToReviewPanel from '@/components/classes/home/ToReviewPanel'
import { useCollapsedGrades } from '@/hooks/useCollapsedGrades'
import { useFilterParams } from '@/hooks/useFilterParams'
import {
  allCollapsed,
  cardLabels,
  filterByGrade,
  gradeFilterOptions,
  layoutClasses,
  layoutKeys,
} from '@/lib/classGradeSections'
import { knownOrAll, subjectOptions, teacherOptions } from '@/lib/classListFilters'
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
  // Every staff member adds, duplicates, archives and deletes classes, as
  // before; a past school year is read-only for teachers.
  const canWrite = isAdmin || selectedYear?.isActive !== false
  const showNotification = useNotificationStore((s) => s.showNotification)

  const { get, setParams } = useFilterParams()
  const view: ClassesView = get('view') === 'list' ? 'list' : 'cards'
  const term = get('term', 'active')
  const showArchived = get('archived') === '1'

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
  // The Grade row shows once the classes span two grades. Subject and teacher
  // are admin filters. A stale value that matches no option (a remembered
  // grade the teacher no longer teaches) would silently empty the page while
  // its control reads "All", so it falls back to All.
  const grades = gradeFilterOptions(pool)
  const grade = grades.length > 1 ? knownOrAll(get('grade'), grades.map((g) => g.value)) : ''
  const filterValues = {
    subject: isAdmin ? knownOrAll(get('subject'), subjects.map((o) => o.value)) : '',
    teacher: isAdmin ? knownOrAll(get('teacher'), teachers.map((o) => o.value)) : '',
    grade: '',
    term,
  }
  const filterOpts = { isAdmin, activeTermName: activeTerm?.name }
  const shown = filterByGrade(filterCards(pool, filterValues, filterOpts), grade)
  const shownActive = shown.filter((c) => !c.archivedAt)
  const hasFilters = !!(grade || filterValues.subject || filterValues.teacher)
  const layout = layoutClasses(shown, { isAdmin, view })
  const labels = cardLabels(shown, { isAdmin })
  const { collapsed, toggle: toggleSection, setMany: setCollapsed } = useCollapsedGrades(school, user.id)
  const sectionKeys = layoutKeys(layout)
  const classSizes = new Map(allCards.map((c) => [c.classId, c.studentCount]))
  // The server leaves archived classes out of the rails; a class archived
  // here leaves them at once too. Twins ("Grade 7 Quran" twice) get their
  // teacher, or their term, after the class name.
  const archivedIds = new Set(allCards.filter((c) => c.archivedAt).map((c) => c.classId))
  const railLabels = cardLabels(activeCards, { isAdmin: false })
  const live = <T extends { classId: string; classLabel: string }>(rows: T[]) =>
    rows
      .filter((r) => !archivedIds.has(r.classId))
      .map((r) => {
        const suffix = railLabels.get(r.classId)?.railSuffix
        return suffix ? { ...r, classLabel: `${r.classLabel} · ${suffix}` } : r
      })

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
      // Its To review, Coming up and Drafts rows come back with a reload.
      void load()
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
    onUnarchive: (card: ClassCard) => void unarchive(card),
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
  } else if (shown.length === 0) {
    const none = pool.length === 0
    body = (
      <div className="rounded-2xl border border-slate-200/70 bg-white px-6 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <AcademicCapIcon className="h-8 w-8 text-slate-400" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-slate-900">{none ? 'No classes yet' : 'No matching classes'}</h2>
        <p className="text-sm text-slate-500">
          {none
            ? canWrite
              ? 'Add your first class to get started.'
              : 'Classes you teach will show up here.'
            : 'Try another term or grade, or clear the filters.'}
        </p>
      </div>
    )
  } else if (view === 'cards') {
    body = (
      <ClassCardGrid layout={layout} labels={labels} collapsed={collapsed} onToggle={toggleSection} {...cardActions} />
    )
  } else {
    body = (
      <ClassListView
        layout={layout}
        collapsed={collapsed}
        onToggle={toggleSection}
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
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-5 sm:gap-6 sm:p-6 lg:p-8">
          <ClassesHomeHeader
            title={isAdmin ? 'All classes' : 'Your classes'}
            summary={homeSummary(termLabel(term, activeTerm?.name), shownActive)}
            term={term}
            terms={terms}
            activeTerm={activeTerm}
            onTermChange={(v) => setParams({ term: v === 'active' ? null : v })}
            view={view}
            onViewChange={(v) => setParams({ view: v === 'cards' ? null : v })}
            onAdd={canWrite ? () => setShowAdd(true) : undefined}
          />

          <ClassesToolbar
            grades={grades}
            total={pool.length}
            grade={grade}
            onGrade={(v) => setParams({ grade: v || null })}
            admin={
              isAdmin
                ? {
                    subjects,
                    subject: filterValues.subject,
                    onSubject: (v) => setParams({ subject: v || null }),
                    teachers,
                    teacher: filterValues.teacher,
                    onTeacher: (v) => setParams({ teacher: v || null }),
                  }
                : undefined
            }
            showArchived={showArchived}
            onShowArchived={(on) => setParams({ archived: on ? '1' : null })}
            collapse={
              data && sectionKeys.length > 0
                ? {
                    all: allCollapsed(sectionKeys, collapsed),
                    onToggleAll: () => setCollapsed(sectionKeys, !allCollapsed(sectionKeys, collapsed)),
                  }
                : undefined
            }
            filtered={
              hasFilters
                ? {
                    shown: shown.length,
                    total: pool.length,
                    onClear: () => setParams({ grade: null, subject: null, teacher: null }),
                  }
                : undefined
            }
          />

          <div className="flex flex-wrap items-start gap-6">
            <div className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
              {body}
            </div>
            {data && (
              <aside className="flex min-w-0 flex-[1_1_300px] flex-col gap-5">
                <ToReviewPanel rows={live(data.toReview)} />
                <ComingUpPanel rows={live(data.comingUp)} classSizes={classSizes} />
                <DraftsPanel rows={live(data.draftsAndScheduled)} />
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

      {deleteTarget && canWrite && (
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
