// File: src/app/(user)/classes/[classId]/items/[itemId]/edit/page.tsx
// Edit a piece of classwork (any kind), or carry on with a draft. ?from=grades
// sends Close and Save back to Grades.
'use client'

import { Suspense } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import ItemFormScreen from '@/components/classes/items/ItemFormScreen'

function EditItemContent() {
  const { classId, itemId } = useParams() as { classId: string; itemId: string }
  const from = useSearchParams().get('from') === 'grades' ? 'grades' : null
  return <ItemFormScreen classId={classId} itemId={itemId} from={from} />
}

export default function EditItemPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <EditItemContent />
    </Suspense>
  )
}
