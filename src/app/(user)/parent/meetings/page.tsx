'use client'

// Parent–teacher meetings: book a time with each of your children's teachers,
// first come, first served. ?plan=1 (the invitation's "Plan my visit for me")
// opens Plan my visit once.

import React, { Suspense, useEffect, useState } from 'react'
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'
import ParentPageShell from '@/components/parent/ParentPageShell'
import ParentEmptyState from '@/components/parent/ParentEmptyState'
import Spinner from '@/components/Spinner'
import ParentMeetings from '@/components/meetings/parent/ParentMeetings'
import { useMeetingsStore } from '@/store/useMeetingsStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useFilterParams } from '@/hooks/useFilterParams'
import { dayShort, joinNames } from '@/lib/meetings'

const MeetingsContent: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const { parentEvents, loading, loaded, error, load, setParentEvent } = useMeetingsStore()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const { get, setParams } = useFilterParams()
  const [planOpen, setPlanOpen] = useState(false)
  const [eventId, setEventId] = useState<string | null>(null)

  useEffect(() => {
    if (user?.id) void load(true)
  }, [user?.id, selectedYearId, load])

  // The invitation's "Plan my visit for me" (?plan=1) opens it; closing drops the key.
  const planFromLink = get('plan') === '1' && loaded && parentEvents.some((e) => e.phase === 'open')
  const setPlan = (open: boolean) => {
    setPlanOpen(open)
    if (!open && get('plan')) setParams({ plan: null })
  }

  const event = parentEvents.find((e) => e.eventId === eventId) ?? parentEvents[0]
  const subtitle = event ? joinNames(event.days.map((d) => dayShort(d.date))) : 'Book a time with each of your children\'s teachers'

  return (
    <ParentPageShell title="Parent–Teacher Meetings" subtitle={subtitle} badge={{ icon: ChatBubbleLeftRightIcon, label: 'In person' }}>
      {loading && !loaded ? (
        <div className="flex justify-center py-24"><Spinner size="lg" /></div>
      ) : error ? (
        <p className="py-24 text-center text-sm text-slate-500">{error}</p>
      ) : !event ? (
        <ParentEmptyState
          icon={ChatBubbleLeftRightIcon}
          title="No meetings to book right now"
          message="When the school opens booking for parent–teacher meetings, you'll get an email and the times will be here."
        />
      ) : (
        <>
          {parentEvents.length > 1 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {parentEvents.map((e) => (
                <button
                  key={e.eventId}
                  type="button"
                  onClick={() => setEventId(e.eventId)}
                  className={`rounded-full border px-3 py-1.5 text-sm ${e.eventId === event.eventId ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-stone-200 bg-white text-slate-600'}`}
                >
                  {e.title}
                </button>
              ))}
            </div>
          )}
          <ParentMeetings
            event={event}
            onChange={setParentEvent}
            notify={(m, t) => showNotification(m, t)}
            planOpen={planOpen || planFromLink}
            setPlanOpen={setPlan}
          />
        </>
      )}
    </ParentPageShell>
  )
}

export default function ParentMeetingsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-24"><Spinner size="lg" /></div>}>
      <MeetingsContent />
    </Suspense>
  )
}
