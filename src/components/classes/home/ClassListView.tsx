// src/components/classes/home/ClassListView.tsx
// The Classes home's List view: the dense list the Classes page has always
// had, for schools with many classes, under grade sections once two or more
// grades show (layoutClasses). A row opens the class; its actions go to
// Settings or Grades, duplicate, unarchive (rows in the Archived section,
// shown with "Show archived") and delete.
'use client'

import Link from 'next/link'
import {
  ArrowUturnLeftIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import ClassIcon from '@/components/classes/identity/ClassIcon'
import { gradeChip, type ClassesLayout, type GradeSection } from '@/lib/classGradeSections'
import { classHref } from '@/lib/classroomRoutes'
import type { ClassCard } from '@/services/types/classroom'
import GradeGroupHeader from './GradeGroupHeader'

interface ClassListViewProps {
  layout: ClassesLayout<ClassCard>
  collapsed: Set<string>
  onToggle: (key: string) => void
  /** False when the viewer may not change classes (a past school year, for teachers). */
  canWrite: boolean
  unarchivingId: string | null
  onDuplicate: (card: ClassCard) => void
  onDelete: (card: ClassCard) => void
  onUnarchive: (card: ClassCard) => void
}

const action =
  'relative z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg transition-colors disabled:cursor-wait disabled:opacity-50'

export default function ClassListView({
  layout,
  collapsed,
  onToggle,
  canWrite,
  unarchivingId,
  onDuplicate,
  onDelete,
  onUnarchive,
}: ClassListViewProps) {
  // Rows outside a grade section carry their grade beside the subject.
  const rows = (cards: ClassCard[], showGrade: boolean) => (
    <ul className="space-y-2">
      {cards.map((card) => {
        const coTeachers = card.teachers.filter((t) => t.role === 'co')
        const archived = !!card.archivedAt
        const chip = showGrade ? gradeChip(card.grade) : null
        return (
          <li
            key={card.classId}
            className={`relative flex items-center justify-between gap-3 rounded-xl border bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 ${
              archived ? 'border-dashed border-slate-300' : 'border-slate-200'
            }`}
          >
            <div className={`flex min-w-0 items-center gap-4 ${archived ? 'opacity-70' : ''}`}>
              <ClassIcon identity={card.identity} size={40} />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  {/* The link covers the whole row; the actions sit above it. */}
                  <Link
                    href={classHref(card.classId)}
                    className="font-medium text-slate-900 outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-[3px] focus-visible:after:ring-cyan-600"
                  >
                    {card.subject}
                  </Link>
                  {chip && (
                    <span className="inline-flex h-5 items-center rounded-full bg-slate-100 px-2 text-xs font-semibold text-slate-900">
                      {chip}
                    </span>
                  )}
                </div>
                <p className="truncate text-sm text-slate-500">{card.teacherName || 'No teacher assigned'}</p>
                {coTeachers.length > 0 && (
                  <p className="mt-0.5 truncate text-xs text-slate-400">
                    Also: {coTeachers.map((t) => t.name).join(', ')}
                  </p>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="hidden rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600 sm:inline-flex">
                {card.termName || 'No term'}
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href={classHref(card.classId, 'settings')}
                  className={`${action} text-slate-500 hover:bg-slate-200/70 hover:text-slate-800`}
                  title="Settings"
                  aria-label={`Settings for ${card.subject}`}
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                </Link>
                <Link
                  href={classHref(card.classId, 'grades')}
                  className={`${action} text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700`}
                  title="Grades"
                  aria-label={`Grades for ${card.subject}`}
                >
                  <BookOpenIcon className="h-5 w-5" />
                </Link>
                {canWrite && archived && (
                  <button
                    type="button"
                    onClick={() => onUnarchive(card)}
                    disabled={unarchivingId === card.classId}
                    className={`${action} text-amber-600 hover:bg-amber-50 hover:text-amber-800`}
                    title="Unarchive"
                    aria-label={`Unarchive ${card.subject}`}
                  >
                    <ArrowUturnLeftIcon className="h-5 w-5" />
                  </button>
                )}
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => onDuplicate(card)}
                    className={`${action} text-violet-500 hover:bg-violet-50 hover:text-violet-700`}
                    title="Duplicate"
                    aria-label={`Duplicate ${card.subject}`}
                  >
                    <DocumentDuplicateIcon className="h-5 w-5" />
                  </button>
                )}
                {canWrite && (
                  <button
                    type="button"
                    onClick={() => onDelete(card)}
                    className={`${action} text-red-500 hover:bg-red-50 hover:text-red-700`}
                    title="Delete"
                    aria-label={`Delete ${card.subject}`}
                  >
                    <TrashIcon className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )

  const section = (s: GradeSection<ClassCard>, archived = false) => {
    const isCollapsed = collapsed.has(s.key)
    return (
      <section key={s.key} aria-label={s.label} className="flex flex-col gap-2">
        <GradeGroupHeader section={s} archived={archived} collapsed={isCollapsed} onToggle={() => onToggle(s.key)} />
        {!isCollapsed && rows(s.cards, archived)}
      </section>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {layout.sectioned ? layout.sections.map((s) => section(s)) : layout.flat.length > 0 && rows(layout.flat, true)}
      {layout.archived && section(layout.archived, true)}
    </div>
  )
}
