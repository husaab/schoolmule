'use client'

// The parent's Meetings page: when and where (the banner), the visit so far,
// then each child with their teachers. A teacher row books, changes or says
// the teacher is full (with a way to message them instead). Siblings who share
// a teacher get one meeting unless the parent ticks for separate ones.

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import {
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  MapPinIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, RecordFacts } from '@/components/shared/modalKit'
import ChildAvatar from '@/components/parent/ChildAvatar'
import type { ParentBooking, ParentMeetingEvent, ParentMeetingTeacher } from '@/services/types/meetings'
import { bookMeetings, cancelMyMeeting, moveMyMeeting } from '@/services/meetingsService'
import { cutoffText, dayLong, dayShort, freeTimes, joinNames, rangeLabel, timeLabel, unbookedWith } from '@/lib/meetings'
import { ASK_LINK_PARAMS } from '@/lib/askLink'
import SlotPicker, { type PickedTime } from './SlotPicker'
import PlanVisitModal from './PlanVisitModal'

interface Props {
  event: ParentMeetingEvent
  onChange: (event: ParentMeetingEvent) => void
  notify: (message: string, type: 'success' | 'error') => void
  planOpen: boolean
  setPlanOpen: (open: boolean) => void
}

const card = 'rounded-2xl border border-stone-200/70 bg-white shadow-sm'

function messageHref(teacher: ParentMeetingTeacher, studentId: string) {
  const classId = teacher.classIds?.[studentId]
  if (!classId) return '/parent/messages?tab=conversations'
  const q = new URLSearchParams({
    tab: 'conversations',
    [ASK_LINK_PARAMS.studentId]: studentId,
    [ASK_LINK_PARAMS.classId]: classId,
    [ASK_LINK_PARAMS.about]: 'Parent–teacher meeting',
  })
  return `/parent/messages?${q}`
}

/** A child's teachers: homeroom first, then by subject. */
const teachersOf = (event: ParentMeetingEvent, studentId: string) =>
  event.teachers
    .filter((t) => t.studentIds.includes(studentId))
    .sort((a, b) => {
      const sa = a.subjects[studentId] || ''
      const sb = b.subjects[studentId] || ''
      const ha = sa.startsWith('Homeroom') ? 0 : 1
      const hb = sb.startsWith('Homeroom') ? 0 : 1
      return ha - hb || sa.localeCompare(sb) || a.name.localeCompare(b.name)
    })

