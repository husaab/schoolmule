// File: src/app/(user)/classes/[classId]/items/new/page.tsx
// A new piece of classwork: ?kind=assessment|assignment|quiz|material, with
// an optional starting ?topic= and ?from=grades (Grades' "Create
// assessment"). The params are read once: an autosaved draft moves the URL
// to its edit page without leaving this form.
'use client'

import { Suspense, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import ItemFormScreen from '@/components/classes/items/ItemFormScreen'
import { parseKindFilter } from '@/lib/classworkRows'

function NewItemContent() {
  const { classId } = useParams() as { classId: string }
  const searchParams = useSearchParams()
  const [initial] = useState(() => ({
    kind: parseKindFilter(searchParams.get('kind')),
    topic: searchParams.get('topic'),
    from: searchParams.get('from') === 'grades' ? ('grades' as const) : null,
  }))
  return <ItemFormScreen classId={classId} kind={initial.kind} defaultTopicId={initial.topic} from={initial.from} />
}

export default function NewItemPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-slate-50" />}>
      <NewItemContent />
    </Suspense>
  )
}
