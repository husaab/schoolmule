'use client'

// The office's Board: every teacher's day as a grid, booked, open and closed.
// Click a booked time to move or cancel it (the family is emailed), click an
// open one to book a family there, or use Book for a family from the top.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowPathIcon, EnvelopeIcon, MagnifyingGlassIcon, PlusIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import Spinner from '@/components/Spinner'
import { Button, Field, FormSection, ModalBody, ModalFooter, ModalHeader, RecordFacts, inputClass, selectClass } from '@/components/shared/modalKit'
import type { BoardCell, BoardColumn, MeetingBoard, MeetingFamily } from '@/services/types/meetings'
import {
  getMeetingBoard, officeBookMeeting, officeCancelMeeting, officeMoveMeeting, searchMeetingFamilies, sendMeetingsLastCall,
} from '@/services/meetingsService'
import { dayShort, joinNames, timeLabel } from '@/lib/meetings'

interface Props {
  eventId: string
  dayId: string | null
  setDayId: (dayId: string) => void
  notify: (message: string, type: 'success' | 'error') => void
}

type OpenTime = { dayId: string; start: number; end: number }

const BoardTab: React.FC<Props> = ({ eventId, dayId, setDayId, notify }) => {
  const [boards, setBoards] = useState<Record<string, MeetingBoard>>({})
  const [first, setFirst] = useState<MeetingBoard | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [managing, setManaging] = useState<{ column: BoardColumn; cell: BoardCell } | null>(null)
  const [booking, setBooking] = useState<{ teacherId?: string; time?: OpenTime } | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const head = (await getMeetingBoard(eventId)).data
      const all = await Promise.all(head.days.map((d) => getMeetingBoard(eventId, d.dayId).then((r) => r.data)))
      setBoards(Object.fromEntries(all.map((b) => [b.day!.dayId, b])))
      setFirst(head)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load the board')
    }
  }, [eventId])

  useEffect(() => { void load() }, [load])

  const board = (dayId && boards[dayId]) || (first?.day ? boards[first.day.dayId] : null)
  const openTimesOf = useCallback((teacherId: string): OpenTime[] =>
    Object.values(boards).flatMap((b) => (b.columns.find((c) => c.teacherId === teacherId)?.cells || [])
      .filter((c) => c.kind === 'open').map((c) => ({ dayId: b.day!.dayId, start: c.start, end: c.end }))), [boards])

  const columns = useMemo(() => {
    if (!board) return []
    const q = query.trim().toLowerCase()
    if (!q) return board.columns
    return board.columns.filter((c) => c.name.toLowerCase().includes(q) || c.cells.some((x) => x.booking && `${x.booking.family} ${x.booking.kids}`.toLowerCase().includes(q)))
  }, [board, query])

  if (error) return <p className="py-16 text-center text-sm text-slate-500">{error}</p>
  if (!board || !first) return <div className="flex justify-center py-24"><Spinner size="lg" /></div>
  if (!board.day) return <p className="py-16 text-center text-sm text-slate-500">Add a day in Setup first.</p>

  const totalBooked = Object.values(boards).reduce((n, b) => n + b.stats.bookings, 0)
  const totalOpen = Object.values(boards).reduce((n, b) => n + b.columns.reduce((m, c) => m + c.open, 0), 0)
  const breakAt = (t: number) => board.breaks.find((b) => b.start === t)
  const inBreak = (t: number) => board.breaks.some((b) => t > b.start && t < b.end)
  // Every meeting time, plus each everyone-break's start (its own row).
  const rowTimes = [...new Set([...board.times, ...board.breaks.map((b) => b.start)])].sort((a, b) => a - b)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Meetings booked" value={totalBooked} />
        <Tile label="Open times left" value={totalOpen} />
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm text-slate-600">Families who haven’t booked</p>
          <Button variant="secondary" className="!py-1.5" loading={busy} disabled={first.status !== 'open'} onClick={async () => {
            setBusy(true)
            try {
              const res = await sendMeetingsLastCall(eventId)
              notify(res.data.queued ? `Emailing ${res.data.queued} ${res.data.queued === 1 ? 'family' : 'families'}.` : 'Every family has booked.', 'success')
            } catch (err) {
              notify(err instanceof Error ? err.message : 'Could not send', 'error')
            } finally {
              setBusy(false)
            }
          }}><EnvelopeIcon className="h-4 w-4" /> <span className="whitespace-nowrap">Email them</span></Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
          {first.days.map((d) => (
            <button key={d.dayId} type="button" onClick={() => setDayId(d.dayId)}
              className={`rounded-lg px-3 py-1.5 text-sm ${d.dayId === board.day!.dayId ? 'bg-cyan-50 font-medium text-cyan-700' : 'text-slate-600'}`}>
              {dayShort(d.date)} · {d.bookings}
            </button>
          ))}
        </div>
        <label className="relative">
          <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input aria-label="Find a teacher or family" placeholder="Find a teacher or family" className={`${inputClass} !w-64 !pl-9`} value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <button type="button" onClick={() => void load()} aria-label="Refresh" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><ArrowPathIcon className="h-5 w-5" /></button>
        <Button className="ml-auto" onClick={() => setBooking({})}><PlusIcon className="h-4 w-4" /> Book for a family</Button>
      </div>

      {columns.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white py-16 text-center text-sm text-slate-500">No teachers have times on {dayShort(board.day.date)}.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid min-w-max gap-1.5 p-3" style={{ gridTemplateColumns: `64px repeat(${columns.length}, minmax(132px, 1fr))` }}>
            <div />
            {columns.map((c) => (
              <div key={c.teacherId} className="px-1.5 pb-2">
                <p className="truncate text-sm font-semibold text-slate-900">{c.name}</p>
                <p className="truncate text-xs text-slate-500">{[c.teaches, c.hoursLabel].filter(Boolean).join(' · ')}</p>
                <p className="text-xs text-slate-600">{c.open ? `${c.open} open` : 'Full'}</p>
              </div>
            ))}
            {rowTimes.map((t) => {
              if (inBreak(t)) return null
              const br = breakAt(t)
              return (
                <React.Fragment key={t}>
                  <div className="pr-1 pt-3 text-right text-xs font-medium text-slate-500">{timeLabel(t).replace(' ', ' ')}</div>
                  {br ? (
                    <div className="flex h-11 items-center justify-center rounded-lg bg-[repeating-linear-gradient(135deg,#f8fafc_0_10px,#eef2f6_10px_20px)] text-xs text-slate-500" style={{ gridColumn: `2 / span ${columns.length}` }}>
                      Break for everyone{br.label ? ` · ${br.label}` : ''} · {timeLabel(br.start)} – {timeLabel(br.end)}
                    </div>
                  ) : columns.map((c) => {
                    const cell = c.cells.find((x) => x.start === t)
                    if (!cell) return <div key={c.teacherId} />
                    if (cell.kind === 'booked') {
                      return (
                        <button key={c.teacherId} type="button" onClick={() => setManaging({ column: c, cell })}
                          className="h-11 overflow-hidden rounded-lg border border-cyan-100 bg-cyan-50 px-2 text-left hover:border-cyan-400">
                          <span className="block truncate text-xs font-semibold text-cyan-900">{cell.booking!.family}</span>
                          <span className="block truncate text-[11px] text-cyan-700">{cell.booking!.kids}</span>
                        </button>
                      )
                    }
                    if (cell.kind === 'closed') {
                      return <div key={c.teacherId} className="flex h-11 items-center rounded-lg bg-[repeating-linear-gradient(135deg,#f1f5f9_0_8px,#e2e8f0_8px_16px)] px-2 text-xs font-medium text-slate-600">Closed</div>
                    }
                    return (
                      <button key={c.teacherId} type="button" onClick={() => setBooking({ teacherId: c.teacherId, time: { dayId: board.day!.dayId, start: cell.start, end: cell.end } })}
                        className="h-11 rounded-lg border border-dashed border-slate-300 bg-white px-2 text-left text-xs text-slate-500 hover:border-cyan-400 hover:text-cyan-700">
                        Open
                      </button>
                    )
                  })}
                </React.Fragment>
              )
            })}
          </div>
        </div>
      )}
      <p className="text-xs text-slate-500">Booked · Open · Closed by the teacher. Click a booked time to move or cancel it; click an open time to book a family there. The family gets an email either way.</p>

      <ManageModal
        eventId={eventId}
        managing={managing}
        day={board.day}
        dayLabel={(id) => dayShort(first.days.find((d) => d.dayId === id)!.date)}
        openTimes={managing ? openTimesOf(managing.column.teacherId) : []}
        onClose={() => setManaging(null)}
        onDone={async (m) => { setManaging(null); notify(m, 'success'); await load() }}
        onError={(m) => notify(m, 'error')}
      />
      <BookModal
        eventId={eventId}
        preset={booking}
        teachers={Object.values(boards)[0]?.columns || []}
        allColumns={Object.values(boards).flatMap((b) => b.columns)}
        openTimesOf={openTimesOf}
        dayLabel={(id) => dayShort(first.days.find((d) => d.dayId === id)!.date)}
        onClose={() => setBooking(null)}
        onDone={async (m) => { setBooking(null); notify(m, 'success'); await load() }}
        onError={(m) => notify(m, 'error')}
      />
    </div>
  )
}

