'use client'

// My Meetings: a teacher's parent–teacher meetings, day by day. The teacher
// list email links here with ?event=&day= (and &print=1 for Print my day).

import React, { Suspense, useEffect } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import TeacherMeetings from '@/components/meetings/teacher/TeacherMeetings'
import ShowMeHow from '@/components/tours/ShowMeHow'
import { useMeetingsStore } from '@/store/useMeetingsStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useFilterParams } from '@/hooks/useFilterParams'
import { dayShort, joinNames } from '@/lib/meetings'

const MyMeetingsContent: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const { teacherEvents, loading, loaded, error, load, setTeacherEvent } = useMeetingsStore()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const { get, setParams } = useFilterParams()

  useEffect(() => {
    if (user?.id) void load(true)
  }, [user?.id, selectedYearId, load])

  const events = teacherEvents.filter((e) => e.takingPart)
  const event = events.find((e) => e.eventId === get('event')) ?? events[0]
  const today = new Date().toISOString().slice(0, 10)
  const defaultDay = event?.days.find((d) => d.date >= today)?.dayId ?? event?.days[0]?.dayId ?? ''
  const dayId = event?.days.some((d) => d.dayId === get('day')) ? get('day') : defaultDay

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-32 lg:pt-28 min-h-screen bg-slate-50 p-4 lg:p-10">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">My Meetings</h1>
              <p className="mt-1 text-slate-500">
                {event ? `${event.title} · ${joinNames(event.days.map((d) => dayShort(d.date)))}` : 'Parent–teacher meetings'}
              </p>
            </div>
            <ShowMeHow tour="my-meetings" />
            {events.length > 1 && (
              <div className="flex gap-2">
                {events.map((e) => (
                  <button key={e.eventId} type="button" onClick={() => setParams({ event: e.eventId, day: null })} className={`rounded-full border px-3 py-1.5 text-sm ${e.eventId === event?.eventId ? 'border-cyan-300 bg-cyan-50 text-cyan-800' : 'border-slate-200 bg-white text-slate-600'}`}>
                    {e.title}
                  </button>
                ))}
              </div>
            )}
          </div>
          {loading && !loaded ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : error ? (
            <p className="py-24 text-center text-sm text-slate-500">{error}</p>
          ) : !event ? (
            <div className="rounded-2xl border border-slate-200 bg-white py-20 text-center">
              <ChatBubbleLeftRightIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">You have no parent–teacher meetings coming up.</p>
            </div>
          ) : (
            <>
              {event.status !== 'open' && (
                <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                  Booking isn’t open yet. You can set your hours and close times now, before families see them.
                </p>
              )}
              <TeacherMeetings
                event={event}
                dayId={dayId}
                setDayId={(id) => setParams({ event: event.eventId, day: id })}
                autoPrint={get('print') === '1'}
                onPrinted={() => setParams({ print: null })}
                onChange={setTeacherEvent}
                notify={(m, t) => showNotification(m, t)}
              />
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default function MyMeetingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Spinner size="lg" /></div>}>
      <MyMeetingsContent />
    </Suspense>
  )
}
