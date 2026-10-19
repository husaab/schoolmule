'use client'

// Staff inbox: every parent conversation across the classes the caller
// teaches, and the announcements those classes receive. Admins see every
// thread and post in the school here and get the oversight table under
// Admin Panel as well.

import React, { Suspense, useEffect, useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import StatTile from '@/components/ui/StatTile'
import MessagingInbox from '@/components/messaging/MessagingInbox'
import MessagesTabs, { useMessagesTab } from '@/components/messaging/MessagesTabs'
import AnnouncementsPanel from '@/components/announcements/AnnouncementsPanel'
import { getAllClasses } from '@/services/classService'
import { getTermsBySchool } from '@/services/termService'
import SearchableSelect from '@/components/ui/SearchableSelect'
import { classPickerOptions, currentTermClasses } from '@/lib/classListFilters'
import type { ClassPayload } from '@/services/types/class'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import type { SenderRole } from '@/services/types/messaging'
import { useFilterParams } from '@/hooks/useFilterParams'

const StaffMessagesBody: React.FC<{ classes: ClassPayload[]; activeTermName?: string; role: SenderRole }> = ({ classes, activeTermName, role }) => {
  const summary = useMessagingStore((s) => s.summary)
  const [tab, setTab] = useMessagesTab('conversations')
  // The class scope lives in the URL (?classId=), shared with the gradebook's
  // "Messages" deep link, so it survives Back and a sidebar re-click.
  const { get, setParams } = useFilterParams()
  const classId = get('classId')
  const setClassId = (next: string) => setParams({ classId: next || null })
  // Only the active term's classes (each class exists once per term); a
  // deep-linked class from another term stays selectable, labelled by term.
  const classOptions = classPickerOptions(currentTermClasses(classes, activeTermName, classId), activeTermName)

  return (
    <>
      <MessagesTabs
        tone="staff"
        active={tab}
        onChange={setTab}
        counts={{ conversations: summary.unreadConversations, announcements: summary.unreadAnnouncements }}
      />
      {tab === 'announcements' ? (
        <AnnouncementsPanel
          tone="staff"
          classes={classOptions}
          presetClassId={classId || undefined}
          fillHeight
        />
      ) : (
        <MessagingInbox
          tone="staff"
          role={role}
          fixedFilters={classId ? { classId } : undefined}
          newMessageClassId={classId || undefined}
          fillHeight
          emptyHint={
            classes.length === 0
              ? 'You are not assigned to any class this year.'
              : 'Parents start conversations from their grades page; you can start one from a class gradebook or the New message button.'
          }
          listHeaderSlot={
            classes.length > 0 ? (
              <SearchableSelect
                size="sm"
                options={classOptions}
                value={classId}
                onChange={setClassId}
                allLabel="All classes"
                searchPlaceholder="Find a class"
              />
            ) : null
          }
        />
      )}
    </>
  )
}

const StaffMessagesPage: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const summary = useMessagingStore((s) => s.summary)
  const loaded = useMessagingStore((s) => s.loaded)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [activeTermName, setActiveTermName] = useState<string | undefined>()

  useEffect(() => {
    if (!user.id || !user.school) return
    let cancelled = false
    getAllClasses(user.school)
      .then((res) => {
        if (cancelled) return
        const mine = (res.data ?? []).filter(
          (c) => user.role === 'ADMIN' || c.teacherId === user.id || c.additionalTeachers?.some((t) => t.teacherId === user.id),
        )
        setClasses(mine)
      })
      .catch(() => setClasses([]))
    getTermsBySchool(user.school)
      .then((res) => {
        if (!cancelled) setActiveTermName(res.data?.find((t) => t.isActive)?.name)
      })
      .catch(() => {
        if (!cancelled) setActiveTermName(undefined)
      })
    return () => {
      cancelled = true
    }
  }, [user.id, user.role, user.school, selectedYearId])

  const role = (user.role as SenderRole) || 'TEACHER'

  return (
    <>
      <Navbar />
      <Sidebar />
      {/* Desktop: the page is exactly one viewport tall and the inbox takes
          whatever the header leaves, so the open chat and its composer are
          always on screen; only the message list scrolls. */}
      <main className="lg:ml-72 pt-20 min-h-screen lg:h-screen flex flex-col bg-slate-50">
        <div className="flex flex-col flex-1 lg:min-h-0 gap-5 p-6 lg:p-8 max-w-[1600px] mx-auto w-full">
          <div className="flex flex-shrink-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <ChatBubbleLeftRightIcon className="h-7 w-7 text-cyan-600" /> Messages
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Conversations with students and parents, and announcements to your classes.
                {summary.needsReply > 0 && ` ${summary.needsReply} ${summary.needsReply === 1 ? 'needs' : 'need'} a reply.`}
              </p>
            </div>
            <div className="grid flex-shrink-0 grid-cols-2 gap-2.5 md:grid-cols-4">
              <StatTile dense label="Needs reply" value={summary.needsReply} tone={summary.needsReply > 0 ? 'warn' : 'neutral'} loading={!loaded} />
              <StatTile dense label="Unread conversations" value={summary.unreadConversations} loading={!loaded} />
              <StatTile dense label="Unread messages" value={summary.unreadMessages} loading={!loaded} />
              <StatTile dense label="New announcements" value={summary.unreadAnnouncements} loading={!loaded} />
            </div>
          </div>

          <Suspense fallback={<div className="h-[520px] lg:h-auto lg:min-h-[420px] lg:flex-1 rounded-2xl border border-slate-200/70 bg-white" />}>
            <StaffMessagesBody classes={classes} activeTermName={activeTermName} role={role} />
          </Suspense>
        </div>
      </main>
    </>
  )
}

export default StaffMessagesPage
