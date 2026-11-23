'use client'

// Plan my visit: tick the teachers, pick the day and when you'll arrive, and
// every meeting is lined up back to back (lib/meetings planVisit). Already
// booked meetings stay where they are; a teacher with nothing that day is
// offered their first time on another day. "Book these" books them all at
// once, or none if a time went in the meantime. When the school allows phone
// calls, the new meetings are all in person or all phone calls.

import React, { useEffect, useMemo, useState } from 'react'
import { SparklesIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, Field, FormSection, ModalBody, ModalFooter, ModalHeader, selectClass } from '@/components/shared/modalKit'
import type { ParentMeetingEvent } from '@/services/types/meetings'
import { bookMeetings } from '@/services/meetingsService'
import {
  dayShort, defaultHow, howBody, howReady, joinNames, placeLabel, planVisit, timeLabel, wantsFor, weekdayLong, type HowChoice, type PlanWant,
} from '@/lib/meetings'
import HowPicker from '../HowPicker'

interface Props {
  event: ParentMeetingEvent
  isOpen: boolean
  onClose: () => void
  onBooked: (event: ParentMeetingEvent, count: number) => void
  onError: (message: string) => void
}

const key = (w: PlanWant) => `${w.teacherId}:${w.studentIds.join(',')}`

const PlanVisitModal: React.FC<Props> = ({ event, isOpen, onClose, onBooked, onError }) => {
  const allWants = useMemo(() => wantsFor(event, event.children.map((c) => c.studentId)), [event])
  const bookableDays = event.days.filter((d) => d.bookable)
  const [picked, setPicked] = useState<Set<string>>(new Set())
  const [dayId, setDayId] = useState<string>('')
  const [arrive, setArrive] = useState<number>(0)
  const [takeAlternatives, setTakeAlternatives] = useState<Set<string>>(new Set())
  const [how, setHow] = useState<HowChoice>({ mode: 'in_person', phone: '' })
  const [saving, setSaving] = useState(false)

  // Reset each time it opens: every teacher still to book ticked, the first bookable day, its first time.
  useEffect(() => {
    if (!isOpen) return
    setPicked(new Set(allWants.map(key)))
    const first = bookableDays[0]
    setDayId(first?.dayId ?? '')
    setArrive(first?.window?.start ?? first?.start ?? 0)
    setTakeAlternatives(new Set())
    setHow(defaultHow(event))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  const day = event.days.find((d) => d.dayId === dayId)
  const arrivalOptions = useMemo(() => {
    if (!day) return []
    const w = day.window ?? { start: day.start, end: day.end }
    const out: number[] = []
    for (let t = w.start; t < w.end; t += 10) out.push(t)
    return out
  }, [day])

  const wants = allWants.filter((w) => picked.has(key(w)))
  const plan = day ? planVisit(event, wants, day.dayId, arrive) : null
  const teacherName = (id: string) => event.teachers.find((t) => t.teacherId === id)?.name || 'Teacher'
  const kids = (ids: string[]) => joinNames(ids.map((id) => event.children.find((c) => c.studentId === id)?.firstName || '').filter(Boolean))
  const alternatives = (plan?.unplaced || []).filter((u) => u.alternative && takeAlternatives.has(key(u)))
  const toBook = [...(plan?.added || []), ...alternatives.map((u) => u.alternative!)]

  const book = async () => {
    if (!toBook.length) return
    setSaving(true)
    try {
      const res = await bookMeetings(event.eventId, toBook.map((m) => ({ teacherId: m.teacherId, dayId: m.dayId, startMin: m.start, studentIds: m.studentIds, ...howBody(how) })))
      onBooked(res.data.event, toBook.length)
      onClose()
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not book these meetings')
    } finally {
      setSaving(false)
    }
  }

  const toggle = (set: Set<string>, k: string) => {
    const next = new Set(set)
    if (next.has(k)) next.delete(k)
    else next.add(k)
    return next
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="2xl" ariaLabel="Plan my visit">
      <ModalHeader
        title="Plan my visit"
        subtitle={how.mode === 'phone' ? 'Your calls back to back, from the time you pick.' : 'Your meetings back to back, around the time you arrive.'}
        icon={SparklesIcon}
        tone="warning"
      />
      <ModalBody>
        {allWants.length === 0 ? (
          <p className="text-sm text-slate-600">You’ve booked every teacher already.</p>
        ) : (
          <>
            <FormSection label="Who">
              <div className="grid gap-4 sm:grid-cols-2">
                {event.children.map((c) => {
                  const mine = allWants.filter((w) => w.studentIds.includes(c.studentId) && w.studentIds[0] === c.studentId)
                  const shared = allWants.filter((w) => w.studentIds.includes(c.studentId) && w.studentIds[0] !== c.studentId)
                  if (!mine.length && !shared.length) return null
                  return (
                    <div key={c.studentId} className="rounded-xl border border-stone-200 p-3">
                      <p className="mb-2 text-sm font-semibold text-slate-900">{c.firstName} <span className="font-normal text-slate-500">· {c.gradeLabel}</span></p>
                      {mine.map((w) => (
                        <label key={key(w)} className="flex items-start gap-2 py-1 text-sm text-slate-700">
                          <input type="checkbox" className="mt-0.5 h-4 w-4 accent-amber-600" checked={picked.has(key(w))} onChange={() => setPicked((s) => toggle(s, key(w)))} />
                          <span>{teacherName(w.teacherId)}{w.studentIds.length > 1 && <span className="text-slate-500"> · with {kids(w.studentIds.slice(1))}</span>}</span>
                        </label>
                      ))}
                      {shared.map((w) => (
                        <p key={key(w)} className="py-1 pl-6 text-sm text-slate-400">{teacherName(w.teacherId)} · with {kids([w.studentIds[0]])}, above</p>
                      ))}
                    </div>
                  )
                })}
              </div>
            </FormSection>

            <FormSection label="When">
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Day">
                  <div className="inline-flex rounded-xl border border-stone-200 bg-stone-50 p-1">
                    {bookableDays.map((d) => (
                      <button
                        key={d.dayId}
                        type="button"
                        onClick={() => { setDayId(d.dayId); setArrive(d.window?.start ?? d.start) }}
                        className={`rounded-lg px-3 py-1.5 text-sm ${d.dayId === dayId ? 'bg-white font-medium text-amber-800 shadow-sm' : 'text-slate-600'}`}
                      >
                        {dayShort(d.date)}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label={how.mode === 'phone' ? 'Start around' : "I'll arrive around"} htmlFor="plan-arrive">
                  <select id="plan-arrive" className={selectClass} value={arrive} onChange={(e) => setArrive(Number(e.target.value))}>
                    {arrivalOptions.map((t) => <option key={t} value={t}>{timeLabel(t)}</option>)}
                  </select>
                </Field>
              </div>
              {event.allowPhone && (
                <HowPicker value={how} onChange={setHow} plural />
              )}
            </FormSection>

            {plan && day && (
              <FormSection label={plan.span ? `Your visit · ${weekdayLong(day.date)} ${timeLabel(plan.span.start)} – ${timeLabel(plan.span.end)}` : 'Your visit'}>
                {plan.meetings.length === 0 ? (
                  <p className="text-sm text-slate-500">Nothing fits after {timeLabel(arrive)} that day. Try an earlier time or the other day.</p>
                ) : (
                  <ol className="divide-y divide-stone-100 rounded-xl border border-stone-200">
                    {plan.meetings.map((m, i) => {
                      const prev = plan.meetings[i - 1]
                      const gap = prev && m.start > prev.end
                      const booked = m.bookingId ? event.bookings.find((b) => b.bookingId === m.bookingId) : null
                      const room = booked ? placeLabel(booked)
                        : how.mode === 'phone' ? 'Phone call'
                          : event.teachers.find((t) => t.teacherId === m.teacherId)?.room
                            || event.children.find((c) => c.studentId === m.studentIds[0])?.room
                      return (
                        <React.Fragment key={`${m.teacherId}:${m.start}`}>
                          {gap && <li className="bg-stone-50 px-4 py-2 text-sm text-slate-500">Free until {timeLabel(m.start)}</li>}
                          <li className="flex items-center gap-4 px-4 py-2.5">
                            <span className="w-20 shrink-0 text-sm font-semibold text-slate-900">{timeLabel(m.start)}</span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm text-slate-900">{teacherName(m.teacherId)}</span>
                              <span className="block text-xs text-slate-500">{[kids(m.studentIds), room].filter(Boolean).join(' · ')}</span>
                            </span>
                            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${m.bookingId ? 'bg-stone-100 text-slate-600' : 'bg-amber-100 text-amber-800'}`}>
                              {m.bookingId ? 'Booked' : 'New'}
                            </span>
                          </li>
                        </React.Fragment>
                      )
                    })}
                  </ol>
                )}
                {plan.unplaced.map((u) => (
                  <div key={key(u)} className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    <p>{teacherName(u.teacherId)} has no times left on {weekdayLong(day.date)}{u.alternative ? '.' : ', or on the other days.'}</p>
                    {u.alternative && (
                      <label className="mt-2 flex items-center gap-2">
                        <input type="checkbox" className="h-4 w-4 accent-amber-600" checked={takeAlternatives.has(key(u))} onChange={() => setTakeAlternatives((s) => toggle(s, key(u)))} />
                        Book their first time on {weekdayLong(event.days.find((d) => d.dayId === u.alternative!.dayId)!.date)} instead: {timeLabel(u.alternative.start)}
                      </label>
                    )}
                  </div>
                ))}
              </FormSection>
            )}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Not now</Button>
        <Button variant="warning" loading={saving} disabled={!toBook.length || !howReady(how)} onClick={book}>
          {toBook.length ? `Book ${toBook.length === 1 ? 'this meeting' : `these ${toBook.length}`}` : 'Book'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default PlanVisitModal
