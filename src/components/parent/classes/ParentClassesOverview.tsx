// src/components/parent/classes/ParentClassesOverview.tsx
// The parent's Classes page with "All children" chosen (Parent-Classes and
// Parent-Phone boards): "This week in class", what needs the parent, and a
// card per child. On a phone a row of child chips picks which child's rows
// and card show.
'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Avatar from '@/components/avatar/Avatar'
import LoadError from '@/components/classroom/LoadError'
import NewConversationModal from '@/components/messaging/NewConversationModal'
import EmailPreferencesLink from '@/components/parent/EmailPreferencesLink'
import ChildClassroomCard from '@/components/parent/classes/ChildClassroomCard'
import NeedsYouCard from '@/components/parent/classes/NeedsYouCard'
import { useLoad } from '@/hooks/useLoad'
import { childrenForClassesPage, firstNameOf } from '@/lib/classroomText'
import { acknowledgeAnnouncement } from '@/services/announcementService'
import { getClassroomSummary } from '@/services/parentClassroomService'
import type { NeedsYouAck, NeedsYouMissing } from '@/services/types/parentClassroom'
import type { Thread } from '@/services/types/messaging'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'

interface ParentClassesOverviewProps {
  /** Opens one child's classes (the lens). */
  onOpenChild: (studentId: string) => void
}

export default function ParentClassesOverview({ onOpenChild }: ParentClassesOverviewProps) {
  const router = useRouter()
  const userId = useUserStore((s) => s.user.id)
  const yearId = useSchoolYearStore((s) => s.selectedYearId)
  const notify = useNotificationStore((s) => s.showNotification)
  const bump = useMessagingStore((s) => s.bump)
  const summary = useLoad(userId ? `summary:${userId}:${yearId ?? ''}` : null, () => getClassroomSummary().then((r) => r.data))
  const { patch } = summary
  const [asking, setAsking] = useState<NeedsYouMissing | null>(null)
  const [phoneChild, setPhoneChild] = useState<string | null>(null)

  const data = summary.data
  // Children who sign in first (Parent-Classes board): their week is the one to read.
  const kids = useMemo(() => childrenForClassesPage(data?.children ?? []), [data])
  // The phone shows one child at a time; the first until another chip is tapped.
  const phoneChildId = kids.find((k) => k.studentId === phoneChild)?.studentId ?? kids[0]?.studentId ?? null

  const askPreset = useMemo(
    () => (asking?.teacher ? { studentId: asking.studentId, teacherId: asking.teacher.userId, mode: 'general' as const } : undefined),
    [asking],
  )

  const gotIt = async (item: NeedsYouAck) => {
    try {
      await acknowledgeAnnouncement(item.announcementId)
      patch((d) => ({
        ...d,
        needsYou: d.needsYou.filter((n) => !(n.kind === 'ack' && n.announcementId === item.announcementId)),
      }))
      void bump()
    } catch (err) {
      notify(err instanceof Error && err.message ? err.message : "That couldn't be recorded. Try again.", 'error')
    }
  }

  const onCreated = (thread: Thread) => {
    setAsking(null)
    router.push(`/parent/messages?tab=conversations&thread=${encodeURIComponent(thread.conversation.conversationId)}`)
  }

  if (summary.error && !data) {
    return <LoadError tone="parent" title="We couldn't load the Classes page" message={summary.error.message} onRetry={summary.reload} />
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <h2 className="font-display text-[26px] font-semibold text-slate-900 sm:text-3xl">This week in class</h2>
          <p className="text-[15px] text-stone-600">What your children&apos;s teachers posted, and what needs you.</p>
        </div>
        <EmailPreferencesLink />
      </div>

      {!data ? (
        <div className="flex flex-col gap-5" aria-label="Loading">
          <div className="h-32 animate-pulse rounded-[18px] bg-stone-100" />
          <div className="h-72 animate-pulse rounded-[18px] bg-stone-100" />
        </div>
      ) : (
        <>
          {kids.length > 1 && (
            <div className="flex gap-2 overflow-x-auto md:hidden" role="group" aria-label="Child">
              {kids.map((k) => {
                const on = k.studentId === phoneChildId
                return (
                  <button
                    key={k.studentId}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setPhoneChild(k.studentId)}
                    className={`flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-[15px] ${
                      on ? 'border-amber-200 bg-amber-50 font-medium text-slate-900' : 'border-stone-200 bg-white text-slate-700'
                    }`}
                  >
                    <Avatar student name={k.name} avatar={k.avatar} photoUrl={k.photoUrl} size={32} />
                    {firstNameOf(k.name)}
                  </button>
                )
              })}
            </div>
          )}

          <NeedsYouCard
            items={data.needsYou}
            kids={kids}
            onGotIt={gotIt}
            onAsk={setAsking}
            phoneChildId={kids.length > 1 ? phoneChildId : null}
          />

          {kids.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-10 text-center text-[15px] text-stone-500">
              No children are linked to your account for this school year.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))]">
              {kids.map((k) => (
                <ChildClassroomCard
                  key={k.studentId}
                  child={k}
                  onOpen={() => onOpenChild(k.studentId)}
                  className={kids.length > 1 && k.studentId !== phoneChildId ? 'hidden md:flex' : 'flex'}
                />
              ))}
            </div>
          )}
        </>
      )}

      <NewConversationModal
        isOpen={asking !== null}
        onClose={() => setAsking(null)}
        tone="parent"
        role="PARENT"
        classId={asking?.classId}
        preset={askPreset}
        onCreated={onCreated}
      />
    </div>
  )
}
