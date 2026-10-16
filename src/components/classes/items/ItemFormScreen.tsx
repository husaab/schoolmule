// src/components/classes/items/ItemFormScreen.tsx
// Loads what the item form needs (the class, its classwork context, and the
// item when editing) and shows the form, or why it can't be shown: still
// loading, gone, not this teacher's class, a past school year (read-only),
// or a kind that can't be created yet.
'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import Spinner from '@/components/Spinner'
import { useLoad } from '@/hooks/useLoad'
import { classHref } from '@/lib/classroomRoutes'
import { QUIZZES_ENABLED } from '@/lib/classroomFeatures'
import { isApiError } from '@/services/apiClient'
import { getClassPage } from '@/services/classroomService'
import { getClasswork, getItem } from '@/services/classworkService'
import type { ClassPageData } from '@/services/types/classroom'
import type { ClassworkData, Item, ItemKind } from '@/services/types/classwork'
import ItemForm from './ItemForm'

interface ItemFormScreenProps {
  classId: string
  /** Editing this item; omitted for a new one. */
  itemId?: string | null
  /** A new item's kind (from ?kind=); null when the link named none we know. */
  kind?: ItemKind | null
  defaultTopicId?: string | null
  from?: 'grades' | null
}

interface Loaded {
  page: ClassPageData
  classwork: ClassworkData
  item: Item | null
}

function Notice({ classId, from, children }: { classId: string; from?: 'grades' | null; children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md rounded-2xl border border-slate-200/70 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
          <ClipboardDocumentListIcon className="h-7 w-7 text-slate-400" aria-hidden="true" />
        </div>
        <div className="mb-6 text-slate-600">{children}</div>
        <Link
          href={from === 'grades' ? classHref(classId, 'grades') : classHref(classId, 'classwork')}
          className="inline-flex rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 font-medium text-white hover:from-cyan-600 hover:to-teal-600"
        >
          {from === 'grades' ? 'Back to Grades' : 'Back to Classwork'}
        </Link>
      </div>
    </div>
  )
}

export default function ItemFormScreen({ classId, itemId = null, kind = null, defaultTopicId = null, from = null }: ItemFormScreenProps) {
  const scope = `${classId}:${itemId ?? 'new'}`
  const { data, error, loading, reload } = useLoad<Loaded>(scope, async () => {
    const [page, classwork, item] = await Promise.all([
      getClassPage(classId),
      getClasswork(classId),
      itemId ? getItem(itemId) : Promise.resolve(null),
    ])
    return { page: page.data, classwork: classwork.data, item: item?.data ?? null }
  })

  if (loading || (!data && !error)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!data) {
    const status = isApiError(error) ? error.status : null
    if (status === 404 || status === 400) {
      return (
        <Notice classId={classId} from={from}>
          {itemId ? "This classwork doesn't exist, or it was deleted." : "This class doesn't exist, or it was deleted."}
        </Notice>
      )
    }
    if (status === 403) {
      return (
        <Notice classId={classId} from={from}>
          You don&apos;t teach this class, so its classwork can&apos;t be changed from your account.
        </Notice>
      )
    }
    return (
      <Notice classId={classId} from={from}>
        <p className="mb-4">{error?.message || "This couldn't be loaded."}</p>
        <button
          type="button"
          onClick={reload}
          className="cursor-pointer rounded-xl bg-slate-100 px-5 py-2.5 font-medium text-slate-700 hover:bg-slate-200"
        >
          Try again
        </button>
      </Notice>
    )
  }

  if (data.item && data.item.classId !== classId) {
    return (
      <Notice classId={classId} from={from}>
        This classwork belongs to another class.
      </Notice>
    )
  }
  if (!data.page.permissions.canEdit) {
    return (
      <Notice classId={classId} from={from}>
        This class is from a past school year, so it is read-only.
      </Notice>
    )
  }

  const formKind = data.item?.kind ?? kind
  if (!formKind) {
    return (
      <Notice classId={classId} from={from}>
        Choose what to make from Classwork → Create.
      </Notice>
    )
  }
  if (!data.item && formKind === 'quiz' && !QUIZZES_ENABLED) {
    return (
      <Notice classId={classId} from={from}>
        Quizzes aren&apos;t available yet. Make an assignment for now.
      </Notice>
    )
  }

  return (
    <ItemForm
      key={data.item?.itemId ?? `new-${formKind}`}
      classId={classId}
      kind={formKind}
      page={data.page}
      classwork={data.classwork}
      item={data.item}
      defaultTopicId={data.classwork.topics.some((t) => t.topicId === defaultTopicId) ? defaultTopicId : null}
      from={from}
    />
  )
}
