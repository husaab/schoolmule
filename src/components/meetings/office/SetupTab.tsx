'use client'

// The office's Setup tab: days and school hours (with everyone's breaks),
// meetings and booking, the automatic emails, and the teachers taking part
// with their own days and hours. Every control saves as it changes; a change
// that would leave a booked family without a time is refused with who's in
// the way. The side card opens booking (on a date, or now) and deletes.

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ClockIcon, PencilSquareIcon, PlusIcon, TrashIcon, XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ConfirmBody, ModalBody, ModalFooter, ModalHeader, inputClass, selectClass } from '@/components/shared/modalKit'
import TeacherHoursModal, { type HoursTeacher } from '@/components/meetings/TeacherHoursModal'
import type { MeetingSetup, SetupDay, SetupTeacher } from '@/services/types/meetings'
import {
  addMeetingBreak, addMeetingDay, deleteMeetingBreak, deleteMeetingDay, deleteMeetingEvent, scheduleMeetingEvent,
  sendMeetingsLastCall, setMeetingTeacher, unscheduleMeetingEvent, updateMeetingDay, updateMeetingSettings,
} from '@/services/meetingsService'
import { bookedTimesFrom, dayLong, instantLabel, parseTime, rangeLabel, timeLabel, toTimeInput } from '@/lib/meetings'
import { useMeetingsStore } from '@/store/useMeetingsStore'

interface Props {
  setup: MeetingSetup
  onChange: (setup: MeetingSetup) => void
  reload: () => Promise<void>
  notify: (message: string, type: 'success' | 'error') => void
}

const card = 'rounded-2xl border border-slate-200 bg-white shadow-sm'
const CUTOFFS: { value: string; label: string }[] = [
  { value: '1080', label: '6:00 PM the evening before each day' },
  { value: '1200', label: '8:00 PM the evening before each day' },
  { value: '1260', label: '9:00 PM the evening before each day' },
  { value: '1320', label: '10:00 PM the evening before each day' },
  { value: '1439', label: 'Midnight the night before each day' },
  { value: 'none', label: 'Until each meeting starts' },
]

