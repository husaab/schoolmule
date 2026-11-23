'use client'

// A teacher's day of parent–teacher meetings: every time in order (booked,
// open, closed, breaks), the Student summary for each family (this class, or
// all classes; the homeroom teacher gets all classes first), closing and
// reopening open times, their own hours, and Print my day (one PDF: the
// schedule, then the summaries in meeting order).

import React, { useEffect, useMemo, useState } from 'react'
import {
  ArrowDownTrayIcon,
  ClockIcon,
  DocumentTextIcon,
  LockClosedIcon,
  MapPinIcon,
  PhoneIcon,
  PrinterIcon,
  UserGroupIcon,
} from '@heroicons/react/24/outline'
import MenuButton, { type MenuItem } from '@/components/shared/MenuButton'
import { Button } from '@/components/shared/modalKit'
import PdfViewerModal from '@/components/reports/PdfViewerModal'
import TeacherHoursModal from '@/components/meetings/TeacherHoursModal'
import CallFromModal from './CallFromModal'
import type { TeacherBookingStudent, TeacherMeetingDay, TeacherMeetingEvent, TeacherSlot } from '@/services/types/meetings'
import { closeMyTimes, printMeetingDay, reopenMyTimes, setMyCallFrom, setMyHours, getMyMeetings } from '@/services/meetingsService'
import { generateStudentSummaryReport, generateStudentTermSummaryReport } from '@/services/reportService'
import { dayShort, dayLong, joinNames, rangeLabel, telHref, timeLabel } from '@/lib/meetings'

interface Props {
  event: TeacherMeetingEvent
  dayId: string
  setDayId: (dayId: string) => void
  autoPrint: boolean
  onPrinted: () => void
  onChange: (event: TeacherMeetingEvent) => void
  notify: (message: string, type: 'success' | 'error') => void
}

const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm'

type Row =
  | { kind: 'slot'; at: number; slot: TeacherSlot }
  | { kind: 'break'; at: number; end: number; label: string | null; own: boolean }

function rowsFor(day: TeacherMeetingDay): Row[] {
  const breaks: Row[] = [
    ...day.breaks.map((b) => ({ kind: 'break' as const, at: b.start, end: b.end, label: b.label, own: false })),
    ...day.ownBreaks.map((b) => ({ kind: 'break' as const, at: b.start, end: b.end, label: b.label, own: true })),
  ].filter((b) => b.at >= day.hoursStart && b.at < day.hoursEnd)
  return [...day.slots.map((slot) => ({ kind: 'slot' as const, at: slot.start, slot })), ...breaks].sort((a, b) => a.at - b.at)
}

