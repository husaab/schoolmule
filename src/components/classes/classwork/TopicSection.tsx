// src/components/classes/classwork/TopicSection.tsx
// One topic's section in Classwork (the Teacher-Classwork board): its name
// with a ⋮ (Rename, Move up, Move down, Delete topic), then its items. The
// section of items with no topic has no menu.
'use client'

import { ArrowDownIcon, ArrowUpIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import KebabMenu, { type KebabItem } from '@/components/classes/shared/KebabMenu'
import type { ClassworkSection } from '@/lib/classworkRows'
import type { ItemSummary, Topic } from '@/services/types/classwork'
import ItemRow from './ItemRow'

interface TopicSectionProps {
  section: ClassworkSection
  /** Show the heading (a class with no topics lists its items bare). */
  showHeading: boolean
  canEdit: boolean
  isFirst: boolean
  isLast: boolean
  /** A move is being saved: the menu waits. */
  busy?: boolean
  onRename: (topic: Topic) => void
  onMove: (topic: Topic, direction: -1 | 1) => void
  onDelete: (topic: Topic) => void
  onDeleteItem: (item: ItemSummary) => void
}

export default function TopicSection({
  section,
  showHeading,
  canEdit,
  isFirst,
  isLast,
  busy = false,
  onRename,
  onMove,
  onDelete,
  onDeleteItem,
}: TopicSectionProps) {
  const { topic, items } = section
  const menu: KebabItem[] = []
  if (topic && canEdit) {
    menu.push({ key: 'rename', label: 'Rename', icon: PencilSquareIcon, onSelect: () => onRename(topic) })
    if (!isFirst) menu.push({ key: 'up', label: 'Move up', icon: ArrowUpIcon, onSelect: () => onMove(topic, -1) })
    if (!isLast) menu.push({ key: 'down', label: 'Move down', icon: ArrowDownIcon, onSelect: () => onMove(topic, 1) })
    menu.push({ key: 'delete', label: 'Delete topic', icon: TrashIcon, tone: 'danger', separatorBefore: true, onSelect: () => onDelete(topic) })
  }

  return (
    <section className="flex flex-col gap-2.5" aria-label={topic?.name ?? 'No topic'}>
      {showHeading && (
        <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <h3 className="font-display text-[22px] font-semibold text-slate-900">{topic?.name ?? 'No topic'}</h3>
          {menu.length > 0 && <KebabMenu label={`Rename or delete topic ${topic?.name ?? ''}`} items={menu} busy={busy} width={180} />}
        </div>
      )}
      {items.length === 0 ? (
        <p className="px-1 py-2 text-sm text-slate-500">Nothing in this topic yet.</p>
      ) : (
        items.map((item) => <ItemRow key={item.itemId} item={item} canEdit={canEdit} onDelete={onDeleteItem} />)
      )}
    </section>
  )
}
