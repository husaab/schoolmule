'use client'

// Admin Panel → Planning → Parent–Teacher Meetings: every meetings event of
// the year, and New meetings (prefilled from the school calendar's
// "Parent Teacher Meeting" days). Each opens to Setup and Board.

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon, CalendarDaysIcon, ChatBubbleLeftRightIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import Navbar from '@/components/navbar/Navbar'
import Sidebar from '@/components/sidebar/Sidebar'
import Spinner from '@/components/Spinner'
import Modal from '@/components/shared/modal'
import { Button, Field, FieldRow, FormSection, ModalBody, ModalFooter, ModalHeader, inputClass, selectClass } from '@/components/shared/modalKit'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { createMeetingEvent, listMeetingEvents } from '@/services/meetingsService'
import type { MeetingEventSummary } from '@/services/types/meetings'
import { dayShort, instantLabel, joinNames, parseTime } from '@/lib/meetings'
import MeetingPhasePill from '@/components/meetings/office/MeetingPhasePill'
import ShowMeHow from '@/components/tours/ShowMeHow'
import { useMeetingsStore } from '@/store/useMeetingsStore'

const ListContent: React.FC = () => {
  const selectedYearId = useSchoolYearStore((s) => s.selectedYearId)
  const showNotification = useNotificationStore((s) => s.showNotification)
  const router = useRouter()
  const [events, setEvents] = useState<MeetingEventSummary[] | null>(null)
  const [suggestions, setSuggestions] = useState<{ date: string; title: string }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)


  useEffect(() => {
    let alive = true
    listMeetingEvents()
      .then((res) => {
        if (!alive) return
        setEvents(res.data.events)
        setSuggestions(res.data.suggestions)
      })
      .catch((err) => { if (alive) setError(err instanceof Error ? err.message : 'Could not load the meetings') })
    return () => { alive = false }
  }, [selectedYearId])

  return (
    <>
      <Navbar />
      <Sidebar />
      <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50">
        <div className="p-6 lg:p-8 max-w-4xl mx-auto">
          <Link href="/admin-panel" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-cyan-700 hover:text-cyan-800">
            <ArrowLeftIcon className="h-4 w-4" /> Admin Panel
          </Link>
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">Parent–Teacher Meetings</h1>
              <p className="mt-1 text-slate-500">Set the days and hours, then open booking. Every family gets the invitation at the same moment.</p>
            </div>
            <div className="flex items-center gap-4">
              <ShowMeHow tour="meetings-setup" />
              <Button data-tour="meetings.new" onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" /> New meetings</Button>
            </div>
          </div>

          {error ? (
            <p className="py-16 text-center text-sm text-slate-500">{error}</p>
          ) : !events ? (
            <div className="flex justify-center py-24"><Spinner size="lg" /></div>
          ) : events.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-6 py-14 text-center">
              <ChatBubbleLeftRightIcon className="mx-auto mb-3 h-10 w-10 text-slate-300" />
              <p className="font-medium text-slate-900">No parent–teacher meetings yet</p>
              <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
                {suggestions.length
                  ? `Your school calendar has "${suggestions[0].title}" on ${joinNames(suggestions.map((s) => dayShort(s.date)))}.`
                  : 'Pick the days, set the hours, and open booking when you\'re ready.'}
              </p>
              <Button className="mt-5" onClick={() => setCreating(true)}><PlusIcon className="h-4 w-4" /> Set them up</Button>
            </div>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => (
                <li key={e.eventId}>
                  <Link href={`/admin-panel/parent-teacher-meetings/${e.eventId}`} className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm transition-colors hover:border-cyan-200 hover:bg-cyan-50/30">
                    <CalendarDaysIcon className="h-6 w-6 text-cyan-600" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold text-slate-900">{e.title}</span>
                      <span className="block text-sm text-slate-500">
                        {e.firstDay ? (e.firstDay === e.lastDay ? dayShort(e.firstDay) : `${dayShort(e.firstDay)} – ${dayShort(e.lastDay!)}`) : 'No days yet'}
                        {' · '}{e.bookings} {e.bookings === 1 ? 'meeting' : 'meetings'} booked
                        {e.status === 'scheduled' && e.opensAt ? ` · opens ${instantLabel(e.opensAt)}` : ''}
                      </span>
                    </span>
                    <MeetingPhasePill phase={e.phase} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <NewMeetingsModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        suggestions={suggestions}
        onCreated={(id) => { void useMeetingsStore.getState().loadOffice(true); router.push(`/admin-panel/parent-teacher-meetings/${id}`) }}
        onError={(m) => showNotification(m, 'error')}
      />
    </>
  )
}

interface DraftDay { date: string; start: string; end: string }

const NewMeetingsModal: React.FC<{
  isOpen: boolean
  onClose: () => void
  suggestions: { date: string; title: string }[]
  onCreated: (eventId: string) => void
  onError: (message: string) => void
}> = ({ isOpen, onClose, suggestions, onCreated, onError }) => {
  const [title, setTitle] = useState('Parent–teacher meetings')
  const [length, setLength] = useState(10)
  const [days, setDays] = useState<DraftDay[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setTitle('Parent–teacher meetings')
    setLength(10)
    setDays(suggestions.length
      ? suggestions.map((s) => ({ date: s.date, start: '15:30', end: '19:30' }))
      : [{ date: '', start: '15:30', end: '19:30' }])
  }, [isOpen, suggestions])

  const update = (i: number, patch: Partial<DraftDay>) => setDays((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)))

  const save = async () => {
    const body = days.filter((d) => d.date).map((d) => ({ date: d.date, start: parseTime(d.start) ?? 0, end: parseTime(d.end) ?? 0 }))
    if (body.some((d) => d.end <= d.start)) {
      onError("Each day's end has to be after its start.")
      return
    }
    setSaving(true)
    try {
      const res = await createMeetingEvent({ title, slotMinutes: length, days: body })
      onClose()
      onCreated(res.data.eventId)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not create the meetings')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg" ariaLabel="New parent–teacher meetings">
      <ModalHeader title="New parent–teacher meetings" subtitle="Nothing goes to families until you open booking." icon={CalendarDaysIcon} />
      <ModalBody>
        <FieldRow>
          <Field label="Name" htmlFor="ptm-title"><input id="ptm-title" className={inputClass} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Each meeting" htmlFor="ptm-length">
            <select id="ptm-length" className={selectClass} value={length} onChange={(e) => setLength(Number(e.target.value))}>
              {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} minutes</option>)}
            </select>
          </Field>
        </FieldRow>
        <FormSection label={suggestions.length ? 'Days (from your school calendar)' : 'Days'}>
          <div data-tour="meetings.newDays" className="space-y-2">
            {days.map((d, i) => (
              <div key={i} className="flex flex-wrap items-end gap-2">
                <label className="flex flex-col text-xs text-slate-600">Date<input type="date" className={`${inputClass} mt-1 !w-44`} value={d.date} onChange={(e) => update(i, { date: e.target.value })} /></label>
                <label className="flex flex-col text-xs text-slate-600">Starts<input type="time" step={300} className={`${inputClass} mt-1 !w-32`} value={d.start} onChange={(e) => update(i, { start: e.target.value })} /></label>
                <label className="flex flex-col text-xs text-slate-600">Ends<input type="time" step={300} className={`${inputClass} mt-1 !w-32`} value={d.end} onChange={(e) => update(i, { end: e.target.value })} /></label>
                <button type="button" aria-label="Remove this day" onClick={() => setDays((ds) => ds.filter((_, j) => j !== i))} className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><TrashIcon className="h-4 w-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => setDays((ds) => [...ds, { date: '', start: ds[ds.length - 1]?.start || '15:30', end: ds[ds.length - 1]?.end || '19:30' }])} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-cyan-700 hover:bg-cyan-50">
              <PlusIcon className="h-4 w-4" /> Add a day
            </button>
          </div>
          <p className="text-xs text-slate-400">You can add breaks, give teachers their own hours, and change all of this after.</p>
        </FormSection>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button data-tour="meetings.create" loading={saving} disabled={!days.some((d) => d.date)} onClick={save}>Create</Button>
      </ModalFooter>
    </Modal>
  )
}

export default function MeetingsListPage() {
  return (
    <Suspense fallback={<main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />}>
      <ListContent />
    </Suspense>
  )
}

