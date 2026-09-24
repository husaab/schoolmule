'use client'

// Mark one day for several people at once: a snow day everyone missed, a PD
// day that counted as a half day, a field trip. The page applies it person by
// person; anyone it could not save for is listed here so nothing silently
// slips.

import React, { useEffect, useMemo, useState } from 'react'
import { CalendarDaysIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import SearchInput from './SearchInput'
import Modal from '@/components/shared/modal'
import { ModalHeader, ModalBody, ModalFooter, Field, FieldRow, Button, inputClass, textareaClass } from '@/components/shared/modalKit'
import type { StaffOption } from './StaffPicker'
import { filterByName, shortDate, todayKey } from './payPeriodFormat'

export interface MarkDayPayload {
  date: string
  status: 'PRESENT' | 'ABSENT'
  hours: number | null
  notes: string | null
  teacherIds: string[]
}

export interface MarkDayFailure {
  teacherId: string
  name: string
  message: string
}

interface MarkDayModalProps {
  isOpen: boolean
  staff: StaffOption[]
  /** Pre-tick these people (e.g. opened from one person's row). */
  initialTeacherIds?: string[]
  initialDate?: string
  /** Resolves with whoever could not be saved; empty means everyone was. */
  onSubmit: (payload: MarkDayPayload) => Promise<MarkDayFailure[]>
  onClose: () => void
}

const statusButton = (on: boolean, tone: 'emerald' | 'rose') =>
  `flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-sm font-semibold transition-colors cursor-pointer active:scale-[0.98] ${
    on
      ? tone === 'emerald'
        ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
        : 'border-rose-400 bg-rose-50 text-rose-700'
      : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
  }`

export default function MarkDayModal({ isOpen, staff, initialTeacherIds, initialDate, onSubmit, onClose }: MarkDayModalProps) {
  const [date, setDate] = useState(todayKey())
  const [status, setStatus] = useState<'PRESENT' | 'ABSENT'>('PRESENT')
  const [hours, setHours] = useState('')
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [failures, setFailures] = useState<MarkDayFailure[]>([])

  useEffect(() => {
    if (!isOpen) return
    setDate(initialDate ?? todayKey())
    setStatus('PRESENT')
    setHours('')
    setNotes('')
    setQuery('')
    setFailures([])
    setSelected(new Set(initialTeacherIds ?? []))
  }, [isOpen, initialDate, initialTeacherIds])

  const visible = useMemo(() => filterByName(staff, query), [staff, query])

  const hoursValue = hours.trim() === '' ? null : Number(hours)
  const hoursValid = hoursValue === null || (Number.isFinite(hoursValue) && hoursValue >= 0 && hoursValue <= 24)
  const dateValid = /^\d{4}-\d{2}-\d{2}$/.test(date)
  const count = selected.size
  const canSave = dateValid && hoursValid && count > 0 && !saving

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setFailures([])
    try {
      const failed = await onSubmit({
        date,
        status,
        hours: hoursValue,
        notes: notes.trim() || null,
        teacherIds: [...selected],
      })
      if (failed.length > 0) {
        setFailures(failed)
        // Leave only the people that still need saving ticked.
        setSelected(new Set(failed.map((f) => f.teacherId)))
      }
    } finally {
      setSaving(false)
    }
  }

  const verb = status === 'PRESENT' ? 'present' : 'absent'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        title="Mark a day"
        subtitle="Apply one status, and optionally hours and a note, to several people"
        icon={CalendarDaysIcon}
      />
      <ModalBody>
        <FieldRow>
          <Field label="Date" htmlFor="mark-date" required>
            <input id="mark-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
          </Field>
          <Field label="Mark as" required>
            <div className="flex gap-2">
              <button type="button" onClick={() => setStatus('PRESENT')} className={statusButton(status === 'PRESENT', 'emerald')}>
                <CheckCircleIcon className="h-5 w-5" />
                Present
              </button>
              <button type="button" onClick={() => setStatus('ABSENT')} className={statusButton(status === 'ABSENT', 'rose')}>
                <XCircleIcon className="h-5 w-5" />
                Absent
              </button>
            </div>
          </Field>
        </FieldRow>

        <FieldRow>
          <Field
            label="Hours this day"
            htmlFor="mark-hours"
            hint={hoursValue === null ? (status === 'PRESENT' ? "Blank counts each person's usual day" : 'Blank counts 0 h') : 'Counts exactly this for everyone'}
          >
            <input
              id="mark-hours"
              type="number"
              min={0}
              max={24}
              step={0.25}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              placeholder="Optional, e.g. 3.5"
              className={inputClass}
            />
            {!hoursValid && <p className="mt-1 text-xs text-rose-600">Hours must be between 0 and 24.</p>}
          </Field>
          <Field label="Note" htmlFor="mark-notes">
            <textarea
              id="mark-notes"
              rows={2}
              maxLength={500}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional, e.g. snow day"
              className={textareaClass}
            />
          </Field>
        </FieldRow>

        <Field label="Who" required hint={count === 0 ? 'Tick at least one person' : `${count} selected`}>
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center gap-2 border-b border-slate-100 p-2">
              <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a staff member" className="flex-1" />
              <button
                type="button"
                onClick={() => setSelected(new Set(visible.map((s) => s.id)))}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-50 cursor-pointer"
              >
                Select all
              </button>
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                disabled={count === 0}
                className="rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
              >
                Clear
              </button>
            </div>
            <ul className="max-h-56 overflow-y-auto p-1">
              {visible.length === 0 && <li className="px-2 py-3 text-center text-xs text-slate-400">No one matches.</li>}
              {visible.map((s) => {
                const on = selected.has(s.id)
                return (
                  <li key={s.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggle(s.id)}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="truncate">{s.name}</span>
                    </label>
                  </li>
                )
              })}
            </ul>
          </div>
        </Field>

        {failures.length > 0 && (
          <div className="rounded-xl border border-rose-100 bg-rose-50/70 px-4 py-3 text-sm text-rose-900">
            <p className="font-medium">
              Could not save for {failures.length} {failures.length === 1 ? 'person' : 'people'}. They stay ticked so you can try again.
            </p>
            <ul className="mt-1.5 space-y-1 text-xs opacity-90">
              {failures.map((f) => (
                <li key={f.teacherId}>
                  {f.name}: {f.message}
                </li>
              ))}
            </ul>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} disabled={!canSave}>
          {count > 0 && dateValid
            ? `Mark ${count} ${verb} for ${shortDate(date)}`
            : `Mark ${verb}`}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
