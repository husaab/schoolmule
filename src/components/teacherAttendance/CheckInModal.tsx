'use client'

// The daily check-in prompt on the dashboard: present or absent, an optional
// note, and a quiet line saying which pay day today counts toward.

import { useState, useEffect } from 'react'
import { CheckCircleIcon, XCircleIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { ModalHeader, ModalBody, Field, textareaClass } from '@/components/shared/modalKit'
import { shortDate } from './payPeriodFormat'

interface CheckInModalProps {
  isOpen: boolean
  onCheckIn: (status: 'PRESENT' | 'ABSENT', notes: string | null) => Promise<void>
  onSkip: () => void
  /** The pay day this check-in counts toward, when the school has a pay schedule. */
  payDate?: string | null
}

export default function CheckInModal({ isOpen, onCheckIn, onSkip, payDate }: CheckInModalProps) {
  const [loading, setLoading] = useState(false)
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (isOpen) setNotes('')
  }, [isOpen])

  const handleCheckIn = async (status: 'PRESENT' | 'ABSENT') => {
    setLoading(true)
    try {
      await onCheckIn(status, notes.trim() || null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onSkip} size="sm">
      <ModalHeader
        title="Daily check-in"
        subtitle={payDate ? `Today counts toward pay day ${shortDate(payDate, true)}` : 'How are you checking in today?'}
        icon={ClipboardDocumentCheckIcon}
      />
      <ModalBody>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => handleCheckIn('PRESENT')}
            className="flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-6 transition-colors hover:border-emerald-300 hover:bg-emerald-100 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
            <span className="text-base font-semibold text-emerald-700">Present</span>
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => handleCheckIn('ABSENT')}
            className="flex flex-1 flex-col items-center gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50 p-6 transition-colors hover:border-rose-300 hover:bg-rose-100 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
          >
            <XCircleIcon className="w-12 h-12 text-rose-500" />
            <span className="text-base font-semibold text-rose-700">Absent</span>
          </button>
        </div>

        <Field label="Note" htmlFor="checkin-notes">
          <textarea
            id="checkin-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional, e.g. only worked 7 hours today"
            rows={2}
            maxLength={500}
            className={textareaClass}
          />
        </Field>

        <button
          type="button"
          onClick={onSkip}
          disabled={loading}
          className="w-full text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          I&apos;ll check in later
        </button>
      </ModalBody>
    </Modal>
  )
}
