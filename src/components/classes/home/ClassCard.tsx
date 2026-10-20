// src/components/classes/home/ClassCard.tsx
// One class on the Classes home (the Teacher-Home board). The whole card is
// a link to the class; the ⋮ menu sits beside the link (not inside it), so
// opening the menu never opens the class. The banner leads with the grade
// chip ("Grade 5"), since a teacher's Grade 4, 5 and 6 Math share one banner.
'use client'

import Link from 'next/link'
import { ArchiveBoxIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import ClassBanner from '@/components/classes/identity/ClassBanner'
import ClassIcon from '@/components/classes/identity/ClassIcon'
import { archivedOn, gradeChip, type CardLabel } from '@/lib/classGradeSections'
import { classHref } from '@/lib/classroomRoutes'
import { cardNextLine, classTitle, reviewPill } from '@/lib/classesHome'
import type { ClassCard as ClassCardData } from '@/services/types/classroom'
import ClassCardMenu from './ClassCardMenu'

export interface ClassCardActions {
  /** False when the viewer may not change classes (a past school year, for teachers). */
  canWrite: boolean
  onChangeBanner: (card: ClassCardData) => void
  onCopy: (card: ClassCardData) => void
  onArchive: (card: ClassCardData) => void
  onUnarchive: (card: ClassCardData) => void
}

interface ClassCardProps extends ClassCardActions {
  card: ClassCardData
  /** Whether to show the teacher and the term (cardLabels). */
  label: CardLabel
}

const PILL_TONE = {
  review: 'bg-cyan-100 text-cyan-800',
  calm: 'bg-slate-100 text-slate-600',
  archived: 'bg-amber-100 text-amber-800',
} as const

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

export default function ClassCard({ card, label, canWrite, onChangeBanner, onCopy, onArchive, onUnarchive }: ClassCardProps) {
  const archived = !!card.archivedAt
  const next = cardNextLine(card.next)
  const pill = archived
    ? { label: `Archived ${archivedOn(card.archivedAt as string)}`, tone: 'archived' as const }
    : reviewPill(card.toReviewCount)
  const chip = gradeChip(card.grade)
  const lead = card.teachers.find((t) => t.role === 'lead')
  const leadName = lead?.name || card.teacherName || ''
  const coCount = card.teachers.filter((t) => t.role === 'co').length
  const showTeacher = label.showTeacher && !!leadName
  const students = plural(card.studentCount, 'student', 'students')
  const spoken = [classTitle(card.grade, card.subject), label.termChip, students, showTeacher ? leadName : null, archived ? 'archived' : null]
    .filter(Boolean)
    .join(', ')

  const eyebrow = (chip || label.termChip) && (
    <span className="mb-0.5 flex flex-wrap gap-1.5">
      {chip && (
        <span className="inline-flex h-6 items-center rounded-full bg-white px-2.5 text-[13px] font-bold text-slate-900 shadow-[0_0_0_1px_rgba(15,23,42,0.08),0_1px_2px_rgba(15,23,42,0.1)]">
          {chip}
        </span>
      )}
      {label.termChip && (
        <span className="inline-flex h-6 items-center rounded-full bg-white/60 px-2.5 text-[13px] font-medium shadow-[0_0_0_1px_rgba(15,23,42,0.06)]">
          {label.termChip}
        </span>
      )}
    </span>
  )

  return (
    <div className="relative">
      <Link
        href={classHref(card.classId)}
        aria-label={`Open ${spoken}`}
        className={`flex h-full flex-col overflow-hidden rounded-2xl border bg-white text-slate-900 shadow-[0_1px_2px_rgba(15,23,42,0.04)] outline-none transition-[box-shadow,border-color,transform] duration-150 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_14px_28px_-16px_rgba(15,23,42,0.3),0_2px_6px_-2px_rgba(15,23,42,0.08)] focus-visible:border-cyan-600 focus-visible:ring-[3px] focus-visible:ring-cyan-600 focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${
          archived ? 'border-dashed border-slate-300' : 'border-slate-200'
        }`}
      >
        <ClassBanner
          identity={card.identity}
          subject={card.subject}
          eyebrow={eyebrow}
          scrim
          className={`h-28 shrink-0 ${archived ? '[&>img]:opacity-65 [&>img]:grayscale' : ''}`}
        />
        <span className="relative -mt-6 flex px-5">
          <ClassIcon
            identity={card.identity}
            size={48}
            className={`border-[3px] border-white shadow-[0_2px_6px_rgba(15,23,42,0.08)] ${archived ? 'opacity-65 grayscale' : ''}`}
          />
        </span>
        <span className="flex flex-1 flex-col gap-3 px-5 pb-5 pt-2.5">
          {/* pr-10 keeps the first line clear of the ⋮ button beside it */}
          {showTeacher && (
            <span className="flex min-w-0 items-center gap-2 pr-10 text-[13.5px] text-slate-700">
              <Avatar name={leadName} avatar={lead?.avatar ?? null} photoUrl={lead?.photoUrl} size={22} />
              <span className="truncate">
                {leadName}
                {coCount > 0 && <span className="text-slate-500"> +{coCount}</span>}
              </span>
            </span>
          )}
          <span className={`flex items-start gap-2.5 text-sm text-slate-700 ${showTeacher ? '' : 'pr-10'}`}>
            {archived ? (
              <>
                <ArchiveBoxIcon className="mt-px h-[18px] w-[18px] shrink-0 text-slate-500" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="text-slate-500">Hidden from</span> students and parents
                </span>
              </>
            ) : (
              <>
                <DocumentTextIcon className="mt-px h-[18px] w-[18px] shrink-0 text-slate-500" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="text-slate-500">{next.when}</span> {next.what}
                </span>
              </>
            )}
          </span>
          <span className="mt-auto flex items-center justify-between gap-2">
            <span className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${PILL_TONE[pill.tone]}`}>
              {pill.label}
            </span>
            <span className="whitespace-nowrap text-[13px] tabular-nums text-slate-500">{students}</span>
          </span>
        </span>
      </Link>
      <ClassCardMenu
        classId={card.classId}
        label={spoken}
        canWrite={canWrite}
        archived={archived}
        onChangeBanner={() => onChangeBanner(card)}
        onCopy={() => onCopy(card)}
        onArchive={() => onArchive(card)}
        onUnarchive={() => onUnarchive(card)}
        className="absolute right-3 top-[122px]"
      />
    </div>
  )
}
