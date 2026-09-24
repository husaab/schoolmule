'use client'

// Create / edit / remove the school's pay schedule. A pay period ends on the
// pay day (inclusive), so the preview sentence says exactly which days the
// next pay day will cover.

import React, { useEffect, useMemo, useState } from 'react'
import { BanknotesIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { ModalHeader, ModalBody, ModalFooter, Field, FieldRow, Button, inputClass } from '@/components/shared/modalKit'
import type { PayFrequency, PaySchedule, PaySchedulePayload } from '@/services/types/teacherAttendance'
import { format } from 'date-fns'

const FREQUENCIES: { value: PayFrequency; label: string; hint: string }[] = [
  { value: 'MONTHLY', label: 'Monthly', hint: 'One pay day a month, e.g. the 25th' },
  { value: 'SEMI_MONTHLY', label: 'Twice a month', hint: 'Two pay days a month, e.g. the 15th and the 30th' },
  { value: 'BIWEEKLY', label: 'Every two weeks', hint: 'Pick any real pay day; the rest follow every 14 days' },
  { value: 'WEEKLY', label: 'Weekly', hint: 'Pick any real pay day; the rest follow every 7 days' },
]

const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`
}

interface PayScheduleModalProps {
  isOpen: boolean
  schedule: PaySchedule | null
  onSave: (payload: PaySchedulePayload) => Promise<void>
  onDelete: () => Promise<void>
  onClose: () => void
}

export default function PayScheduleModal({ isOpen, schedule, onSave, onDelete, onClose }: PayScheduleModalProps) {
  const [frequency, setFrequency] = useState<PayFrequency>('MONTHLY')
  const [payDay, setPayDay] = useState('25')
  const [secondPayDay, setSecondPayDay] = useState('')
  const [anchor, setAnchor] = useState('')
  const [hours, setHours] = useState('7.5')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setConfirmDelete(false)
    setFrequency(schedule?.frequency ?? 'MONTHLY')
    setPayDay(String(schedule?.payDayOfMonth ?? 25))
    setSecondPayDay(schedule?.secondPayDayOfMonth ? String(schedule.secondPayDayOfMonth) : '')
    setAnchor(schedule?.anchorPayDate ?? format(new Date(), 'yyyy-MM-dd'))
    setHours(String(schedule?.defaultHoursPerDay ?? 7.5))
  }, [isOpen, schedule])

  const monthly = frequency === 'MONTHLY' || frequency === 'SEMI_MONTHLY'

  const preview = useMemo(() => {
    const h = Number(hours)
    const hoursText = Number.isFinite(h) && h > 0 ? `${h} h per day.` : ''
    if (monthly) {
      const d1 = Number(payDay)
      const d2 = Number(secondPayDay)
      if (!Number.isInteger(d1) || d1 < 1 || d1 > 31) return null
      if (frequency === 'SEMI_MONTHLY' && (!Number.isInteger(d2) || d2 < 1 || d2 > 31 || d2 === d1)) return null
      const days =
        frequency === 'SEMI_MONTHLY'
          ? `on the ${ordinal(Math.min(d1, d2))} and ${ordinal(Math.max(d1, d2))}`
          : `on the ${ordinal(d1)}`
      return `Staff are paid ${days} of every month. Each pay day covers the days since the previous one, pay day included. ${hoursText}`
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(anchor)) return null
    const every = frequency === 'WEEKLY' ? 'every week' : 'every second week'
    return `Staff are paid ${every} from ${anchor}. Each pay day covers the ${frequency === 'WEEKLY' ? 7 : 14} days ending on it. ${hoursText}`
  }, [monthly, frequency, payDay, secondPayDay, anchor, hours])

  const handleSave = async () => {
    setError(null)
    const payload: PaySchedulePayload = { frequency, defaultHoursPerDay: Number(hours) }
    if (monthly) {
      payload.payDayOfMonth = Number(payDay)
      if (frequency === 'SEMI_MONTHLY') payload.secondPayDayOfMonth = Number(secondPayDay)
    } else {
      payload.anchorPayDate = anchor
    }
    setSaving(true)
    try {
      await onSave(payload)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the pay schedule')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setSaving(true)
    try {
      await onDelete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the pay schedule')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalHeader
        title={schedule ? 'Pay schedule' : 'Set up pay schedule'}
        subtitle="When staff are paid, and how many hours a normal work day counts for"
        icon={BanknotesIcon}
      />
      <ModalBody>
        <Field label="How often are staff paid?" required>
          <div className="grid grid-cols-2 gap-2">
            {FREQUENCIES.map((f) => {
              const on = frequency === f.value
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFrequency(f.value)}
                  className={`rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer ${
                    on ? 'border-cyan-400 bg-cyan-50' : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className={`text-sm font-semibold ${on ? 'text-cyan-800' : 'text-slate-800'}`}>{f.label}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{f.hint}</div>
                </button>
              )
            })}
          </div>
        </Field>

        {monthly ? (
          <FieldRow>
            <Field
              label={frequency === 'SEMI_MONTHLY' ? 'First pay day of the month' : 'Pay day of the month'}
              htmlFor="pay-day"
              required
              hint="Days past the end of a short month fall on its last day"
            >
              <input
                id="pay-day"
                type="number"
                min={1}
                max={31}
                value={payDay}
                onChange={(e) => setPayDay(e.target.value)}
                className={inputClass}
              />
            </Field>
            {frequency === 'SEMI_MONTHLY' && (
              <Field label="Second pay day of the month" htmlFor="pay-day-2" required>
                <input
                  id="pay-day-2"
                  type="number"
                  min={1}
                  max={31}
                  value={secondPayDay}
                  onChange={(e) => setSecondPayDay(e.target.value)}
                  className={inputClass}
                />
              </Field>
            )}
          </FieldRow>
        ) : (
          <Field
            label="A recent or upcoming pay day"
            htmlFor="anchor"
            required
            hint="Every other pay day is a whole number of weeks from this one"
          >
            <input id="anchor" type="date" value={anchor} onChange={(e) => setAnchor(e.target.value)} className={inputClass} />
          </Field>
        )}

        <Field
          label="Hours in a normal work day"
          htmlFor="hours"
          required
          hint="Used for everyone unless you set a person's own hours on the Staff Attendance page"
        >
          <input
            id="hours"
            type="number"
            min={0.5}
            max={24}
            step={0.25}
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            className={inputClass}
          />
        </Field>

        {preview && (
          <div className="rounded-xl border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-sm text-cyan-900">{preview}</div>
        )}
        {error && <p className="text-sm text-rose-600">{error}</p>}
      </ModalBody>
      <ModalFooter>
        {schedule && !confirmDelete && (
          <Button variant="secondary" onClick={() => setConfirmDelete(true)} disabled={saving} className="mr-auto text-rose-600">
            Remove schedule
          </Button>
        )}
        {schedule && confirmDelete && (
          <div className="mr-auto flex items-center gap-2 text-sm text-slate-600">
            <span>Remove the pay schedule? Pay periods disappear; attendance stays.</span>
            <Button variant="danger" onClick={handleDelete} loading={saving}>
              Remove
            </Button>
          </div>
        )}
        <Button variant="secondary" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} loading={saving} disabled={!preview}>
          {schedule ? 'Save changes' : 'Save schedule'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
