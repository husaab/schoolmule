'use client'

// Edit one person's day: present or absent, an optional note, and — for
// admins — the hours that day is worth when it was not a usual day.

import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, PencilSquareIcon } from '@heroicons/react/24/outline'
import { format, parseISO } from 'date-fns'
import Modal from '@/components/shared/modal'
import { ModalHeader, ModalBody, ModalFooter, Field, Button, inputClass, textareaClass } from '@/components/shared/modalKit'

interface EditAttendanceModalProps {
  isOpen: boolean
  date: string
  currentStatus: 'PRESENT' | 'ABSENT' | null
  currentNotes: string | null
  onSave: (status: 'PRESENT' | 'ABSENT', notes: string | null, hours?: number | null) => Promise<void>
  onClose: () => void
  /**
   * Admin-only: let the day's hours be overridden (a half day, a covered
   * shift). `usualHours` is what the day counts for without an override.
   */
  allowHours?: boolean
  currentHours?: number | null
  usualHours?: number
  /** Remove the day's record entirely. Shown only when the day has one. */
  onDelete?: () => Promise<void>
}

const statusButton = (on: boolean, tone: 'emerald' | 'rose') =>
  `flex flex-1 flex-col items-center gap-2 rounded-2xl border-2 p-4 transition-colors cursor-pointer active:scale-[0.98] ${
    on
      ? tone === 'emerald'
        ? 'border-emerald-400 bg-emerald-50'
        : 'border-rose-400 bg-rose-50'
      : 'border-slate-200 bg-white hover:border-slate-300'
  }`

export default function EditAttendanceModal({
  isOpen,
  date,
  currentStatus,
  currentNotes,
  onSave,
  onClose,
  allowHours = false,
  currentHours = null,
  usualHours,
  onDelete,
}: EditAttendanceModalProps) {
  const [status, setStatus] = useState<'PRESENT' | 'ABSENT'>(currentStatus ?? 'PRESENT')
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [hours, setHours] = useState('')
  const [loading, setLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStatus(currentStatus ?? 'PRESENT')
      setNotes(currentNotes ?? '')
      setHours(currentHours === null || currentHours === undefined ? '' : String(currentHours))
      setConfirmDelete(false)
    }
  }, [isOpen, currentStatus, currentNotes, currentHours])

  const canDelete = !!onDelete && currentStatus !== null

  const handleDelete = async () => {
    if (!onDelete) return
    setLoading(true)
    try {
      await onDelete()
    } finally {
      setLoading(false)
    }
  }

  const hoursValue = hours.trim() === '' ? null : Number(hours)
  const hoursValid = hoursValue === null || (Number.isFinite(hoursValue) && hoursValue >= 0 && hoursValue <= 24)

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(status, notes.trim() || null, allowHours ? hoursValue : undefined)
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = date ? format(parseISO(date), 'EEEE, MMMM d, yyyy') : ''
  const hoursHint =
    hoursValue === null
      ? status === 'PRESENT'
        ? `Blank counts the usual ${usualHours ?? ''} h`
        : 'Blank counts 0 h'
      : 'Counts exactly this'

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalHeader title="Edit attendance" subtitle={formattedDate} icon={PencilSquareIcon} />
      <ModalBody>
        <div className="flex gap-3">
          <button type="button" onClick={() => setStatus('PRESENT')} className={statusButton(status === 'PRESENT', 'emerald')}>
            <CheckCircleIcon className={`w-8 h-8 ${status === 'PRESENT' ? 'text-emerald-500' : 'text-slate-300'}`} />
            <span className={`text-sm font-semibold ${status === 'PRESENT' ? 'text-emerald-700' : 'text-slate-400'}`}>Present</span>
          </button>
          <button type="button" onClick={() => setStatus('ABSENT')} className={statusButton(status === 'ABSENT', 'rose')}>
            <XCircleIcon className={`w-8 h-8 ${status === 'ABSENT' ? 'text-rose-500' : 'text-slate-300'}`} />
            <span className={`text-sm font-semibold ${status === 'ABSENT' ? 'text-rose-700' : 'text-slate-400'}`}>Absent</span>
          </button>
        </div>

        {allowHours && (
          <Field label="Hours this day" htmlFor="edit-hours" hint={hoursHint}>
            <div className="flex items-center gap-2">
              <input
                id="edit-hours"
                type="number"
                min={0}
                max={24}
                step={0.25}
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                placeholder={usualHours !== undefined ? `Optional, usually ${usualHours}` : 'Optional, e.g. 3.5'}
                className={inputClass}
              />
              {hoursValue !== null && (
                <button type="button" onClick={() => setHours('')} className="shrink-0 text-xs font-medium text-slate-500 hover:text-slate-700 cursor-pointer">
                  Clear
                </button>
              )}
            </div>
            {!hoursValid && <p className="mt-1 text-xs text-rose-600">Hours must be between 0 and 24.</p>}
          </Field>
        )}

        <Field label="Note" htmlFor="edit-notes">
          <textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional, e.g. left early for an appointment"
            rows={2}
            maxLength={500}
            className={textareaClass}
          />
        </Field>
      </ModalBody>
      <ModalFooter>
        {canDelete && !confirmDelete && (
          <Button variant="secondary" onClick={() => setConfirmDelete(true)} disabled={loading} className="mr-auto text-rose-600">
            Remove record
          </Button>
        )}
        {canDelete && confirmDelete ? (
          <div className="flex w-full flex-wrap items-center justify-end gap-2">
            <span className="mr-auto text-xs text-slate-600">
              Removes what was recorded. A past school day then counts as present again; a day still ahead goes back to unmarked.
            </span>
            <Button variant="secondary" onClick={() => setConfirmDelete(false)} disabled={loading}>
              Keep it
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={loading}>
              Remove
            </Button>
          </div>
        ) : (
          <>
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSave} loading={loading} disabled={!hoursValid}>
              Save
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  )
}