const Tile: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
    <p className="text-sm text-slate-600">{label}</p>
    <p className="text-2xl font-bold text-slate-900">{value}</p>
  </div>
)

const timeKey = (t: OpenTime) => `${t.dayId}|${t.start}`

const ManageModal: React.FC<{
  eventId: string
  managing: { column: BoardColumn; cell: BoardCell } | null
  day: NonNullable<MeetingBoard['day']>
  dayLabel: (dayId: string) => string
  openTimes: OpenTime[]
  onClose: () => void
  onDone: (message: string) => void
  onError: (message: string) => void
}> = ({ eventId, managing, day, dayLabel, openTimes, onClose, onDone, onError }) => {
  const [to, setTo] = useState('')
  const [saving, setSaving] = useState<string | null>(null)
  useEffect(() => setTo(''), [managing])
  const b = managing?.cell.booking
  const run = async (kind: 'move' | 'cancel') => {
    if (!b) return
    setSaving(kind)
    try {
      if (kind === 'move') {
        const [dayId, start] = to.split('|')
        await officeMoveMeeting(eventId, b.bookingId, dayId, Number(start))
        onDone('Moved. The family is getting an email.')
      } else {
        await officeCancelMeeting(eventId, b.bookingId)
        onDone('Cancelled. The family is getting an email.')
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not change the meeting')
    } finally {
      setSaving(null)
    }
  }
  return (
    <Modal isOpen={Boolean(managing)} onClose={onClose} size="md" ariaLabel="Booked meeting">
      {managing && b && (
        <>
          <ModalHeader title={`${b.family} family`} subtitle={`${managing.column.name} · ${dayLabel(day.dayId)}, ${timeLabel(managing.cell.start)}`} icon={UserGroupIcon} />
          <ModalBody>
            <RecordFacts facts={[
              { label: 'Children', value: b.kids },
              { label: 'Room', value: b.room || '–' },
              { label: 'Booked by', value: b.byOffice ? 'The office' : 'The family' },
            ]} />
            <Field label="Move to" htmlFor="move-to" hint="Another of this teacher's open times.">
              <select id="move-to" className={selectClass} value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="">Choose a time…</option>
                {openTimes.map((t) => <option key={timeKey(t)} value={timeKey(t)}>{dayLabel(t.dayId)}, {timeLabel(t.start)}</option>)}
              </select>
            </Field>
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" className="mr-auto !border-rose-200 !text-rose-700" loading={saving === 'cancel'} onClick={() => void run('cancel')}>Cancel meeting</Button>
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button disabled={!to} loading={saving === 'move'} onClick={() => void run('move')}>Move</Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  )
}

const BookModal: React.FC<{
  eventId: string
  preset: { teacherId?: string; time?: OpenTime } | null
  teachers: BoardColumn[]
  allColumns: BoardColumn[]
  openTimesOf: (teacherId: string) => OpenTime[]
  dayLabel: (dayId: string) => string
  onClose: () => void
  onDone: (message: string) => void
  onError: (message: string) => void
}> = ({ eventId, preset, allColumns, openTimesOf, dayLabel, onClose, onDone, onError }) => {
  const [q, setQ] = useState('')
  const [families, setFamilies] = useState<MeetingFamily[]>([])
  const [family, setFamily] = useState<MeetingFamily | null>(null)
  const [teacherId, setTeacherId] = useState('')
  const [kids, setKids] = useState<Set<string>>(new Set())
  const [time, setTime] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!preset) return
    setQ(''); setFamily(null); setKids(new Set())
    setTeacherId(preset.teacherId || '')
    setTime(preset.time ? timeKey(preset.time) : '')
  }, [preset])

  useEffect(() => {
    if (!preset) return
    const handle = setTimeout(() => {
      searchMeetingFamilies(eventId, q).then((r) => setFamilies(r.data)).catch(() => setFamilies([]))
    }, 250)
    return () => clearTimeout(handle)
  }, [q, eventId, preset])

  const teacherChoices = family ? family.teachers : []
  const chosen = teacherChoices.find((t) => t.teacherId === teacherId)
  useEffect(() => {
    if (chosen) setKids(new Set(chosen.studentIds.filter((id) => !chosen.bookedStudentIds.includes(id))))
  }, [chosen])
  const name = (id: string) => allColumns.find((c) => c.teacherId === id)?.name || family?.teachers.find((t) => t.teacherId === id)?.name || 'Teacher'

  const save = async () => {
    if (!family || !teacherId || !time) return
    const [dayId, start] = time.split('|')
    setSaving(true)
    try {
      await officeBookMeeting(eventId, { teacherId, dayId, startMin: Number(start), studentIds: [...kids] })
      onDone(`Booked for the ${family.label}. They're getting an email.`)
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Could not book')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={Boolean(preset)} onClose={onClose} size="lg" ariaLabel="Book for a family">
      <ModalHeader title="Book for a family" subtitle={preset?.teacherId ? `${name(preset.teacherId)}${preset.time ? ` · ${dayLabel(preset.time.dayId)}, ${timeLabel(preset.time.start)}` : ''}` : 'A family who phoned or came to the office.'} icon={UserGroupIcon} />
      <ModalBody>
        <FormSection label="Family">
          {family ? (
            <div className="flex items-center justify-between rounded-xl border border-cyan-200 bg-cyan-50/60 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-slate-900">{family.label}</p>
                <p className="text-xs text-slate-500">{joinNames(family.children.map((c) => `${c.firstName} (${c.gradeLabel})`))}{family.guardians.length ? ` · ${joinNames(family.guardians)}` : ''}</p>
              </div>
              <button type="button" className="text-sm font-medium text-cyan-700" onClick={() => setFamily(null)}>Change</button>
            </div>
          ) : (
            <>
              <input autoFocus aria-label="Search families" placeholder="Search a child or parent" className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} />
              <ul className="max-h-60 divide-y divide-slate-100 overflow-y-auto rounded-xl border border-slate-200">
                {families.filter((f) => !preset?.teacherId || f.teachers.some((t) => t.teacherId === preset.teacherId)).map((f) => (
                  <li key={f.familyKey}>
                    <button type="button" onClick={() => { setFamily(f); if (!preset?.teacherId) setTeacherId('') }} className="w-full px-4 py-2.5 text-left hover:bg-slate-50">
                      <span className="block text-sm font-medium text-slate-900">{f.label}</span>
                      <span className="block text-xs text-slate-500">{joinNames(f.children.map((c) => `${c.firstName} (${c.gradeLabel})`))} · {f.bookings} booked</span>
                    </button>
                  </li>
                ))}
                {families.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-400">No families found</li>}
              </ul>
            </>
          )}
        </FormSection>
        {family && (
          <FormSection label="Meeting">
            <Field label="Teacher" htmlFor="book-teacher">
              <select id="book-teacher" className={selectClass} value={teacherId} onChange={(e) => { setTeacherId(e.target.value); setTime('') }}>
                <option value="">Choose a teacher…</option>
                {teacherChoices.map((t) => (
                  <option key={t.teacherId} value={t.teacherId} disabled={t.bookedStudentIds.length === t.studentIds.length}>
                    {t.name}{t.bookedStudentIds.length === t.studentIds.length ? ' · booked' : ''}
                  </option>
                ))}
              </select>
            </Field>
            {chosen && chosen.studentIds.length > 1 && (
              <div className="space-y-1">
                {chosen.studentIds.map((id) => (
                  <label key={id} className="flex items-center gap-2 text-sm text-slate-700">
                    <input type="checkbox" className="h-4 w-4 accent-cyan-600" disabled={chosen.bookedStudentIds.includes(id)} checked={kids.has(id)}
                      onChange={() => setKids((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })} />
                    {family.children.find((c) => c.studentId === id)?.firstName}{chosen.bookedStudentIds.includes(id) ? ' (already booked)' : ''}
                  </label>
                ))}
              </div>
            )}
            {teacherId && (
              <Field label="Time" htmlFor="book-time">
                <select id="book-time" className={selectClass} value={time} onChange={(e) => setTime(e.target.value)}>
                  <option value="">Choose a time…</option>
                  {openTimesOf(teacherId).map((t) => <option key={timeKey(t)} value={timeKey(t)}>{dayLabel(t.dayId)}, {timeLabel(t.start)}</option>)}
                </select>
              </Field>
            )}
          </FormSection>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button disabled={!family || !teacherId || !time || kids.size === 0} loading={saving} onClick={() => void save()}>Book</Button>
      </ModalFooter>
    </Modal>
  )
}

export default BoardTab
