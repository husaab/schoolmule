// src/components/classes/stream/StreamNoticeRow.tsx
// A classwork notice in the Stream: "New assignment: Plant cell diagram" with
// "Oct 13 · due Fri, Oct 16 · 12 of 22 turned in", linking to the item (an
// assignment's grading view, a material's edit page).
'use client'

import type { ComponentType, SVGProps } from 'react'
import Link from 'next/link'
import {
  BookOpenIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline'
import { CLASS_COLORS } from '@/lib/classIdentity'
import { teacherItemHref } from '@/lib/classroomRoutes'
import { noticeHeadline, noticeMeta } from '@/lib/classStream'
import type { ClassColor, ItemKind, StreamNotice } from '@/services/types/classroom'

const ICONS: Record<ItemKind, ComponentType<SVGProps<SVGSVGElement>>> = {
  assignment: DocumentTextIcon,
  quiz: ClipboardDocumentCheckIcon,
  material: BookOpenIcon,
  assessment: ClipboardDocumentListIcon,
}

interface StreamNoticeRowProps {
  notice: StreamNotice
  /** The class the item belongs to (the link target). */
  classId: string
  /** The class color the icon is tinted with. */
  color?: ClassColor
}

export default function StreamNoticeRow({ notice, classId, color = 'teal' }: StreamNoticeRowProps) {
  const tone = CLASS_COLORS[color] ?? CLASS_COLORS.teal
  const Icon = ICONS[notice.kind] ?? DocumentTextIcon
  return (
    <Link
      href={teacherItemHref(classId, { itemId: notice.itemId, kind: notice.kind })}
      className="flex items-center gap-3.5 rounded-2xl border border-slate-200/70 bg-white px-5 py-4 text-slate-900 transition-colors hover:border-slate-300 hover:bg-slate-50/60"
    >
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${tone.tint}`}>
        <Icon className={`h-5 w-5 ${tone.ink}`} aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm">
          <strong className="font-medium">{noticeHeadline(notice.kind)}:</strong> {notice.title}
        </span>
        <span className="text-xs text-slate-500">{noticeMeta(notice)}</span>
      </span>
      <ChevronRightIcon className="h-[18px] w-[18px] shrink-0 text-slate-400" aria-hidden="true" />
    </Link>
  )
}
