'use client'

// One teacher's own days and hours for a meetings event: which days they
// work, school hours or their own, their own breaks, their meeting length,
// and (the office only) their room and whether they take part. The office
// opens it from Setup's teacher list; a teacher opens the same window for
// themselves from My Meetings. A change that would leave a booked family
// without a time is refused, and the window lists who is in the way.

import React, { useEffect, useMemo, useState } from 'react'
import { ClockIcon, LockClosedIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, Field, FieldRow, FormSection, ModalBody, ModalFooter, ModalHeader, inputClass, selectClass } from '@/components/shared/modalKit'
import type { MeetingBreak, TeacherHoursChange } from '@/services/types/meetings'
import { bookedTimesFrom, dayLong, parseTime, rangeLabel, slotsFor, toTimeInput } from '@/lib/meetings'

export interface HoursDay {
  dayId: string
  date: string
  start: number
  end: number
  everyone: boolean
  /** Everyone's breaks that day. */
  breaks: MeetingBreak[]
}

export interface HoursTeacher {
  name: string
  subtitle?: string
  slotMinutes: number | null
  room: string | null
  takingPart: boolean
  families?: number
  days: { dayId: string; works: boolean; ownHours: boolean; start: number; end: number; breaks: MeetingBreak[] }[]
}

interface DraftDay {
  dayId: string
  works: boolean
  own: boolean
  start: string
  end: string
  breaks: { start: string; end: string; label: string }[]
}

interface Props {
  isOpen: boolean
  onClose: () => void
  teacher: HoursTeacher | null
  days: HoursDay[]
  defaultSlotMinutes: number
  /** The office: room and taking part too. */
  office: boolean
  /** "His", "her", "their", "your": the window's wording. */
  pronoun?: 'your' | 'their'
  onSave: (change: TeacherHoursChange) => Promise<void>
}

const LENGTHS = [5, 10, 15, 20, 30]

