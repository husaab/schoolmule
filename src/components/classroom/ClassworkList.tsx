// src/components/classroom/ClassworkList.tsx
// A class's Classwork for a student or a parent (Parent-Lens board, Classwork
// tab): the work grouped by topic, each row with its kind's icon in the class
// color, the title, a line under it ("Due tomorrow, 3:30 pm", "Was due Oct 9",
// "Turned in Thu · graded today") and a status pill ("Graded · 8/10", "Assigned",
// "Missing", "To read"). Work with no topic comes first, with no heading. The
// rows only open the item; nothing here changes anything, so the parent's
// lens uses it as it is.
'use client'

import Link from 'next/link'
import {
  BookmarkIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import WorkStatusPill from '@/components/studentPortal/work/WorkStatusPill'
import { CLASS_COLORS } from '@/lib/classIdentity'
import { classworkMeta, classworkPill, classworkSections } from '@/lib/classworkList'
import type { ClassColor } from '@/services/types/classroom'
import type { ClassworkTopic, StudentItemSummary } from '@/services/types/studentPortal'

interface ClassworkListProps {
  topics: ClassworkTopic[]
  items: StudentItemSummary[]
  /** Where a row goes. */
  hrefFor: (item: StudentItemSummary) => string
  /** The class color tints each kind icon. */
  color: ClassColor
  tone?: 'student' | 'parent'
  now?: Date
}

const ICONS = {
  assignment: DocumentTextIcon,
  quiz: ClipboardDocumentListIcon,
  material: BookmarkIcon,
  assessment: ClipboardDocumentCheckIcon,
}

const BORDER = { student: 'border-slate-200/70 hover:bg-slate-50', parent: 'border-stone-200 hover:bg-stone-50' }
const MISSING_BORDER = 'border-rose-200 hover:bg-rose-50/40'

export default function ClassworkList({ topics, items, hrefFor, color, tone = 'student', now = new Date() }: ClassworkListProps) {
  const sections = classworkSections(topics, items)
  const palette = CLASS_COLORS[color] ?? CLASS_COLORS.slate

  return (
    <div className="flex flex-col gap-6">
      {sections.map((section) => (
        <section key={section.topicId ?? 'loose'} className="flex flex-col gap-3" aria-label={section.title ?? 'Classwork'}>
          {section.title && <h3 className="font-display text-lg font-semibold text-slate-900">{section.title}</h3>}
          {section.items.map((item) => {
            const Icon = ICONS[item.kind] ?? DocumentTextIcon
            return (
              <Link
                key={item.itemId}
                href={hrefFor(item)}
                className={`flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[14px] border bg-white px-4 py-3.5 text-slate-900 transition-colors ${
                  item.status === 'missing' ? MISSING_BORDER : BORDER[tone]
                }`}
              >
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${palette.tint} ${palette.ink}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-[1_1_220px] flex-col gap-0.5">
                  <span className="break-words text-[15px] font-medium">{item.title}</span>
                  <span className={`text-[13px] ${item.status === 'missing' ? 'text-rose-700' : tone === 'parent' ? 'text-stone-500' : 'text-slate-500'}`}>
                    {classworkMeta(item, now)}
                  </span>
                </span>
                <WorkStatusPill label={classworkPill(item)} />
              </Link>
            )
          })}
        </section>
      ))}
    </div>
  )
}
