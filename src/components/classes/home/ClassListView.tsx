// src/components/classes/home/ClassListView.tsx
// The Classes home's List view: the dense grade-grouped list the Classes page
// has always had, for schools with many classes. A row opens the class; its
// actions go to Settings or Grades, duplicate, unarchive (archived rows, shown
// with "Show archived") and delete (admins).
'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowUturnLeftIcon,
  BookOpenIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import ClassIcon from '@/components/classes/identity/ClassIcon'
import { classHref } from '@/lib/classroomRoutes'
import { groupCardsByGrade } from '@/lib/classesHome'
import type { ClassCard } from '@/services/types/classroom'
import GradeGroupHeader from './GradeGroupHeader'

interface ClassListViewProps {
  cards: ClassCard[]
  isAdmin: boolean
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
  cards,
  isAdmin,
  canWrite,
  unarchivingId,
  onDuplicate,
  onDelete,
  onUnarchive,
}: ClassListViewProps) {
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
  const toggle = (grade: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(grade)) next.delete(grade)
      else next.add(grade)
      return next
    })

  return (
    <div className="space-y-4">
      {groupCardsByGrade(cards).map((group) => {
        const isCollapsed = collapsed.has(group.grade)
        return (
          <section key={group.grade} className="space-y-2">
            <GradeGroupHeader
              label={group.label}
              count={group.cards.length}
              collapsed={isCollapsed}
              onToggle={() => toggle(group.grade)}
            />

            {!isCollapsed && (
              <ul className="space-y-2 pl-2">
                {group.cards.map((card) => {
                  const coTeachers = card.teachers.filter((t) => t.role === 'co')
                  const archived = !!card.archivedAt
                  return (
                    <li
                      key={card.classId}
                      className={`relative flex items-center justify-between gap-3 rounded-xl border p-4 transition-all hover:border-slate-200 hover:bg-slate-100 ${
                        archived ? 'border-dashed border-slate-200 bg-white' : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <div className={`flex min-w-0 items-center gap-4 ${archived ? 'opacity-70' : ''}`}>
                        <ClassIcon identity={card.identity} size={40} />
                        <div className="min-w-0">
                          {/* The link covers the whole row; the actions sit above it. */}
                          <Link
                            href={classHref(card.classId)}
                            className="font-medium text-slate-900 outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:after:ring-2 focus-visible:after:ring-cyan-500"
                          >
                            {card.subject}
                          </Link>
                          <p className="truncate text-sm text-slate-500">{card.teacherName || 'No teacher assigned'}</p>
                          {coTeachers.length > 0 && (
                            <p className="mt-0.5 truncate text-xs text-slate-400">
                              Also: {coTeachers.map((t) => t.name).join(', ')}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        {archived && (
                          <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                            Archived
                          </span>
                        )}
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
                          {isAdmin && (
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
            )}
          </section>
        )
      })}
    </div>
  )
}
