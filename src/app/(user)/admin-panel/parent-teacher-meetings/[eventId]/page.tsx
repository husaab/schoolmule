'use client'

// One parent–teacher meetings event for the office: Setup (days, hours,
// emails, teachers, opening) and Board (every teacher's day). ?tab=board,
// &day= keep the place on Back and refresh.

import React, { Suspense, useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeftIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import BackLink from '@/components/shared/BackLink'
import SetupTab from '@/components/meetings/office/SetupTab'
import BoardTab from '@/components/meetings/office/BoardTab'
import MeetingPhasePill from '@/components/meetings/office/MeetingPhasePill'
import ShowMeHow from '@/components/tours/ShowMeHow'
import { inputClass } from '@/components/shared/modalKit'
import { getMeetingSetup, updateMeetingSettings } from '@/services/meetingsService'
import type { MeetingSetup } from '@/services/types/meetings'
import { useFilterParams } from '@/hooks/useFilterParams'
import { useNotificationStore } from '@/store/useNotificationStore'
import { dayShort, joinNames } from '@/lib/meetings'

const EventContent: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>()
  const { get, setParams } = useFilterParams()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [setup, setSetup] = useState<MeetingSetup | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [renaming, setRenaming] = useState<string | null>(null)
  const tab = get('tab') === 'board' ? 'board' : 'setup'

  const reload = useCallback(async () => {
    try {
      setSetup((await getMeetingSetup(eventId)).data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load these meetings')
    }
  }, [eventId])

  useEffect(() => {
    let alive = true
    getMeetingSetup(eventId)
      .then((res) => { if (alive) setSetup(res.data) })
      .catch((err) => { if (alive) setError(err instanceof Error ? err.message : 'Could not load these meetings') })
    return () => { alive = false }
  }, [eventId])

  const rename = async () => {
    if (!setup || renaming == null) return
    const title = renaming.trim()
    setRenaming(null)
    if (!title || title === setup.title) return
    try {
      setSetup((await updateMeetingSettings(setup.eventId, { title })).data)
    } catch (err) {
      showNotification(err instanceof Error ? err.message : 'Could not rename', 'error')
    }
  }

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="mx-auto max-w-7xl p-6 lg:p-8">
          <BackLink to="/admin-panel/parent-teacher-meetings" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800">
            <ArrowLeftIcon className="h-4 w-4" /> Parent–Teacher Meetings
          </BackLink>
          {error ? (
            <p className="py-16 text-center text-sm text-slate-500">{error}</p>
          ) : !setup ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  {renaming != null ? (
                    <input autoFocus aria-label="Name" className={`${inputClass} !text-xl !font-bold`} value={renaming}
                      onChange={(e) => setRenaming(e.target.value)} onBlur={() => void rename()} onKeyDown={(e) => { if (e.key === 'Enter') void rename(); if (e.key === 'Escape') setRenaming(null) }} />
                  ) : (
                    <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900 lg:text-3xl">
                      {setup.title}
                      <button type="button" aria-label="Rename" onClick={() => setRenaming(setup.title)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><PencilSquareIcon className="h-5 w-5" /></button>
                    </h1>
                  )}
                  <p className="mt-1 text-slate-500">{setup.days.length ? joinNames(setup.days.map((d) => dayShort(d.date))) : 'No days yet'} · {setup.slotMinutes} minutes each</p>
                </div>
                <div className="flex items-center gap-4">
                  <ShowMeHow tour="meetings-setup" fromStep="setup-days" />
                  <MeetingPhasePill phase={setup.phase} />
                </div>
              </div>
              <div data-tour="meetings.tabs" className="mb-6 mt-5 flex gap-1 border-b border-slate-200" role="tablist">
                {(['setup', 'board'] as const).map((t) => (
                  <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setParams({ tab: t === 'setup' ? null : t })}
                    className={`-mb-px border-b-2 px-4 py-2.5 text-sm ${tab === t ? 'border-cyan-600 font-medium text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
                    {t === 'setup' ? 'Setup' : `Board · ${setup.stats.bookings}`}
                  </button>
                ))}
              </div>
              {tab === 'setup' ? (
                <SetupTab setup={setup} onChange={setSetup} reload={reload} notify={(m, t) => showNotification(m, t)} />
              ) : (
                <BoardTab eventId={setup.eventId} dayId={get('day') || null} setDayId={(d) => setParams({ day: d })} notify={(m, t) => showNotification(m, t)} />
              )}
            </>
          )}
        </div>
      </main>
    </>
  )
}

export default function MeetingEventPage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <EventContent />
    </Suspense>
  )
}