const TeacherHoursModal: React.FC<Props> = ({ isOpen, onClose, teacher, days, defaultSlotMinutes, office, pronoun = 'their', onSave }) => {
  const [draft, setDraft] = useState<DraftDay[]>([])
  const [length, setLength] = useState<string>('')
  const [room, setRoom] = useState('')
  const [takingPart, setTakingPart] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inTheWay, setInTheWay] = useState<string[]>([])

  useEffect(() => {
    if (!isOpen || !teacher) return
    setDraft(days.map((d) => {
      const own = teacher.days.find((x) => x.dayId === d.dayId)
      return {
        dayId: d.dayId,
        works: own ? own.works : d.everyone,
        own: Boolean(own?.ownHours),
        start: toTimeInput(own?.ownHours ? own.start : d.start),
        end: toTimeInput(own?.ownHours ? own.end : d.end),
        breaks: (own?.breaks || []).map((b) => ({ start: toTimeInput(b.start), end: toTimeInput(b.end), label: b.label || '' })),
      }
    }))
    setLength(teacher.slotMinutes ? String(teacher.slotMinutes) : '')
    setRoom(teacher.room || '')
    setTakingPart(teacher.takingPart)
    setError(null)
    setInTheWay([])
  }, [isOpen, teacher, days])

  const slot = length ? Number(length) : defaultSlotMinutes
  const counts = useMemo(() => draft.map((d) => {
    const day = days.find((x) => x.dayId === d.dayId)
    if (!day || !d.works) return 0
    const start = d.own ? parseTime(d.start) : day.start
    const end = d.own ? parseTime(d.end) : day.end
    if (start == null || end == null) return 0
    const own = d.breaks.map((b) => ({ start: parseTime(b.start), end: parseTime(b.end) })).filter((b): b is { start: number; end: number } => b.start != null && b.end != null)
    return slotsFor(start, end, slot, [...day.breaks, ...own]).length
  }), [draft, days, slot])
  const total = counts.reduce((a, b) => a + b, 0)

  const update = (i: number, patch: Partial<DraftDay>) => setDraft((ds) => ds.map((d, j) => (j === i ? { ...d, ...patch } : d)))

  const save = async () => {
    setError(null)
    setInTheWay([])
    const change: TeacherHoursChange = {
      slotMinutes: length ? Number(length) : null,
      days: [],
    }
    for (const d of draft) {
      const start = parseTime(d.start)
      const end = parseTime(d.end)
      if (d.works && d.own && (start == null || end == null || end <= start)) {
        setError('Each day\'s end has to be after its start.')
        return
      }
      const breaks = []
      for (const b of d.breaks) {
        const bs = parseTime(b.start)
        const be = parseTime(b.end)
        if (bs == null || be == null || be <= bs) {
          setError('Each break needs a start and an end after it.')
          return
        }
        breaks.push({ start: bs, end: be, label: b.label.trim() || null })
      }
      change.days!.push({ dayId: d.dayId, works: d.works, start: d.works && d.own ? start : null, end: d.works && d.own ? end : null, breaks })
    }
    if (office) {
      change.room = room.trim() || null
      change.takingPart = takingPart
    }
    setSaving(true)
    try {
      await onSave(change)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the hours')
      setInTheWay(bookedTimesFrom(err))
    } finally {
      setSaving(false)
    }
  }

  const possessive = pronoun === 'your' ? 'your' : 'their'
  return (
    <Modal isOpen={isOpen && Boolean(teacher)} onClose={onClose} size="2xl" ariaLabel="Days and hours">
      {teacher && (
        <>
          <ModalHeader title={pronoun === 'your' ? 'My days and hours' : `${teacher.name}'s days and hours`} subtitle={teacher.subtitle} icon={ClockIcon} />
          <ModalBody>
            {office && (
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" className="h-4 w-4 accent-cyan-600" checked={takingPart} onChange={(e) => setTakingPart(e.target.checked)} />
                Taking part in these meetings
              </label>
            )}
            <FormSection label="Days">
              <div className="space-y-3">
                {draft.map((d, i) => {
                  const day = days.find((x) => x.dayId === d.dayId)!
                  return (
                    <div key={d.dayId} className={`rounded-xl border p-4 ${d.works ? 'border-slate-200' : 'border-slate-100 bg-slate-50'}`}>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={d.works}
                          aria-label={`Works ${dayLong(day.date)}`}
                          onClick={() => update(i, { works: !d.works })}
                          className={`relative h-6 w-10 shrink-0 rounded-full transition-colors ${d.works ? 'bg-cyan-600' : 'bg-slate-300'}`}
                        >
                          <span className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-all ${d.works ? 'left-5' : 'left-1'}`} />
                        </button>
                        <p className={`flex-1 text-sm font-semibold ${d.works ? 'text-slate-900' : 'text-slate-500'}`}>{dayLong(day.date)}</p>
                        <p className="text-sm font-semibold text-slate-700">{d.works ? `${counts[i]} times` : 'Not working'}</p>
                      </div>
                      {d.works && (
                        <>
                          <div className="mt-3 flex flex-wrap items-end gap-3">
                            <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                              <button type="button" onClick={() => update(i, { own: false })} className={`rounded-lg px-3 py-1.5 text-sm ${!d.own ? 'bg-white font-medium text-cyan-700 shadow-sm' : 'text-slate-600'}`}>
                                School hours · {rangeLabel(day.start, day.end)}
                              </button>
                              <button type="button" onClick={() => update(i, { own: true })} className={`rounded-lg px-3 py-1.5 text-sm ${d.own ? 'bg-white font-medium text-cyan-700 shadow-sm' : 'text-slate-600'}`}>
                                {pronoun === 'your' ? 'My own hours' : 'Their own hours'}
                              </button>
                            </div>
                            {d.own && (
                              <>
                                <label className="flex flex-col text-xs text-slate-600">Starts<input type="time" step={300} className={`${inputClass} mt-1 !w-32`} value={d.start} onChange={(e) => update(i, { start: e.target.value })} /></label>
                                <label className="flex flex-col text-xs text-slate-600">Ends<input type="time" step={300} className={`${inputClass} mt-1 !w-32`} value={d.end} onChange={(e) => update(i, { end: e.target.value })} /></label>
                              </>
                            )}
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <span className="w-14 text-xs text-slate-500">Breaks</span>
                            {day.breaks.map((b) => (
                              <span key={b.breakId} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                                <LockClosedIcon className="h-3.5 w-3.5" />
                                {rangeLabel(b.start, b.end)}{b.label ? ` · ${b.label}` : ''} · everyone
                              </span>
                            ))}
                            {d.breaks.map((b, k) => (
                              <span key={k} className="inline-flex items-center gap-1 rounded-full bg-cyan-50 py-0.5 pl-2 pr-1 text-xs text-cyan-900">
                                <input aria-label="Break starts" type="time" step={300} value={b.start} onChange={(e) => update(i, { breaks: d.breaks.map((x, j) => (j === k ? { ...x, start: e.target.value } : x)) })} className="w-[6.5rem] bg-transparent" />
                                –
                                <input aria-label="Break ends" type="time" step={300} value={b.end} onChange={(e) => update(i, { breaks: d.breaks.map((x, j) => (j === k ? { ...x, end: e.target.value } : x)) })} className="w-[6.5rem] bg-transparent" />
                                <input aria-label="Break name" placeholder="Name" value={b.label} onChange={(e) => update(i, { breaks: d.breaks.map((x, j) => (j === k ? { ...x, label: e.target.value } : x)) })} className="w-24 bg-transparent placeholder:text-cyan-400" />
                                <button type="button" aria-label="Remove break" onClick={() => update(i, { breaks: d.breaks.filter((_, j) => j !== k) })} className="rounded-full p-0.5 hover:bg-cyan-100"><XMarkIcon className="h-3.5 w-3.5" /></button>
                              </span>
                            ))}
                            <button
                              type="button"
                              onClick={() => update(i, { breaks: [...d.breaks, { start: d.own ? d.start : toTimeInput(day.start), end: toTimeInput(Math.min((parseTime(d.own ? d.start : toTimeInput(day.start)) ?? day.start) + 20, 1439)), label: '' }] })}
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50"
                            >
                              <PlusIcon className="h-3.5 w-3.5" /> Add {possessive === 'your' ? 'my' : 'their'} own break
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>
            </FormSection>
            <FieldRow>
              <Field label="Each meeting" htmlFor="hours-length">
                <select id="hours-length" className={selectClass} value={length} onChange={(e) => setLength(e.target.value)}>
                  <option value="">School default · {defaultSlotMinutes} minutes</option>
                  {LENGTHS.filter((n) => n !== defaultSlotMinutes).map((n) => <option key={n} value={n}>{n} minutes</option>)}
                </select>
              </Field>
              {office && (
                <Field label="Room" htmlFor="hours-room" hint="Leave blank for the child's grade room.">
                  <input id="hours-room" className={inputClass} value={room} placeholder="Grade room" onChange={(e) => setRoom(e.target.value)} />
                </Field>
              )}
            </FieldRow>
            <div className="rounded-xl bg-cyan-50/70 px-4 py-3 text-sm text-slate-700">
              {office ? 'They can change these themselves in My Meetings, if the school allows it. ' : ''}
              Booked times stay put: if new hours would leave out a family who already booked, {office ? 'move them on the Board first' : 'ask the office to move them first'}.
            </div>
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <p>{error}</p>
                {inTheWay.length > 0 && <ul className="mt-2 list-disc pl-5">{inTheWay.map((l) => <li key={l}>{l}</li>)}</ul>}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <p className="mr-auto text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{total} times</span>
              {teacher.families ? ` for ${teacher.families} families` : ''} · {slot} minutes each
            </p>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button loading={saving} onClick={save}>Save hours</Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  )
}

export default TeacherHoursModal