/** 'YYYY-MM-DDTHH:mm' in the browser's time zone, for <input type="datetime-local">. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
const fromLocalInput = (value: string) => (value ? new Date(value).toISOString() : null)

const SetupTab: React.FC<Props> = ({ setup, onChange, reload, notify }) => {
  const router = useRouter()
  const [editing, setEditing] = useState<SetupTeacher | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [removingDay, setRemovingDay] = useState<SetupDay | null>(null)
  // The opening time being typed; null shows the saved one.
  const [opensAtDraft, setOpensAt] = useState<string | null>(null)
  const opensAt = opensAtDraft ?? toLocalInput(setup.opensAt)
  const [busy, setBusy] = useState<string | null>(null)
  const isOpen = setup.status === 'open'

  const fail = (err: unknown, fallback: string) => {
    const lines = bookedTimesFrom(err)
    notify(`${err instanceof Error ? err.message : fallback}${lines.length ? ` (${lines.slice(0, 3).join('; ')}${lines.length > 3 ? '…' : ''})` : ''}`, 'error')
  }

  const settings = async (change: Parameters<typeof updateMeetingSettings>[1]) => {
    try {
      onChange((await updateMeetingSettings(setup.eventId, change)).data)
    } catch (err) {
      fail(err, 'Could not save')
      await reload()
    }
  }

  const act = async (key: string, work: () => Promise<unknown>, done?: string) => {
    setBusy(key)
    try {
      await work()
      await reload()
      // The sidebar's Meetings link follows the event's days and status.
      void useMeetingsStore.getState().loadOffice(true)
      if (done) notify(done, 'success')
    } catch (err) {
      fail(err, 'Could not save')
      await reload()
    } finally {
      setBusy(null)
    }
  }

  const hoursDays = setup.days.map((d) => ({ dayId: d.dayId, date: d.date, start: d.start, end: d.end, everyone: d.everyone, breaks: d.breaks }))
  const hoursTeacher = (t: SetupTeacher): HoursTeacher => ({
    name: t.name, subtitle: `${t.teaches} · ${t.families} families`, slotMinutes: t.slotMinutes, room: t.room,
    takingPart: t.takingPart, families: t.families, days: t.days,
  })
  const taking = setup.teachers.filter((t) => t.takingPart)

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="min-w-0 flex-1 space-y-5">
        {/* Days and school hours */}
        <section data-tour="meetings.setupDays" className={`${card} p-5`}>
          <h2 className="text-base font-semibold text-slate-900">Days and school hours</h2>
          <p className="mt-1 text-sm text-slate-500">Every teacher uses these unless you give them their own days and hours in Teachers, below.</p>
          <div className="mt-4 space-y-3">
            {setup.days.map((d) => (
              <DayRow key={`${d.dayId}:${d.start}:${d.end}`} day={d} busy={busy} onSave={(patch) => act(`day:${d.dayId}`, () => updateMeetingDay(setup.eventId, d.dayId, patch))}
                onRemove={() => setRemovingDay(d)}
                onAddBreak={(b) => act(`break:${d.dayId}`, () => addMeetingBreak(setup.eventId, d.dayId, b))}
                onRemoveBreak={(id) => act(`break:${id}`, () => deleteMeetingBreak(setup.eventId, id))}
              />
            ))}
            <AddDay onAdd={(date) => act('day:new', () => addMeetingDay(setup.eventId, { date }))} />
          </div>
        </section>

        {/* Meetings and booking */}
        <section className={`${card} p-5`}>
          <h2 className="text-base font-semibold text-slate-900">Meetings and booking</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm text-slate-700">Each meeting (school default)
              <select className={`${selectClass} mt-1.5`} value={setup.slotMinutes} onChange={(e) => void settings({ slotMinutes: Number(e.target.value) })}>
                {[5, 10, 15, 20, 30].map((n) => <option key={n} value={n}>{n} minutes</option>)}
              </select>
            </label>
            <label className="text-sm text-slate-700">Families can book, change and cancel until
              <select className={`${selectClass} mt-1.5`} value={setup.cutoffMin == null ? 'none' : String(setup.cutoffMin)} onChange={(e) => void settings({ cutoffMin: e.target.value === 'none' ? null : Number(e.target.value) })}>
                {!CUTOFFS.some((c) => c.value === String(setup.cutoffMin)) && setup.cutoffMin != null && <option value={String(setup.cutoffMin)}>{timeLabel(setup.cutoffMin)} the evening before</option>}
                {CUTOFFS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </label>
          </div>
          <div className="mt-4 space-y-1 border-t border-slate-100 pt-3">
            <Check checked={setup.useGradeRoom} onChange={(v) => void settings({ useGradeRoom: v })} label="Meetings are in the child's grade room" hint="A teacher can have a fixed room instead (Teachers, below)." />
            <Check checked={setup.allowPhone} onChange={(v) => void settings({ allowPhone: v })} label="Families can choose a phone call instead" hint="When booking, a family picks In person or Phone call and gives the number to call. The teacher calls them at the meeting time. Meetings already booked stay as they are." />
            <Check checked={setup.siblingsShare} onChange={(v) => void settings({ siblingsShare: v })} label="Siblings who share a teacher get one meeting" hint="Parents can tick for separate meetings." />
            <Check checked={setup.teachersEditHours} onChange={(v) => void settings({ teachersEditHours: v })} label="Teachers can change their own days and hours" hint="From My Meetings, any time. They can add times, take breaks and close open times. Booked times stay put." />
          </div>
        </section>

        {/* Emails */}
        <section className={`${card} p-5`}>
          <h2 className="text-base font-semibold text-slate-900">Emails</h2>
          <div className="mt-2 divide-y divide-slate-100">
            <EmailRow checked={setup.emailInvite} onChange={(v) => void settings({ emailInvite: v })} title="Invitation to every family" hint={setup.openedAt ? `Sent ${instantLabel(setup.openedAt)}` : 'When booking opens. Families with no account are invited to make one.'} disabled={isOpen} />
            <EmailRow checked={setup.emailLastCall} onChange={(v) => void settings({ emailLastCall: v })} title={'"Times are still open" to families who haven\'t booked'} hint={setup.lastCallSentAt ? `Sent ${instantLabel(setup.lastCallSentAt)}` : undefined}>
              {!setup.lastCallSentAt && (
                <input type="datetime-local" aria-label="When it goes" className={`${inputClass} !w-56`} value={toLocalInput(setup.lastCallAt)} onChange={(e) => void settings({ lastCallAt: fromLocalInput(e.target.value) })} />
              )}
            </EmailRow>
            <EmailRow checked={setup.emailReminder} onChange={(v) => void settings({ emailReminder: v })} title="Reminder to booked families" hint="The evening before, with their times">
              <select aria-label="Reminder time" className={`${selectClass} !w-36`} value={setup.reminderMin} onChange={(e) => void settings({ reminderMin: Number(e.target.value) })}>
                {[960, 1020, 1080, 1140, 1200].map((m) => <option key={m} value={m}>{timeLabel(m)}</option>)}
              </select>
            </EmailRow>
            <EmailRow checked={setup.emailTeacherList} onChange={(v) => void settings({ emailTeacherList: v })} title="Each teacher's list for the next day" hint={`${setup.cutoffMin == null ? '8:00 PM' : timeLabel(setup.cutoffMin)} the evening before, once booking closes`} />
          </div>
          <p className="mt-3 text-xs text-slate-500">Booking confirmations and changes always send.</p>
        </section>

        {/* Teachers */}
        <section data-tour="meetings.setupTeachers" className={`${card} p-5`}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-base font-semibold text-slate-900">Teachers taking part · {taking.length} of {setup.teachers.length}</h2>
            <span className="text-sm text-slate-500">Click a teacher’s days to give them their own hours, breaks or meeting length.</span>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[660px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold text-slate-500">
                  <th className="w-8 py-2.5" />
                  <th className="py-2.5 pr-3">Teacher</th>
                  <th className="py-2.5 pr-3">Days and hours</th>
                  <th className="py-2.5 pr-3">Families</th>
                  <th className="py-2.5 pr-3">Demand</th>
                  <th className="py-2.5">Room</th>
                </tr>
              </thead>
              <tbody>
                {setup.teachers.map((t) => (
                  <tr key={t.teacherId} className="border-b border-slate-100 align-middle">
                    <td className="py-3">
                      <input type="checkbox" aria-label={`${t.name} takes part`} className="h-4 w-4 accent-cyan-600" checked={t.takingPart} disabled={busy === `t:${t.teacherId}`}
                        onChange={(e) => void act(`t:${t.teacherId}`, () => setMeetingTeacher(setup.eventId, t.teacherId, { takingPart: e.target.checked }))} />
                    </td>
                    <td className="py-3 pr-3">
                      <p className={`font-medium ${t.takingPart ? 'text-slate-900' : 'text-slate-400'}`}>{t.name}</p>
                      <p className="text-xs text-slate-500">{t.teaches}</p>
                    </td>
                    <td className="py-3 pr-3">
                      <button type="button" onClick={() => setEditing(t)} disabled={!t.takingPart} className="-mx-2 flex items-start gap-2 rounded-lg px-2 py-1 text-left text-xs text-slate-700 hover:bg-cyan-50 disabled:opacity-50">
                        <PencilSquareIcon className="mt-0.5 h-4 w-4 shrink-0 text-cyan-700" />
                        <span>{daysSummary(setup, t)}</span>
                      </button>
                    </td>
                    <td className="py-3 pr-3">{t.takingPart ? t.families : '–'}</td>
                    <td className="py-3 pr-3">{t.takingPart ? <Demand t={t} /> : <span className="text-slate-400">Not taking part</span>}</td>
                    <td className="whitespace-nowrap py-3 text-xs text-slate-500">
                      {t.room || (setup.useGradeRoom ? 'Grade room' : '–')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-slate-500">Families = families with a child in the teacher’s report-card classes this term, or their homeroom. Classes left off report cards (like Salaat) don’t count.</p>
        </section>
      </div>

      {/* Side */}
      <aside className="flex w-full flex-col gap-4 lg:w-80">
        <section data-tour="meetings.openBooking" className={`${card} p-5`}>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{isOpen ? 'Booking is open' : 'When booking opens'}</p>
          <p className="mb-4 mt-1 text-xl font-bold text-slate-900">
            {isOpen ? (setup.openedAt ? `Since ${instantLabel(setup.openedAt)}` : 'Open') : setup.status === 'scheduled' && setup.opensAt ? instantLabel(setup.opensAt) : 'Not scheduled'}
          </p>
          <dl className="space-y-2 text-sm">
            <Stat label={isOpen ? 'Families booked' : 'Families invited'} value={isOpen ? `${setup.stats.familiesBooked} of ${setup.stats.families}` : setup.stats.families} />
            {!isOpen && <Stat label="Book with one tap" value={setup.stats.oneTap} />}
            {!isOpen && <Stat label="Create an account first" value={setup.stats.createAccount} />}
            {!isOpen && (setup.stats.noEmail ?? 0) > 0 && <Stat label="No email on file" value={setup.stats.noEmail} />}
            <Stat label="Times available" value={setup.stats.times} />
            {isOpen && <Stat label="Meetings booked" value={setup.stats.bookings} />}
          </dl>
          {!isOpen ? (
            <div className="mt-5 space-y-2">
              <label className="block text-sm text-slate-700">Open booking at
                <input type="datetime-local" className={`${inputClass} mt-1.5`} value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
              </label>
              <Button className="w-full" loading={busy === 'schedule'} disabled={!opensAt || !setup.days.length}
                onClick={() => void act('schedule', () => scheduleMeetingEvent(setup.eventId, fromLocalInput(opensAt)), new Date(opensAt) <= new Date() ? 'Booking is open. The invitations are going out.' : 'Booking will open on time, by itself.')}>
                {setup.status === 'scheduled' ? 'Change opening time' : `Open booking${opensAt ? ` on ${instantLabel(fromLocalInput(opensAt)!)}` : ''}`}
              </Button>
              <Button variant="secondary" className="w-full" loading={busy === 'now'} disabled={!setup.days.length}
                onClick={() => void act('now', () => scheduleMeetingEvent(setup.eventId, null), 'Booking is open. The invitations are going out.')}>
                Open booking now
              </Button>
              {setup.status === 'scheduled' && (
                <Button variant="secondary" className="w-full" loading={busy === 'draft'} onClick={() => void act('draft', () => unscheduleMeetingEvent(setup.eventId), 'Back to a draft.')}>
                  Back to draft
                </Button>
              )}
            </div>
          ) : (
            <Button variant="secondary" className="mt-5 w-full" loading={busy === 'lastcall'}
              onClick={() => void act('lastcall', () => sendMeetingsLastCall(setup.eventId), 'Sent to every family that hasn\'t booked.')}>
              <EnvelopeIcon className="h-4 w-4" /> Email families who haven’t booked
            </Button>
          )}
          <p className="mt-3 text-xs text-slate-500">You can change hours later. Booked families only move when you move them, and they get an email when you do.</p>
        </section>
        <section className={`${card} p-5`}>
          <p className="font-semibold text-rose-700">Delete these meetings</p>
          <p className="mb-3 mt-1 text-sm text-slate-500">Cancels every booking and emails each family that it was cancelled.</p>
          <Button variant="secondary" className="!border-rose-200 !text-rose-700" onClick={() => setDeleting(true)}><TrashIcon className="h-4 w-4" /> Delete…</Button>
        </section>
      </aside>

      <TeacherHoursModal
        isOpen={Boolean(editing)}
        onClose={() => setEditing(null)}
        office
        teacher={editing ? hoursTeacher(editing) : null}
        days={hoursDays}
        defaultSlotMinutes={setup.slotMinutes}
        onSave={async (change) => {
          const res = await setMeetingTeacher(setup.eventId, editing!.teacherId, change)
          onChange(res.data)
          notify(`${editing!.name}'s hours are saved.`, 'success')
        }}
      />

      <Modal isOpen={deleting} onClose={() => setDeleting(false)} size="md" ariaLabel="Delete these meetings">
        <ModalHeader title="Delete these meetings?" tone="danger" icon={TrashIcon} />
        <ModalBody>
          <ConfirmBody consequences={{
            title: 'What happens',
            items: [
              setup.stats.bookings ? `${setup.stats.bookings} booked ${setup.stats.bookings === 1 ? 'meeting is' : 'meetings are'} cancelled, and each family is emailed.` : 'No meetings are booked yet.',
              'Families and teachers no longer see these meetings.',
            ],
          }}>
            This deletes {setup.title} and can’t be undone.
          </ConfirmBody>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleting(false)}>Keep them</Button>
          <Button variant="danger" loading={busy === 'delete'} onClick={async () => {
            setBusy('delete')
            try {
              await deleteMeetingEvent(setup.eventId)
              void useMeetingsStore.getState().loadOffice(true)
              notify('Deleted.', 'success')
              router.push('/admin-panel/parent-teacher-meetings')
            } catch (err) {
              fail(err, 'Could not delete')
              setBusy(null)
            }
          }}>Delete</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={Boolean(removingDay)} onClose={() => setRemovingDay(null)} size="md" ariaLabel="Remove this day">
        <ModalHeader title={removingDay ? `Remove ${dayLong(removingDay.date)}?` : 'Remove this day?'} tone="danger" />
        <ModalBody>
          <ConfirmBody>
            {removingDay?.bookings ? `${removingDay.bookings} ${removingDay.bookings === 1 ? 'family is' : 'families are'} booked that day. Move or cancel them on the Board first.` : 'Its times and breaks go with it.'}
          </ConfirmBody>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => setRemovingDay(null)}>Keep it</Button>
          <Button variant="danger" disabled={Boolean(removingDay?.bookings)} loading={busy === 'removeday'} onClick={async () => {
            const d = removingDay!
            setRemovingDay(null)
            await act('removeday', () => deleteMeetingDay(setup.eventId, d.dayId), 'Day removed.')
          }}>Remove day</Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

function daysSummary(setup: MeetingSetup, t: SetupTeacher): React.ReactNode {
  const own = t.days.some((d, i) => d.ownHours || d.breaks.length || d.works !== (setup.days[i]?.everyone ?? true)) || t.slotMinutes
  if (!own) return <>{setup.days.length > 1 ? 'Every day' : 'The day'}<br /><span className="text-slate-400">School hours</span></>
  const lines = t.days.map((d) => {
    const day = setup.days.find((x) => x.dayId === d.dayId)
    if (!day || !d.works) return null
    const label = new Date(`${day.date}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'short' })
    return `${label} ${d.ownHours ? rangeLabel(d.start, d.end) : 'school hours'}`
  }).filter(Boolean)
  const extras = [t.days.some((d) => d.breaks.length) ? 'own breaks' : null, t.slotMinutes ? `${t.slotMinutes}-min meetings` : null].filter(Boolean)
  return (
    <>
      {lines.length ? lines.map((l) => <span key={l} className="block">{l}</span>) : 'Not working any day'}
      <span className="ml-0 mt-0.5 inline-block rounded-full bg-cyan-50 px-1.5 text-[11px] font-semibold text-cyan-700">Own</span>
      {extras.length > 0 && <span className="block text-slate-400">{extras.join(' · ')}</span>}
    </>
  )
}

const Demand: React.FC<{ t: SetupTeacher }> = ({ t }) => {
  const ratio = t.perTime ?? 0
  const tone = !t.times ? { bar: 'bg-slate-300', text: 'text-slate-500', label: 'No times' }
    : ratio > 1.5 ? { bar: 'bg-rose-500', text: 'text-rose-700', label: `${ratio} per time, fills first` }
      : ratio > 1 ? { bar: 'bg-amber-500', text: 'text-amber-700', label: `${ratio} per time` }
        : { bar: 'bg-emerald-500', text: 'text-emerald-700', label: 'Fits' }
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-12 shrink-0 overflow-hidden rounded-full bg-slate-100"><span className={`block h-full ${tone.bar}`} style={{ width: `${Math.min(100, Math.round(ratio * 100))}%` }} /></span>
      <span className={`whitespace-nowrap text-xs font-medium ${tone.text}`}>{tone.label}</span>
    </span>
  )
}

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex justify-between"><dt className="text-slate-600">{label}</dt><dd className="font-semibold text-slate-900">{value}</dd></div>
)

const Check: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }> = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start gap-2.5 py-2 text-sm text-slate-900">
    <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-600" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span>{label}{hint && <span className="block text-xs text-slate-500">{hint}</span>}</span>
  </label>
)

const EmailRow: React.FC<{ checked: boolean; onChange: (v: boolean) => void; title: string; hint?: string; disabled?: boolean; children?: React.ReactNode }> = ({ checked, onChange, title, hint, disabled, children }) => (
  <div className="flex flex-wrap items-center gap-3 py-3">
    <input type="checkbox" aria-label={title} className="h-4 w-4 accent-cyan-600" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
    <div className="min-w-0 flex-1"><p className="text-sm text-slate-900">{title}</p>{hint && <p className="text-xs text-slate-500">{hint}</p>}</div>
    {children}
  </div>
)

const DayRow: React.FC<{
  day: SetupDay
  busy: string | null
  onSave: (patch: { start?: number; end?: number }) => void
  onRemove: () => void
  onAddBreak: (b: { start: number; end: number; label: string | null }) => void
  onRemoveBreak: (breakId: string) => void
}> = ({ day, busy, onSave, onRemove, onAddBreak, onRemoveBreak }) => {
  const [start, setStart] = useState(toTimeInput(day.start))
  const [end, setEnd] = useState(toTimeInput(day.end))
  const [adding, setAdding] = useState(false)
  const [b, setB] = useState({ start: '', end: '', label: '' })
  const commit = () => {
    const s = parseTime(start)
    const e = parseTime(end)
    if (s == null || e == null || (s === day.start && e === day.end)) return
    onSave({ start: s, end: e })
  }
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex flex-wrap items-end gap-3">
        <p className="w-52 pb-2 text-sm font-semibold text-slate-900">{dayLong(day.date)}{!day.everyone && <span className="block text-xs font-normal text-slate-500">Only for some teachers</span>}</p>
        <label className="flex flex-col text-xs text-slate-600">Starts<input type="time" step={300} className={`${inputClass} mt-1 !w-32`} value={start} onChange={(e) => setStart(e.target.value)} onBlur={commit} /></label>
        <label className="flex flex-col text-xs text-slate-600">Ends<input type="time" step={300} className={`${inputClass} mt-1 !w-32`} value={end} onChange={(e) => setEnd(e.target.value)} onBlur={commit} /></label>
        <div className="ml-auto pb-1 text-right">
          <p className="text-sm font-semibold text-slate-900">{day.timesPerTeacher} times</p>
          <p className="text-xs text-slate-500">per teacher{day.bookings ? ` · ${day.bookings} booked` : ''}</p>
        </div>
        <button type="button" aria-label={`Remove ${dayLong(day.date)}`} onClick={onRemove} className="mb-1 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><TrashIcon className="h-4 w-4" /></button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="w-52 text-xs text-slate-500">Breaks for everyone</span>
        {day.breaks.length === 0 && !adding && <span className="text-xs text-slate-400">None</span>}
        {day.breaks.map((br) => (
          <span key={br.breakId} className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-3 pr-1.5 text-xs text-slate-700">
            {rangeLabel(br.start, br.end)}{br.label ? ` · ${br.label}` : ''}
            <button type="button" aria-label="Remove break" disabled={busy === `break:${br.breakId}`} onClick={() => onRemoveBreak(br.breakId)} className="rounded-full p-0.5 hover:bg-slate-200"><XMarkIcon className="h-3.5 w-3.5" /></button>
          </span>
        ))}
        {adding ? (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            <input type="time" step={300} aria-label="Break starts" className={`${inputClass} !w-28 !py-1.5`} value={b.start} onChange={(e) => setB({ ...b, start: e.target.value })} />
            <input type="time" step={300} aria-label="Break ends" className={`${inputClass} !w-28 !py-1.5`} value={b.end} onChange={(e) => setB({ ...b, end: e.target.value })} />
            <input aria-label="Break name" placeholder="Maghrib" className={`${inputClass} !w-28 !py-1.5`} value={b.label} onChange={(e) => setB({ ...b, label: e.target.value })} />
            <Button className="!py-1.5" disabled={parseTime(b.start) == null || parseTime(b.end) == null} onClick={() => { onAddBreak({ start: parseTime(b.start)!, end: parseTime(b.end)!, label: b.label.trim() || null }); setAdding(false); setB({ start: '', end: '', label: '' }) }}>Add</Button>
            <Button variant="secondary" className="!py-1.5" onClick={() => setAdding(false)}>Cancel</Button>
          </span>
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-cyan-700 hover:bg-cyan-50"><PlusIcon className="h-3.5 w-3.5" /> Add a break</button>
        )}
      </div>
    </div>
  )
}

const AddDay: React.FC<{ onAdd: (date: string) => void }> = ({ onAdd }) => {
  const [open, setOpen] = useState(false)
  const [date, setDate] = useState('')
  if (!open) {
    return <Button variant="secondary" onClick={() => setOpen(true)}><PlusIcon className="h-4 w-4" /> Add a day</Button>
  }
  return (
    <div className="flex flex-wrap items-center gap-2">
      <input type="date" aria-label="New day" className={`${inputClass} !w-48`} value={date} onChange={(e) => setDate(e.target.value)} />
      <Button disabled={!date} onClick={() => { onAdd(date); setOpen(false); setDate('') }}><ClockIcon className="h-4 w-4" /> Add with school hours</Button>
      <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  )
}

export default SetupTab
