'use client'

// One piece of the child's classwork, read-only (the parent's lens): the
// teacher's instructions and files, the child's work (files they added, the
// answer they typed), where it stands, the grade and comment once the teacher
// has published them, and a link to the private comments between the child and
// the teacher. A parent cannot turn work in, change it or write here: the card
// is given no actions, and the server's lens routes answer reads only.

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { AcademicCapIcon, ArrowLeftIcon } from '@heroicons/react/24/outline'
import ItemDetail from '@/components/classroom/ItemDetail'
import LoadError from '@/components/classroom/LoadError'
import LensBanner from '@/components/parent/classes/LensBanner'
import ParentPageShell from '@/components/parent/ParentPageShell'
import YourWorkCard from '@/components/studentPortal/work/YourWorkCard'
import { useLoad } from '@/hooks/useLoad'
import { firstNameOf } from '@/lib/classroomText'
import { parentCommentsLine, turnInModeOf } from '@/lib/itemPageText'
import { parentClassesHref } from '@/lib/portalRoutes'
import { isApiError } from '@/services/apiClient'
import { getLensFileUrl, getLensItem } from '@/services/parentClassroomService'
import type { Attachment } from '@/services/types/classwork'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { ALL_CHILDREN, useChildStoreHydrated, useSelectedChildStore } from '@/store/useSelectedChildStore'

function ParentItemContent() {
  const { studentId, itemId } = useParams() as { studentId: string; itemId: string }
  const router = useRouter()
  const yearId = useSchoolYearStore((s) => s.selectedYearId)
  const hydrated = useChildStoreHydrated()
  const kids = useSelectedChildStore((s) => s.children)
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId)
  const selectChild = useSelectedChildStore((s) => s.selectChild)
  const child = kids.find((c) => c.studentId === studentId) ?? null

  // Back to the classes opens the lens of the chosen child: make sure that is this child (a link from an email).
  useEffect(() => {
    if (hydrated && child && selectedChildId !== studentId) selectChild(studentId)
  }, [hydrated, child, selectedChildId, studentId, selectChild])

  const item = useLoad(`lens-item:${studentId}:${itemId}:${yearId ?? ''}`, () => getLensItem(studentId, itemId).then((r) => r.data))
  const data = item.data

  // Attachment links are signed for an hour: ask for a fresh one when a file is previewed.
  const resolveAttachmentUrl = async (a: Attachment): Promise<string> => {
    if (a.kind === 'link') {
      if (!a.url) throw new Error("This link couldn't be opened.")
      return a.url
    }
    const fresh = (await getLensItem(studentId, itemId)).data
    const url = fresh.attachments.find((x) => x.attachmentId === a.attachmentId)?.url
    if (!url) throw new Error("This file couldn't be opened.")
    return url
  }

  const goAllChildren = () => {
    selectChild(ALL_CHILDREN)
    router.replace(parentClassesHref())
  }

  const name = child?.name ?? ''
  const first = firstNameOf(name)

  return (
    <ParentPageShell title="Classes" badge={{ icon: AcademicCapIcon, label: 'Parent' }}>
      <div className="flex flex-col gap-5">
        {child && <LensBanner childName={child.name} onBack={goAllChildren} />}

        {item.error && !data ? (
          <LoadError
            tone="parent"
            title={isApiError(item.error) && item.error.status === 404 ? "We couldn't find this" : "We couldn't open this"}
            message={isApiError(item.error) && item.error.status === 404 ? "It may have been taken down, or it isn't one of your child's." : item.error.message}
            onRetry={isApiError(item.error) && item.error.status === 404 ? undefined : item.reload}
          >
            <Link href={parentClassesHref()} className="rounded-xl bg-amber-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-800">
              Back to classes
            </Link>
          </LoadError>
        ) : !data ? (
          <div className="flex flex-wrap gap-7" aria-label="Loading">
            <div className="h-64 min-w-0 flex-[999_1_480px] animate-pulse rounded-2xl bg-stone-100" />
            <div className="h-64 flex-1 basis-[300px] animate-pulse rounded-2xl bg-stone-100" />
          </div>
        ) : (
          <>
            <Link
              href={parentClassesHref({ classId: data.classId, tab: 'classwork' })}
              className="inline-flex min-h-11 items-center gap-2.5 self-start rounded-xl py-2 pr-3 text-[15px] font-medium text-stone-700 hover:text-amber-800"
            >
              <ArrowLeftIcon className="h-5 w-5" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element -- static class icon */}
              <img src={data.identity.iconUrl} alt="" className="h-6 w-6 rounded-[7px]" />
              Back to {data.subject}
            </Link>

            <div className="flex flex-wrap items-start gap-7">
              <div className={`min-w-0 flex-[999_1_480px] basis-full lg:basis-[480px] ${data.kind === 'material' ? 'max-w-3xl' : ''}`}>
                <ItemDetail item={data} resolveAttachmentUrl={resolveAttachmentUrl} />
              </div>

              {data.kind !== 'material' && (
                <aside className="flex min-w-0 flex-1 basis-full flex-col gap-4 lg:basis-[300px]">
                  <YourWorkCard
                    item={data}
                    owner={{ name }}
                    userId={null}
                    actions={null}
                    readOnlyNote={`Only ${first || 'your child'} can turn work in. You can see what ${first || 'your child'} added.`}
                    mode={turnInModeOf(data)}
                    resolveFileUrl={async (file) => (await getLensFileUrl(studentId, file.fileId)).data.url}
                    onItem={() => {}}
                    onFiles={() => {}}
                    onReload={item.reload}
                  />
                  {data.thread && data.thread.messageCount > 0 && (
                    <p className="rounded-2xl border border-stone-200 bg-white px-[18px] py-3.5 text-[13px] leading-relaxed text-stone-600">
                      {parentCommentsLine(name, data.teacher?.name ?? null, data.thread.messageCount)} ·{' '}
                      <Link
                        href={`/parent/messages?tab=conversations&thread=${encodeURIComponent(data.thread.conversationId)}`}
                        className="font-medium text-amber-800 underline-offset-2 hover:underline"
                      >
                        read
                      </Link>
                    </p>
                  )}
                </aside>
              )}
            </div>
          </>
        )}
      </div>
    </ParentPageShell>
  )
}

export default function ParentItemPage() {
  return (
    <Suspense fallback={null}>
      <ParentItemContent />
    </Suspense>
  )
}
