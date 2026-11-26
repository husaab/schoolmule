'use client'

// Who a meeting day is for: every teacher, or only the teachers the office
// ticks (a day for part-time staff who aren't in on the main days). WhoPicker
// is the choice itself, on Setup's Add a day; DayTeachersModal changes it for
// a day that is already there. A family only hears about a day for some
// teachers when one of their own teachers meets on it.

import React, { useEffect, useId, useState } from 'react'
import { UserGroupIcon, UsersIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader } from '@/components/shared/modalKit'
import type { SetupDay, SetupTeacher } from '@/services/types/meetings'
import { bookedTimesFrom, dayLong, pickableTeachers, whoReady, type DayWho } from '@/lib/meetings'

interface PickerProps {
  value: DayWho
  onChange: (value: DayWho) => void
  teachers: SetupTeacher[]
}

export const WhoPicker: React.FC<PickerProps> = ({ value, onChange, teachers }) => {
  const id = useId()
  const option = (everyone: boolean, label: string, Icon: typeof UsersIcon) => (
    <button
      type="button"
      role="radio"
      aria-checked={value.everyone === everyone}
      onClick={() => onChange({ ...value, everyone })}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-sm font-medium transition sm:px-3 ${value.everyone === everyone ? 'bg-white text-cyan-800 shadow-sm ring-1 ring-cyan-200' : 'text-slate-600 hover:text-slate-900'}`}
    >
      <Icon className={`hidden h-4 w-4 sm:block ${value.everyone === everyone ? 'text-cyan-600' : 'text-slate-400'}`} aria-hidden="true" />
      {label}
    </button>
  )
  const toggle = (teacherId: string, on: boolean) =>
    onChange({ ...value, teacherIds: on ? [...value.teacherIds, teacherId] : value.teacherIds.filter((x) => x !== teacherId) })
  return (
    <div className="space-y-2">
      <p id={`${id}-label`} className="text-sm font-medium text-slate-700">Who meets families that day</p>
      <div role="radiogroup" aria-labelledby={`${id}-label`} className="flex max-w-md gap-1 rounded-xl border border-slate-200 bg-slate-100/70 p-1">
        {option(true, 'Every teacher', UserGroupIcon)}
        {option(false, 'Only some teachers', UsersIcon)}
      </div>
      {value.everyone ? (
        <p className="text-xs text-slate-500">Every teacher taking part, with the school hours, unless you give them their own in Teachers.</p>
      ) : (
        <>
          <p className="text-xs text-slate-500">For teachers who can’t meet on the other days, like part-time staff. Only their families are told about this day.</p>
          {teachers.length === 0 ? (
            <p className="text-sm text-slate-500">No teachers are taking part yet.</p>
          ) : (
            <ul role="group" aria-label="Teachers" className="grid max-h-64 gap-x-4 overflow-y-auto rounded-xl border border-slate-200 p-2 sm:grid-cols-2">
              {teachers.map((t) => (
                <li key={t.teacherId}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-900 hover:bg-cyan-50">
                    <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0 accent-cyan-600" checked={value.teacherIds.includes(t.teacherId)} onChange={(e) => toggle(t.teacherId, e.target.checked)} />
                    <span className="min-w-0">{t.name}<span className="block truncate text-xs text-slate-500">{t.teaches}</span></span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  )
}

interface ModalProps {
  /** The day being changed; null closes the window. */
  day: SetupDay | null
  teachers: SetupTeacher[]
  onClose: () => void
  onSave: (who: DayWho) => Promise<void>
}

export const DayTeachersModal: React.FC<ModalProps> = ({ day, teachers, onClose, onSave }) => {
  const [who, setWho] = useState<DayWho>({ everyone: true, teacherIds: [] })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [inTheWay, setInTheWay] = useState<string[]>([])

  useEffect(() => {
    if (!day) return
    setWho({ everyone: day.everyone, teacherIds: day.teacherIds })
    setError(null)
    setInTheWay([])
  }, [day])

  const save = async () => {
    setSaving(true)
    setError(null)
    setInTheWay([])
    try {
      await onSave(who)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
      setInTheWay(bookedTimesFrom(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal isOpen={Boolean(day)} onClose={onClose} size="lg" ariaLabel="Who meets families that day">
      {day && (
        <>
          <ModalHeader title={dayLong(day.date)} subtitle="Who meets families that day" icon={UsersIcon} />
          <ModalBody>
            <WhoPicker value={who} onChange={setWho} teachers={pickableTeachers(teachers, day)} />
            <div className="rounded-xl bg-cyan-50/70 px-4 py-3 text-sm text-slate-700">
              {who.everyone
                ? 'A teacher you switched off for this day stays off.'
                : 'Teachers you leave unticked don’t meet families that day. A ticked teacher keeps any hours of their own.'}
              {day.bookings > 0 ? ' Booked times stay put: if a family is booked with a teacher you take off, move them on the Board first.' : ''}
            </div>
            {error && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                <p>{error}</p>
                {inTheWay.length > 0 && <ul className="mt-2 list-disc pl-5">{inTheWay.map((l) => <li key={l}>{l}</li>)}</ul>}
              </div>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={onClose}>Cancel</Button>
            <Button loading={saving} disabled={!whoReady(who)} onClick={save}>Save</Button>
          </ModalFooter>
        </>
      )}
    </Modal>
  )
}
