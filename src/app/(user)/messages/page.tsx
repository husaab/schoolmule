'use client'

// Staff inbox: every parent conversation across the classes the caller
// teaches (admins: every thread they have joined, plus the oversight table
// under Admin Panel for the rest).

import React, { Suspense, useEffect, useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import StatTile from '@/components/ui/StatTile'
import MessagingInbox from '@/components/messaging/MessagingInbox'
import { getAllClasses } from '@/services/classService'
import type { ClassPayload } from '@/services/types/class'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import type { SenderRole } from '@/services/types/messaging'

const StaffMessagesPage: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const summary = useMessagingStore((s) => s.summary)
  const loaded = useMessagingStore((s) => s.loaded)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const [classes, setClasses] = useState<ClassPayload[]>([])
  const [classId, setClassId] = useState('')

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
    return () => {
      cancelled = true
    }
  }, [user.id, user.role, user.school, selectedYearId])

  const role = (user.role as SenderRole) || 'TEACHER'

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-[1600px] mx-auto space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
                <ChatBubbleLeftRightIcon className="h-7 w-7 text-cyan-600" /> Messages
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Conversations with parents, each tied to the assessment it is about.
                {summary.needsReply > 0 && ` ${summary.needsReply} ${summary.needsReply === 1 ? 'needs' : 'need'} a reply.`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:max-w-2xl">
            <StatTile label="Needs reply" value={summary.needsReply} tone={summary.needsReply > 0 ? 'warn' : 'neutral'} loading={!loaded} />
            <StatTile label="Unread conversations" value={summary.unreadConversations} loading={!loaded} />
            <StatTile label="Unread messages" value={summary.unreadMessages} loading={!loaded} />
          </div>

          <Suspense fallback={<div className="h-[520px] rounded-2xl border border-slate-200/70 bg-white" />}>
            <MessagingInbox
              tone="staff"
              role={role}
              fixedFilters={classId ? { classId } : undefined}
              newMessageClassId={classId || classes[0]?.classId}
              emptyHint={
                classes.length === 0
                  ? 'You are not assigned to any class this year.'
                  : 'Parents start conversations from their grades page; you can start one from a class gradebook or the New message button.'
              }
              listHeaderSlot={
                classes.length > 0 ? (
                  <label className="block">
                    <span className="sr-only">Class</span>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-200 cursor-pointer"
                    >
                      <option value="">All classes</option>
                      {classes.map((c) => (
                        <option key={c.classId} value={c.classId}>
                          {c.subject} · Gr {c.grade}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null
              }
            />
          </Suspense>
        </div>
      </main>
    </>
  )
}

export default StaffMessagesPage
