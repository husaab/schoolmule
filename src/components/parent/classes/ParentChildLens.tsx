// src/components/parent/classes/ParentChildLens.tsx
// A parent looking at one child's classes the way the child sees them
// (Parent-Lens board). It is read-only: the parent can read the Stream and
// press "Got it", see the child's published grades, and write to the lead
// teacher with the one "Message {teacher}" button; nothing here turns work
// in. `class` and `tab` live in the URL.
'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import ClassTabs from '@/components/classes/page/ClassTabs'
import ChildGradesView from '@/components/classroom/ChildGradesView'
import ClassBannerHeader from '@/components/classroom/ClassBannerHeader'
import ClassNavList from '@/components/classroom/ClassNavList'
import LoadError from '@/components/classroom/LoadError'
import MessageTeacherButton from '@/components/classroom/MessageTeacherButton'
import NothingHere from '@/components/classroom/NothingHere'
import StreamFeed from '@/components/classroom/StreamFeed'
import NewConversationModal from '@/components/messaging/NewConversationModal'
import LensBanner from '@/components/parent/classes/LensBanner'
import ParentClassworkTab from '@/components/parent/classes/ParentClassworkTab'
import { useFilterParams, type FilterPatch } from '@/hooks/useFilterParams'
import { useClassTermGrades } from '@/hooks/useClassTermGrades'
import { useLoad } from '@/hooks/useLoad'
import { classPageMeta, firstNameOf, missingFlag, noMarksNote, pickClass } from '@/lib/classroomText'
import { openSignedUrl } from '@/lib/openSignedUrl'
import {
  PARENT_CLASS_TABS,
  parentClassesHref,
  parentItemHref,
  parseParentClassTab,
  type ParentClassTab,
} from '@/lib/portalRoutes'
import {
  acknowledgeAnnouncement,
  getAnnouncementAttachmentUrl,
  markAnnouncementRead,
  unacknowledgeAnnouncement,
} from '@/services/announcementService'
import { getLensClass, getLensClasses, getLensGrades, getLensStream } from '@/services/parentClassroomService'
import type { Thread } from '@/services/types/messaging'
import type { StudentAnnouncement, StudentAttachment, StudentClassCard, StudentClassHeader } from '@/services/types/studentPortal'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { ALL_CHILDREN, useSelectedChildStore, type ChildLite } from '@/store/useSelectedChildStore'

interface ParentChildLensProps {
  child: ChildLite
}

function StreamBody({ studentId, classId }: { studentId: string; classId: string }) {
  const notify = useNotificationStore((s) => s.showNotification)
  const bump = useMessagingStore((s) => s.bump)
  const yearId = useSchoolYearStore((s) => s.selectedYearId)
  const stream = useLoad(`lens-stream:${studentId}:${classId}:${yearId ?? ''}`, () => getLensStream(studentId, classId).then((r) => r.data))
  const { patch } = stream

  const setPost = useCallback(
    (id: string, change: Partial<StudentAnnouncement>) =>
      patch((d) => ({ ...d, announcements: d.announcements.map((a) => (a.announcementId === id ? { ...a, ...change } : a)) })),
    [patch],
  )

  const onSeen = useCallback(
    (post: StudentAnnouncement) => {
      setPost(post.announcementId, { read: true })
      // The parent's own read state, best effort.
      void markAnnouncementRead(post.announcementId).then(() => bump(), () => {})
    },
    [setPost, bump],
  )

  const onAck = useCallback(
    async (post: StudentAnnouncement, acked: boolean) => {
      const before = post.ackedAt
      setPost(post.announcementId, { ackedAt: acked ? new Date().toISOString() : null, read: true })
      try {
        if (acked) {
          const res = await acknowledgeAnnouncement(post.announcementId)
          setPost(post.announcementId, { ackedAt: res.data?.ackedAt ?? new Date().toISOString() })
        } else {
          await unacknowledgeAnnouncement(post.announcementId)
        }
        void bump()
      } catch (err) {
        setPost(post.announcementId, { ackedAt: before })
        notify(err instanceof Error && err.message ? err.message : "That couldn't be recorded. Try again.", 'error')
      }
    },
    [setPost, bump, notify],
  )

  const onOpenAttachment = useCallback(
    async (post: StudentAnnouncement, file: StudentAttachment) => {
      try {
        await openSignedUrl(async () => {
          const res = await getAnnouncementAttachmentUrl(post.announcementId, file.attachmentId)
          if (!res.data?.url) throw new Error("This file couldn't be opened.")
          return res.data.url
        })
      } catch (err) {
        notify(err instanceof Error && err.message ? err.message : "This file couldn't be opened.", 'error')
      }
    },
    [notify],
  )

  if (stream.error && !stream.data) {
    return <LoadError tone="parent" title="We couldn't load the Stream" message={stream.error.message} onRetry={stream.reload} />
  }
  if (!stream.data) return <div className="h-44 animate-pulse rounded-2xl bg-stone-100" aria-label="Loading" />
  return (
    <StreamFeed
      tone="parent"
      announcements={stream.data.announcements}
      notices={stream.data.notices}
      onOpenAttachment={onOpenAttachment}
      onAck={onAck}
      onSeen={onSeen}
      noticeHref={(n) => parentItemHref(studentId, n.itemId)}
    />
  )
}

