// src/components/classes/classwork/ItemRow.tsx
// One classwork item in the Classwork tab (the Teacher-Classwork board): its
// kind's icon tile, the title and the meta line ("Due Fri, Oct 16 · 12
// turned in · 2 missing · 8 not yet"), the grade line ("Homework · out of
// 10"), a pill (Draft, Scheduled, "12 to review", Published, Upcoming,
// Posted) and the ⋮ menu. The row opens where the kind is worked on.
'use client'

import type { ComponentType, SVGProps } from 'react'
import Link from 'next/link'
import { BookmarkIcon, ClipboardDocumentCheckIcon, ClipboardDocumentListIcon, DocumentTextIcon } from '@heroicons/react/24/outline'
import { itemGradeLine, itemMeta, itemPill, itemRowHref } from '@/lib/classworkRows'
import type { ItemKind, ItemSummary } from '@/services/types/classwork'
import ItemRowMenu from './ItemRowMenu'

const KIND_TILES: Record<ItemKind, { icon: ComponentType<SVGProps<SVGSVGElement>>; tile: string; ink: string }> = {
  assessment: { icon: ClipboardDocumentListIcon, tile: 'bg-blue-100', ink: 'text-blue-800' },
  assignment: { icon: DocumentTextIcon, tile: 'bg-teal-100', ink: 'text-teal-800' },
  quiz: { icon: ClipboardDocumentCheckIcon, tile: 'bg-indigo-100', ink: 'text-indigo-800' },
  material: { icon: BookmarkIcon, tile: 'bg-slate-100', ink: 'text-slate-600' },
}

/** A kind's icon in its colored tile (round in rows, rounded square in menus and headers). */
export function KindTile({ kind, shape = 'round', size = 40 }: { kind: ItemKind; shape?: 'round' | 'square'; size?: number }) {
  const { icon: Icon, tile, ink } = KIND_TILES[kind]
  return (
    <span
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center ${shape === 'round' ? 'rounded-full' : 'rounded-[10px]'} ${tile}`}
      aria-hidden="true"
    >
      <Icon className={`h-5 w-5 ${ink}`} />
    </span>
  )
}

interface ItemRowProps {
  item: ItemSummary
  canEdit: boolean
  onDelete: (item: ItemSummary) => void
}

export default function ItemRow({ item, canEdit, onDelete }: ItemRowProps) {
  const grade = itemGradeLine(item)
  const pill = itemPill(item)
  return (
    <div className="flex flex-wrap items-center gap-3.5 rounded-[14px] border border-slate-200/70 bg-white py-3 pl-4 pr-2.5 transition-colors hover:border-slate-300">
      <KindTile kind={item.kind} />
      <Link href={itemRowHref(item)} className="flex min-w-0 flex-[1_1_260px] flex-col gap-0.5 text-slate-900">
        <span className="truncate text-[15px] font-medium">{item.title}</span>
        <span className="text-[13px] text-slate-500">{itemMeta(item)}</span>
      </Link>
      <span className="flex flex-wrap items-center gap-2">
        {grade && <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs text-slate-700">{grade}</span>}
        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${pill.className}`}>{pill.label}</span>
      </span>
      <ItemRowMenu item={item} canEdit={canEdit} onDelete={() => onDelete(item)} />
    </div>
  )
}
