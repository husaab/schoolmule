'use client'

import Modal from '@/components/shared/modal'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'
import { format, parseISO } from 'date-fns'

interface EditAttendanceModalProps {
  isOpen: boolean
  date: string
  currentStatus: 'PRESENT' | 'ABSENT' | null
  currentNotes: string | null
  onSave: (status: 'PRESENT' | 'ABSENT', notes: string | null) => Promise<void>
  onClose: () => void
}

export default function EditAttendanceModal({
  isOpen,
  date,
  currentStatus,
  currentNotes,
  onSave,
  onClose,
}: EditAttendanceModalProps) {
  const [status, setStatus] = useState<'PRESENT' | 'ABSENT'>(currentStatus ?? 'PRESENT')
  const [notes, setNotes] = useState(currentNotes ?? '')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setStatus(currentStatus ?? 'PRESENT')
      setNotes(currentNotes ?? '')
    }
  }, [isOpen, currentStatus, currentNotes])

  const handleSave = async () => {
    setLoading(true)
    try {
      await onSave(status, notes.trim() || null)
    } finally {
      setLoading(false)
    }
  }

  const formattedDate = date ? format(parseISO(date), 'MMMM d, yyyy') : ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit Attendance — ${formattedDate}`} size="sm">
      <div className="p-6">
        <div className="flex gap-4 mb-5">
          <button
            type="button"
            onClick={() => setStatus('PRESENT')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              status === 'PRESENT'
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <CheckCircleIcon className={`w-8 h-8 ${status === 'PRESENT' ? 'text-emerald-500' : 'text-slate-300'}`} />
            <span className={`text-sm font-semibold ${status === 'PRESENT' ? 'text-emerald-700' : 'text-slate-400'}`}>
              Present
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatus('ABSENT')}
            className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer ${
              status === 'ABSENT'
                ? 'border-red-400 bg-red-50'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <XCircleIcon className={`w-8 h-8 ${status === 'ABSENT' ? 'text-red-500' : 'text-slate-300'}`} />
            <span className={`text-sm font-semibold ${status === 'ABSENT' ? 'text-red-700' : 'text-slate-400'}`}>
              Absent
            </span>
          </button>
        </div>

        <div className="mb-5">
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Notes <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. only worked 7 hours today"
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-400 resize-none placeholder:text-slate-300"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl hover:from-cyan-600 hover:to-teal-600 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