function GradesBody({ child, header }: { child: ChildLite; header: StudentClassHeader }) {
  const yearId = useSchoolYearStore((s) => s.selectedYearId)
  const grades = useClassTermGrades(`lens-grades:${child.studentId}:${header.classId}:${yearId ?? ''}`, header, (termId) =>
    getLensGrades(child.studentId, termId).then((r) => r.data),
  )
  const lead = header.teachers.find((t) => t.role === 'lead') ?? header.teachers[0] ?? null

  if (grades.error && !grades.data) {
    return <LoadError tone="parent" title="We couldn't load the grades" message={grades.error.message} onRetry={grades.reload} />
  }
  if (!grades.data) return <div className="h-40 animate-pulse rounded-2xl bg-stone-100" aria-label="Loading" />

  const cls = grades.data.classes.find((c) => c.classId === header.classId)
  if (grades.data.usesMarks && !cls) {
    return <p className="rounded-[14px] bg-stone-50 p-[18px] text-[15px] text-stone-700">No grades in {header.subject} yet.</p>
  }
  return (
    <ChildGradesView
      layout="embedded"
      tone="parent"
      grades={{ ...grades.data, classes: cls ? [cls] : [] }}
      selectedClassId={header.classId}
      onSelectClass={() => {}}
      itemHref={(g) => (g.itemId ? parentItemHref(child.studentId, g.itemId) : null)}
      linkOwner={firstNameOf(child.name)}
      footnote={`Grades show here once the teacher publishes them. Missing work counts as 0 until ${firstNameOf(child.name)} hands it in.`}
      teacherOf={() => lead}
      noMarksNote={noMarksNote({ grade: String(child.grade ?? header.grade), teacherName: lead?.name ?? null, owner: { name: child.name } })}
    />
  )
}

