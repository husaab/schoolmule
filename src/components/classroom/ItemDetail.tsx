// src/components/classroom/ItemDetail.tsx
// The read-only top of a classwork item (Student-Assignment board), the same
// for a student, a parent and a material: the kind's icon in the class color,
// the title, "{teacher} · posted {date}", the points, when it is due, the
// teacher's instructions and the attachments (AttachmentList opens them in
// place). What the student does with it ("Your work") sits beside it.
'use client'

import {
  BookmarkIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import AttachmentList from '@/components/classroom/AttachmentList'
import { CLASS_COLORS } from '@/lib/classIdentity'
import { itemDueLine, itemStatusOf, pointsText, postedLine } from '@/lib/itemPageText'
import type { Attachment } from '@/services/types/classwork'
import type { StudentItem } from '@/services/types/studentPortal'

interface ItemDetailProps {
  item: StudentItem
  /** A fresh link for one attachment (the caller's route: student or parent). */
  resolveAttachmentUrl: (attachment: Attachment) => Promise<string>
  now?: Date
}

const ICONS = {
  assignment: DocumentTextIcon,
  quiz: ClipboardDocumentListIcon,
  material: BookmarkIcon,
  assessment: ClipboardDocumentCheckIcon,
}

const DUE_TONE = { amber: 'text-amber-800', rose: 'text-rose-700', slate: 'text-slate-600' }

export default function ItemDetail({ item, resolveAttachmentUrl, now = new Date() }: ItemDetailProps) {
  const color = CLASS_COLORS[item.identity.color] ?? CLASS_COLORS.slate
  const Icon = ICONS[item.kind] ?? DocumentTextIcon
  const due = itemDueLine(item, itemStatusOf(item), now)
  const points = pointsText(item.points)
  const posted = postedLine(item.teacher?.name ?? null, item.postedAt, now)
  const paragraphs = (item.instructions ?? '').split(/\n{2,}/).filter((p) => p.trim())

  return (
    <article className="flex min-w-0 flex-col gap-5">
      <div className="flex items-start gap-4">
        <span className={`flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full ${color.tint} ${color.ink}`}>
          <Icon className="h-[26px] w-[26px]" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          <h2 className="break-words font-display text-[26px] font-semibold leading-[1.15] text-slate-900 sm:text-[32px]">{item.title}</h2>
          {posted && (
            <span className="flex items-center gap-2 text-[15px] text-slate-600">
              {item.teacher && <Avatar name={item.teacher.name} avatar={item.teacher.avatar} photoUrl={item.teacher.photoUrl} size={24} />}
              {posted}
            </span>
          )}
          {(points || due) && (
            <span className="flex flex-wrap gap-x-4 gap-y-1 text-[15px]">
              {points && <span className="text-slate-800">{points}</span>}
              {due && <span className={`font-medium ${DUE_TONE[due.tone]}`}>{due.text}</span>}
            </span>
          )}
        </div>
      </div>

      {(paragraphs.length > 0 || item.attachments.length > 0) && <div className="h-px bg-slate-200" />}

      {paragraphs.length > 0 && (
        <div className="flex flex-col gap-3 text-[17px] leading-[1.65] text-slate-800">
          {paragraphs.map((p, i) => (
            <p key={i} className="whitespace-pre-wrap break-words">
              {p}
            </p>
          ))}
        </div>
      )}

      <AttachmentList attachments={item.attachments} resolveUrl={resolveAttachmentUrl} />
    </article>
  )
}
