// src/components/classes/classwork/ItemRowMenu.tsx
// A classwork row's ⋮: Edit, Open (the grading view, for assignments and
// quizzes) and Delete. A read-only class (a past school year) offers Open only.
'use client'

import { useRouter } from 'next/navigation'
import { ArrowTopRightOnSquareIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'
import KebabMenu, { type KebabItem } from '@/components/classes/shared/KebabMenu'
import { classItemHref } from '@/lib/classroomRoutes'
import type { ItemSummary } from '@/services/types/classwork'

interface ItemRowMenuProps {
  item: ItemSummary
  canEdit: boolean
  onDelete: () => void
}

export default function ItemRowMenu({ item, canEdit, onDelete }: ItemRowMenuProps) {
  const router = useRouter()
  const gradable = item.kind === 'assignment' || item.kind === 'quiz'
  const items: KebabItem[] = []
  if (canEdit) {
    items.push({ key: 'edit', label: 'Edit', icon: PencilSquareIcon, onSelect: () => router.push(classItemHref(item.classId, item.itemId, 'edit')) })
  }
  if (gradable) {
    items.push({ key: 'open', label: 'Open', icon: ArrowTopRightOnSquareIcon, onSelect: () => router.push(classItemHref(item.classId, item.itemId)) })
  }
  if (canEdit) {
    items.push({ key: 'delete', label: 'Delete', icon: TrashIcon, tone: 'danger', separatorBefore: true, onSelect: onDelete })
  }
  return <KebabMenu label={`Edit, open or delete ${item.title}`} items={items} width={180} />
}