export default function ParentChildLens({ child }: ParentChildLensProps) {
  const router = useRouter()
  const selectChild = useSelectedChildStore((s) => s.selectChild)
  const yearId = useSchoolYearStore((s) => s.selectedYearId)
  const filters = useFilterParams({ remember: false })
  const tab = parseParentClassTab(filters.get('tab'))
  const [asking, setAsking] = useState(false)

  // The classes, and whether the child signs in (a child with no login does the work in class).
  const lensClasses = useLoad(`lens-classes:${child.studentId}:${yearId ?? ''}`, () => getLensClasses(child.studentId).then((r) => r.data))
  const classList = lensClasses.data?.classes ?? null
  const signsIn = lensClasses.data?.signsIn ?? true
  const selected: StudentClassCard | null = classList ? pickClass(classList, filters.get('class')) : null
  const page = useLoad(
    selected ? `lens-class:${child.studentId}:${selected.classId}:${yearId ?? ''}` : null,
    () => getLensClass(child.studentId, selected!.classId).then((r) => r.data),
  )

  const goBack = () => {
    selectChild(ALL_CHILDREN)
    router.replace(parentClassesHref())
  }

  const selectTab = (next: string) => {
    const nextTab = parseParentClassTab(next)
    const patch: FilterPatch = { tab: nextTab === 'stream' ? null : nextTab }
    filters.setParams(patch)
  }

  const teacher = page.data?.class.messageTeacher ?? null
  const teacherId = teacher?.userId ?? null
  const askPreset = useMemo(
    () => (teacherId ? { studentId: child.studentId, teacherId, mode: 'general' as const } : undefined),
    [teacherId, child.studentId],
  )

  const onCreated = (thread: Thread) => {
    setAsking(false)
    router.push(`/parent/messages?tab=conversations&thread=${encodeURIComponent(thread.conversation.conversationId)}`)
  }

  const first = firstNameOf(child.name)

  return (
    <div className="flex flex-col gap-6">
      <LensBanner childName={child.name} onBack={goBack} />

      {lensClasses.error && !classList ? (
        <LoadError tone="parent" title={`We couldn't load ${first}'s classes`} message={lensClasses.error.message} onRetry={lensClasses.reload} />
      ) : !classList ? (
        <div className="flex flex-wrap gap-6" aria-label="Loading">
          <div className="h-64 flex-1 basis-60 animate-pulse rounded-[18px] bg-stone-100" />
          <div className="h-64 flex-[999_1_520px] animate-pulse rounded-[18px] bg-stone-100" />
        </div>
      ) : classList.length === 0 || !selected ? (
        <NothingHere message={`${first} isn't in any classes this term.`} />
      ) : (
        <div className="flex flex-wrap items-start gap-6">
          <div className="min-w-0 flex-1 basis-full md:basis-60">
            <ClassNavList
              tone="parent"
              title={`${first}'s classes`}
              classes={classList.map((c) => ({
                classId: c.classId,
                subject: c.subject,
                iconUrl: c.identity.iconUrl,
                flag: missingFlag(c.missingCount),
              }))}
              selectedId={selected.classId}
              hrefFor={(id) => parentClassesHref({ classId: id, tab })}
            />
          </div>

          <section className="flex min-w-0 flex-[999_1_520px] basis-full flex-col overflow-hidden rounded-[18px] border border-stone-200 bg-white md:basis-[520px]">
            {page.error && !page.data ? (
              <div className="p-5">
                <LoadError tone="parent" title="We couldn't open this class" message={page.error.message} onRetry={page.reload} />
              </div>
            ) : !page.data ? (
              <div className="h-64 animate-pulse bg-stone-100" aria-label="Loading" />
            ) : (
              <>
                <ClassBannerHeader
                  variant="card"
                  identity={page.data.class.identity}
                  title={page.data.class.subject}
                  meta={classPageMeta(page.data.class.grade, page.data.class.teachers)}
                  actions={
                    teacher?.userId ? (
                      <MessageTeacherButton tone="parent" teacher={teacher} onClick={() => setAsking(true)} />
                    ) : undefined
                  }
                >
                  <ClassTabs
                    tabs={PARENT_CLASS_TABS}
                    active={tab}
                    hrefFor={(t) => parentClassesHref({ classId: selected.classId, tab: t as ParentClassTab })}
                    onSelect={selectTab}
                    activeClassName="bg-white text-slate-900"
                  />
                </ClassBannerHeader>

                <div className="flex flex-col gap-3.5 p-5 sm:px-6 sm:pb-[26px] sm:pt-[22px]">
                  {tab === 'stream' && <StreamBody key={selected.classId} studentId={child.studentId} classId={selected.classId} />}
                  {tab === 'classwork' && (
                    <ParentClassworkTab
                      key={selected.classId}
                      studentId={child.studentId}
                      classId={selected.classId}
                      childName={child.name}
                      color={page.data.class.identity.color}
                      teacherName={teacher?.name ?? null}
                      signsIn={signsIn}
                    />
                  )}
                  {tab === 'grades' && <GradesBody key={selected.classId} child={child} header={page.data.class} />}
                </div>
              </>
            )}
          </section>
        </div>
      )}

      <NewConversationModal
        isOpen={asking}
        onClose={() => setAsking(false)}
        tone="parent"
        role="PARENT"
        classId={selected?.classId}
        preset={askPreset}
        onCreated={onCreated}
      />
    </div>
  )
}