const ParentMeetings: React.FC<Props> = ({ event, onChange, notify, planOpen, setPlanOpen }) => {
  const [separate, setSeparate] = useState<Set<string>>(new Set())
  const [moving, setMoving] = useState<ParentBooking | null>(null)
  const [cancelling, setCancelling] = useState<ParentBooking | null>(null)
  const open = event.phase === 'open'
  const childName = (id: string) => event.children.find((c) => c.studentId === id)?.firstName || ''
  const teacherOf = (id: string) => event.teachers.find((t) => t.teacherId === id)
  const dayOf = (id: string) => event.days.find((d) => d.dayId === id)

  const byDay = useMemo(() => event.days
    .map((d) => ({ day: d, bookings: event.bookings.filter((b) => b.dayId === d.dayId).sort((a, b) => a.start - b.start) }))
    .filter((d) => d.bookings.length), [event])
  const stillToBook = event.teachers.reduce((n, t) => n + (unbookedWith(event, t).length ? 1 : 0), 0)

  return (
    <div className="space-y-6">
      {/* When, where, how */}
      <section data-tour="meetings.banner" className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5 text-sm text-amber-950">
            <p className="text-base font-semibold">
              {open ? 'Booking is open · first come, first served' : event.phase === 'closed' ? 'Booking has closed' : 'Booking opens soon'}
            </p>
            {event.days.map((d) => (
              <p key={d.dayId} className="flex items-center gap-2">
                <CalendarDaysIcon className="h-4 w-4 text-amber-600" />
                {dayLong(d.date)}{d.window ? `, ${rangeLabel(d.window.start, d.window.end)}` : ''}
              </p>
            ))}
            <p className="flex items-center gap-2">
              <ClockIcon className="h-4 w-4 text-amber-600" />
              {event.slotMinutes} minutes each, in person · book, change or cancel {cutoffText(event.cutoffMin)}
            </p>
          </div>
          {open && stillToBook > 0 && (
            <Button variant="warning" data-tour="meetings.plan" onClick={() => setPlanOpen(true)} className="shrink-0">
              <SparklesIcon className="h-4 w-4" /> Plan my visit
            </Button>
          )}
        </div>
      </section>

      {/* Your visit */}
      {byDay.length > 0 && (
        <section className={`${card} p-5`}>
          <h2 className="mb-3 text-base font-semibold text-slate-900">Your visit</h2>
          <div className="space-y-4">
            {byDay.map(({ day, bookings }) => (
              <div key={day.dayId}>
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-700">{dayLong(day.date)}</p>
                <ul className="divide-y divide-stone-100">
                  {bookings.map((b) => (
                    <li key={b.bookingId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2.5">
                      <span className="w-20 text-sm font-semibold text-slate-900">{timeLabel(b.start)}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm text-slate-900">{b.teacherName}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          {joinNames(b.studentIds.map(childName).filter(Boolean))}
                          {b.room && <><span aria-hidden="true">·</span><MapPinIcon className="h-3.5 w-3.5" />{b.room}</>}
                        </span>
                      </span>
                      {b.canChange && open ? (
                        <span className="flex gap-1">
                          <button type="button" onClick={() => setMoving(b)} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-amber-800 hover:bg-amber-50">Change</button>
                          <button type="button" onClick={() => setCancelling(b)} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-500 hover:bg-stone-100">Cancel</button>
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">To change it, contact the school</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Each child and their teachers */}
      {event.children.map((child) => (
        <section key={child.studentId} data-tour="meetings.teachers" className={card}>
          <header className="flex items-center gap-3 border-b border-stone-100 px-5 py-4">
            <ChildAvatar studentId={child.studentId} name={child.name} size={40} />
            <div>
              <h2 className="text-base font-semibold text-slate-900">{child.firstName}</h2>
              <p className="text-sm text-slate-500">{child.gradeLabel}{child.room ? ` · meetings in the ${child.room}` : ''}</p>
            </div>
          </header>
          <ul className="divide-y divide-stone-100">
            {teachersOf(event, child.studentId).map((t) => (
              <TeacherRow
                key={t.teacherId}
                event={event}
                teacher={t}
                childId={child.studentId}
                separate={separate.has(t.teacherId)}
                setSeparate={(on) => setSeparate((s) => { const n = new Set(s); if (on) n.add(t.teacherId); else n.delete(t.teacherId); return n })}
                onBooked={(e) => { onChange(e); notify('Booked. A confirmation email is on its way.', 'success') }}
                onError={(m) => notify(m, 'error')}
                childName={childName}
                onChangeBooking={setMoving}
                open={open}
              />
            ))}
          </ul>
        </section>
      ))}

      <MoveModal
        event={event}
        booking={moving}
        teacher={moving ? teacherOf(moving.teacherId) : undefined}
        onClose={() => setMoving(null)}
        onMoved={(e) => { onChange(e); setMoving(null); notify('Changed. We emailed you the new time.', 'success') }}
        onError={(m) => notify(m, 'error')}
      />
      <CancelModal
        event={event}
        booking={cancelling}
        dayLabel={cancelling ? dayShort(dayOf(cancelling.dayId)!.date) : ''}
        childName={childName}
        onClose={() => setCancelling(null)}
        onCancelled={(e) => { onChange(e); setCancelling(null); notify('Cancelled.', 'success') }}
        onError={(m) => notify(m, 'error')}
      />
      <PlanVisitModal
        event={event}
        isOpen={planOpen}
        onClose={() => setPlanOpen(false)}
        onBooked={(e, n) => { onChange(e); notify(`${n === 1 ? 'Booked' : `${n} meetings booked`}. A confirmation email is on its way.`, 'success') }}
        onError={(m) => notify(m, 'error')}
      />
    </div>
  )
}

interface RowProps {
  event: ParentMeetingEvent
  teacher: ParentMeetingTeacher
  childId: string
  separate: boolean
  setSeparate: (on: boolean) => void
  onBooked: (event: ParentMeetingEvent) => void
  onError: (message: string) => void
  onChangeBooking: (b: ParentBooking) => void
  childName: (id: string) => string
  open: boolean
}

const TeacherRow: React.FC<RowProps> = ({ event, teacher, childId, separate, setSeparate, onBooked, onError, onChangeBooking, childName, open }) => {
  const [picking, setPicking] = useState(false)
  const [picked, setPicked] = useState<PickedTime | null>(null)
  const [saving, setSaving] = useState(false)
  const subject = teacher.subjects[childId]
  const booking = event.bookings.find((b) => b.teacherId === teacher.teacherId && b.studentIds.includes(childId))
  const unbooked = unbookedWith(event, teacher)
  const shareWith = event.siblingsShare && !separate ? unbooked : [childId]
  // A shared meeting is booked from the oldest child's row; the others point there.
  const ownerId = shareWith[0]
  const hasTimes = event.days.some((d) => d.bookable && freeTimes(event, teacher, d.dayId).length)

  const book = async () => {
    if (!picked) return
    setSaving(true)
    try {
      const res = await bookMeetings(event.eventId, [{ teacherId: teacher.teacherId, dayId: picked.dayId, startMin: picked.start, studentIds: shareWith.includes(childId) ? shareWith : [childId] }])
      setPicking(false)
      setPicked(null)
      onBooked(res.data.event)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not book that time')
    } finally {
      setSaving(false)
    }
  }

  let status: React.ReactNode
  if (booking) {
    const day = event.days.find((d) => d.dayId === booking.dayId)!
    const others = booking.studentIds.filter((id) => id !== childId).map(childName).filter(Boolean)
    status = (
      <span className="flex items-center gap-2 text-sm text-emerald-700">
        <CheckCircleIcon className="h-5 w-5" />
        {dayShort(day.date)}, {timeLabel(booking.start)}{others.length ? ` · with ${joinNames(others)}` : ''}
        {booking.canChange && open && booking.studentIds[0] === childId && (
          <button type="button" onClick={() => onChangeBooking(booking)} className="ml-1 rounded-lg px-2 py-1 font-medium text-amber-800 hover:bg-amber-50">Change</button>
        )}
      </span>
    )
  } else if (!open) {
    status = <span className="text-sm text-slate-400">Not booked</span>
  } else if (ownerId !== childId && shareWith.includes(childId)) {
    status = <span className="text-sm text-slate-500">Booking with {childName(ownerId)}, above</span>
  } else if (!hasTimes) {
    status = (
      <span className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
        All times are taken
        <Link href={messageHref(teacher, childId)} className="rounded-lg px-2 py-1 font-medium text-amber-800 hover:bg-amber-50">
          Message {teacher.name}
        </Link>
      </span>
    )
  } else if (!picking) {
    status = (
      <Button variant="secondary" data-tour="meetings.choose" onClick={() => setPicking(true)} className="!py-1.5">Choose a time</Button>
    )
  }

  const siblings = unbooked.filter((id) => id !== childId)
  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">{teacher.name}</p>
          <p className="text-xs text-slate-500">{[subject, teacher.room].filter(Boolean).join(' · ')}</p>
        </div>
        {status}
      </div>
      {picking && !booking && open && (
        <div className="mt-4 rounded-xl bg-stone-50 p-4">
          {event.siblingsShare && siblings.length > 0 && ownerId === childId && (
            <label className="mb-3 flex items-start gap-2 text-sm text-slate-700">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-amber-600" checked={separate} onChange={(e) => setSeparate(e.target.checked)} />
              <span>One meeting covers {joinNames([childId, ...siblings].map(childName))}. Tick for separate meetings.</span>
            </label>
          )}
          <SlotPicker event={event} teacher={teacher} value={picked} onChange={setPicked} />
          <div className="mt-4 flex gap-2">
            <Button variant="warning" data-tour="meetings.book" disabled={!picked} loading={saving} onClick={book}>
              {picked ? `Book ${dayShort(event.days.find((d) => d.dayId === picked.dayId)!.date).split(',')[0]} ${timeLabel(picked.start)}` : 'Pick a time'}
            </Button>
            <Button variant="secondary" onClick={() => { setPicking(false); setPicked(null) }}>Close</Button>
          </div>
        </div>
      )}
    </li>
  )
}

const MoveModal: React.FC<{
  event: ParentMeetingEvent
  booking: ParentBooking | null
  teacher?: ParentMeetingTeacher
  onClose: () => void
  onMoved: (event: ParentMeetingEvent) => void
  onError: (message: string) => void
}> = ({ event, booking, teacher, onClose, onMoved, onError }) => {
  const [picked, setPicked] = useState<PickedTime | null>(null)
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (!booking || !picked) return
    setSaving(true)
    try {
      const res = await moveMyMeeting(event.eventId, booking.bookingId, picked.dayId, picked.start)
      setPicked(null)
      onMoved(res.data.event)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not change the time')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal isOpen={Boolean(booking && teacher)} onClose={() => { setPicked(null); onClose() }} size="lg" ariaLabel="Change the time">
      {booking && teacher && (
        <>
          <ModalHeader title={`Change your time with ${teacher.name}`} subtitle={`Now ${dayShort(event.days.find((d) => d.dayId === booking.dayId)!.date)}, ${timeLabel(booking.start)}. Pick a new time.`} icon={ClockIcon} tone="warning" />
          <ModalBody>
            <SlotPicker event={event} teacher={teacher} value={picked} onChange={setPicked} exceptBookingId={booking.bookingId} />
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => { setPicked(null); onClose() }}>Keep my time</Button>
            <Button variant="warning" disabled={!picked} loading={saving} onClick={save}>
              {picked ? `Change to ${timeLabel(picked.start)}` : 'Change'}
            </Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  )
}

const CancelModal: React.FC<{
  event: ParentMeetingEvent
  booking: ParentBooking | null
  dayLabel: string
  childName: (id: string) => string
  onClose: () => void
  onCancelled: (event: ParentMeetingEvent) => void
  onError: (message: string) => void
}> = ({ event, booking, dayLabel, childName, onClose, onCancelled, onError }) => {
  const [saving, setSaving] = useState(false)
  const cancel = async () => {
    if (!booking) return
    setSaving(true)
    try {
      const res = await cancelMyMeeting(event.eventId, booking.bookingId)
      onCancelled(res.data.event)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not cancel')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal isOpen={Boolean(booking)} onClose={onClose} size="md" ariaLabel="Cancel this meeting">
      {booking && (
        <>
          <ModalHeader title="Cancel this meeting?" tone="danger" />
          <ModalBody>
            <RecordFacts facts={[
              { label: 'Teacher', value: booking.teacherName },
              { label: 'When', value: `${dayLabel}, ${timeLabel(booking.start)}` },
              { label: 'For', value: joinNames(booking.studentIds.map(childName).filter(Boolean)) },
            ]} />
            <ConfirmBody tone="warning">The time goes back to the other families. You can book another time while booking is open.</ConfirmBody>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>Keep it</Button>
            <Button variant="danger" loading={saving} onClick={cancel}>Cancel meeting</Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  )
}

export default ParentMeetings