const TeacherMeetings: React.FC<Props> = ({ event, dayId, setDayId, autoPrint, onPrinted, onChange, notify }) => {
  const day = event.days.find((d) => d.dayId === dayId) ?? event.days[0]
  const [pdf, setPdf] = useState<{ url: string; title: string; subtitle: string; filename: string } | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [hoursOpen, setHoursOpen] = useState(false)
  const [callFromOpen, setCallFromOpen] = useState(false)
  const shownNumber = event.callFrom || event.myPhone || null
  const rows = useMemo(() => (day ? rowsFor(day) : []), [day])

  const refresh = async () => {
    const res = await getMyMeetings()
    const fresh = res.data.events.find((e) => e.eventId === event.eventId)
    if (fresh) onChange(fresh)
  }

  const showPdf = (blob: Blob, title: string, subtitle: string, filename: string) => {
    if (pdf) URL.revokeObjectURL(pdf.url)
    setPdf({ url: URL.createObjectURL(blob), title, subtitle, filename })
  }

  const print = async () => {
    if (!day) return
    setBusy('print')
    try {
      const blob = await printMeetingDay(event.eventId, day.dayId)
      showPdf(blob, 'Print my day', `${dayLong(day.date)} · ${day.booked} meetings`, `Meetings_${day.date}.pdf`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not make the PDF', 'error')
    } finally {
      setBusy(null)
    }
  }

  // The teacher list email's "Print my day" lands here with ?print=1.
  useEffect(() => {
    if (autoPrint && day && day.booked > 0) {
      onPrinted()
      void print()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoPrint, day?.dayId])

  const summary = async (s: TeacherBookingStudent, which: { classId: string; subject: string | null } | 'all') => {
    setBusy(`summary:${s.studentId}`)
    try {
      const blob = which === 'all'
        ? await generateStudentTermSummaryReport(s.studentId, event.termId!)
        : await generateStudentSummaryReport(s.studentId, which.classId)
      showPdf(blob, s.name, which === 'all' ? 'Student summary · all classes' : `Student summary · ${which.subject ?? 'Class'}`, `${s.name.replace(/\s+/g, '_')}_Summary.pdf`)
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not open the summary', 'error')
    } finally {
      setBusy(null)
    }
  }

  const close = async (slot: TeacherSlot) => {
    setBusy(`slot:${slot.start}`)
    try {
      if (slot.closedBreakId) await reopenMyTimes(event.eventId, slot.closedBreakId)
      else await closeMyTimes(event.eventId, { dayId: day!.dayId, start: slot.start, end: slot.end })
      await refresh()
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Could not change that time', 'error')
    } finally {
      setBusy(null)
    }
  }

  const menuFor = (s: TeacherBookingStudent): MenuItem[] => {
    const classes: MenuItem[] = s.classes.map((c) => ({
      key: c.classId,
      label: c.subject || 'Class summary',
      description: 'This class: grades and every assessment',
      icon: DocumentTextIcon,
      onSelect: () => void summary(s, c),
    }))
    const all: MenuItem = {
      key: 'all',
      label: s.homeroom ? 'All classes (homeroom)' : 'All my classes',
      description: s.homeroom ? 'Every class this term, after a page of term grades' : 'Every class you teach them this term',
      icon: UserGroupIcon,
      disabled: !event.termId,
      onSelect: () => void summary(s, 'all'),
    }
    return s.homeroom ? [all, ...classes] : [...classes, ...(classes.length > 1 ? [all] : [])]
  }

  if (!day) return null
  const hoursDays = event.days.map((d) => ({ dayId: d.dayId, date: d.date, start: d.start, end: d.end, everyone: d.everyone, breaks: d.breaks }))

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <section data-tour="meetings.schedule" className={`${card} min-w-0 flex-1`}>
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="tablist">
            {event.days.map((d) => (
              <button
                key={d.dayId}
                type="button"
                role="tab"
                aria-selected={d.dayId === day.dayId}
                onClick={() => setDayId(d.dayId)}
                className={`rounded-lg px-3 py-1.5 text-sm ${d.dayId === day.dayId ? 'bg-white font-medium text-cyan-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {dayShort(d.date)} · {d.booked}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            {day.works ? `${rangeLabel(day.hoursStart, day.hoursEnd)} · ${day.booked} booked · ${day.open} open` : 'Not working this day'}
          </p>
        </header>
        {!day.works || rows.length === 0 ? (
          <p className="px-5 py-16 text-center text-sm text-slate-500">No meeting times on {dayLong(day.date)}.</p>
        ) : (
          <ol className="divide-y divide-slate-100">
            {rows.map((r) => {
              if (r.kind === 'break') {
                return (
                  <li key={`b${r.at}`} className="flex items-center gap-4 bg-slate-50/70 px-5 py-3 text-sm text-slate-500">
                    <span className="w-20 shrink-0 font-medium">{timeLabel(r.at)}</span>
                    <span>Break{r.label ? ` · ${r.label}` : ''} until {timeLabel(r.end)}{r.own ? ' (yours)' : ''}</span>
                  </li>
                )
              }
              const { slot } = r
              const b = slot.booking
              return (
                <li key={slot.start} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 ${slot.past ? 'opacity-60' : ''}`}>
                  <span className="w-20 shrink-0 text-sm font-semibold text-slate-900">{timeLabel(slot.start)}</span>
                  {b ? (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-slate-900">{joinNames(b.students.map((s) => s.name))}</span>
                        <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                          {b.students.map((s) => [s.gradeLabel, [s.homeroom ? 'Homeroom' : null, ...s.subjects].filter(Boolean).join(', ')].filter(Boolean).join(' ')).join(' · ')}
                          {b.guardians.length > 0 && <><span aria-hidden="true">·</span>{joinNames(b.guardians)}</>}
                          {b.mode === 'phone' && b.phone ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-800">
                                <PhoneIcon className="h-3.5 w-3.5" aria-hidden="true" />
                                Phone call: <a href={telHref(b.phone)} className="underline decoration-amber-300 underline-offset-2 hover:text-amber-900">{b.phone}</a>
                              </span>
                            </>
                          ) : b.room && <><span aria-hidden="true">·</span><MapPinIcon className="h-3.5 w-3.5" />{b.room}</>}
                        </span>
                      </span>
                      <span className="flex flex-wrap gap-2">
                        {b.students.map((s) => (
                          <MenuButton
                            key={s.studentId}
                            label={`Summary for ${s.firstName}`}
                            heading={s.firstName.toUpperCase()}
                            items={menuFor(s)}
                            trigger={
                              <span data-tour="meetings.summary" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
                                <DocumentTextIcon className="h-4 w-4" />
                                {busy === `summary:${s.studentId}` ? 'Opening…' : b.students.length > 1 ? `${s.firstName}'s summary` : 'Summary'}
                              </span>
                            }
                          />
                        ))}
                      </span>
                    </>
                  ) : slot.closed ? (
                    <>
                      <span className="flex flex-1 items-center gap-2 text-sm text-slate-500"><LockClosedIcon className="h-4 w-4" />Closed{slot.closedLabel ? ` · ${slot.closedLabel}` : ''}</span>
                      {slot.closedBreakId && !slot.past && (
                        <button type="button" disabled={busy === `slot:${slot.start}`} onClick={() => void close(slot)} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-cyan-700 hover:bg-cyan-50">Reopen</button>
                      )}
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-slate-400">Open</span>
                      {!slot.past && (
                        <button type="button" data-tour="meetings.close" disabled={busy === `slot:${slot.start}`} onClick={() => void close(slot)} className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100">Close</button>
                      )}
                    </>
                  )}
                </li>
              )
            })}
          </ol>
        )}
      </section>

      <aside className="flex w-full flex-col gap-4 lg:w-80">
        {event.allowPhone && event.takingPart && (
          <section className={`${card} p-5 ${shownNumber ? '' : 'border-amber-200 bg-amber-50/60'}`}>
            <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-slate-900">
              <PhoneIcon className="h-4 w-4 text-slate-500" aria-hidden="true" /> Phone calls
            </h2>
            <p className="mb-3 text-sm text-slate-600">
              Families can book a phone call instead of coming in. At the time, you call them at the number on their meeting.
            </p>
            {shownNumber ? (
              <p className="mb-3 text-sm text-slate-700">They see you’ll call from <span className="font-medium text-slate-900">{shownNumber}</span>.</p>
            ) : (
              <p className="mb-3 text-sm font-medium text-amber-800">Add the number you’ll call from, so families know it’s you.</p>
            )}
            <Button variant={shownNumber ? 'secondary' : 'warning'} className="w-full" onClick={() => setCallFromOpen(true)}>
              <PhoneIcon className="h-4 w-4" /> {shownNumber ? 'Change the number' : 'Add my number'}
            </Button>
          </section>
        )}
        <section data-tour="meetings.print" className={`${card} p-5`}>
          <h2 className="mb-1 text-base font-semibold text-slate-900">Print my day</h2>
          <p className="mb-4 text-sm text-slate-500">One PDF: this schedule, then each family’s Student summary in meeting order.</p>
          <Button className="w-full" loading={busy === 'print'} disabled={day.booked === 0} onClick={() => void print()}>
            <PrinterIcon className="h-4 w-4" /> Print {dayShort(day.date).split(',')[0]} · {day.booked} {day.booked === 1 ? 'family' : 'families'}
          </Button>
          {event.emailTeacherList && <p className="mt-3 text-xs text-slate-500">You’ll also get each day’s list by email the evening before, once booking closes.</p>}
        </section>
        <section data-tour="meetings.hours" className={`${card} p-5`}>
          <h2 className="mb-1 text-base font-semibold text-slate-900">My hours</h2>
          <p className="mb-3 text-sm text-slate-500">{event.canEditHours ? 'You and the office can both change these.' : 'The office sets the hours for these meetings.'}</p>
          <dl className="divide-y divide-slate-100 text-sm">
            {event.days.map((d) => (
              <div key={d.dayId} className="flex justify-between gap-3 py-2">
                <dt className="text-slate-500">{dayShort(d.date)}</dt>
                <dd className="text-right font-medium text-slate-900">
                  {d.works ? rangeLabel(d.hoursStart, d.hoursEnd) : 'Not working'}
                  {[...d.breaks, ...d.ownBreaks].map((b) => (
                    <span key={b.breakId} className="block text-xs font-normal text-slate-500">Break {rangeLabel(b.start, b.end)}{b.label ? ` · ${b.label}` : ''}</span>
                  ))}
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-3 py-2"><dt className="text-slate-500">Each meeting</dt><dd className="font-medium text-slate-900">{event.teacherSlotMinutes} minutes</dd></div>
          </dl>
          {event.canEditHours && (
            <Button variant="secondary" className="mt-3 w-full" onClick={() => setHoursOpen(true)}>
              <ClockIcon className="h-4 w-4" /> Change my days and hours
            </Button>
          )}
          <p className="mt-3 text-xs text-slate-500">To close one time, use Close next to it. Booked times stay put; the office moves families if needed.</p>
        </section>
      </aside>

      <CallFromModal
        isOpen={callFromOpen}
        onClose={() => setCallFromOpen(false)}
        callFrom={event.callFrom ?? null}
        myPhone={event.myPhone ?? null}
        onSave={async (callFrom) => {
          const res = await setMyCallFrom(event.eventId, callFrom)
          onChange(res.data)
          notify(callFrom || event.myPhone ? 'Saved. Families with a phone call see this number.' : 'Saved.', 'success')
        }}
      />

      <TeacherHoursModal
        isOpen={hoursOpen}
        onClose={() => setHoursOpen(false)}
        office={false}
        pronoun="your"
        defaultSlotMinutes={event.slotMinutes}
        days={hoursDays}
        teacher={{
          name: event.teacher?.name || 'Me',
          slotMinutes: event.ownSlotMinutes,
          room: event.room,
          takingPart: event.takingPart,
          days: event.days.map((d) => ({ dayId: d.dayId, works: d.works, ownHours: d.ownHours, start: d.hoursStart, end: d.hoursEnd, breaks: d.ownBreaks })),
        }}
        onSave={async (change) => {
          const res = await setMyHours(event.eventId, { slotMinutes: change.slotMinutes, days: change.days })
          onChange(res.data)
          notify('Your hours are saved.', 'success')
        }}
      />

      <PdfViewerModal
        isOpen={Boolean(pdf)}
        onClose={() => { if (pdf) URL.revokeObjectURL(pdf.url); setPdf(null) }}
        src={pdf?.url ?? null}
        title={pdf?.title ?? ''}
        subtitle={pdf?.subtitle}
        actions={pdf && (
          <a href={pdf.url} download={pdf.filename} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3.5 text-sm font-medium text-white">
            <ArrowDownTrayIcon className="h-4 w-4" /> Download
          </a>
        )}
      />
    </div>
  )
}

export default TeacherMeetings
