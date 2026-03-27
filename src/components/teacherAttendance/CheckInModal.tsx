'use client'

import Modal from '@/components/shared/modal'
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline'
import { useState, useEffect } from 'react'

interface CheckInModalProps {
  isOpen: boolean
  onCheckIn: (status: 'PRESENT' | 'ABSENT', notes: string | null) => Promise<void>
  onSkip: () => void
}

export default function CheckInModal({ isOpen, onCheckIn, onSkip }: CheckInModalProps) {
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
    <Modal isOpen={isOpen} onClose={onSkip} title="Daily Check-In" size="sm">
      <div className="p-6">
        <p className="text-sm text-slate-600 text-center mb-6">
          How are you checking in today?
        </p>

        <div className="flex gap-4">
          {/* Present Button */}
          <button
            disabled={loading}
            onClick={() => handleCheckIn('PRESENT')}
            className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-emerald-200 bg-emerald-50 hover:bg-emerald-100 hover:border-emerald-300 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <CheckCircleIcon className="w-12 h-12 text-emerald-500" />
            <span className="text-base font-semibold text-emerald-700">Present</span>
          </button>

          {/* Absent Button */}
          <button
            disabled={loading}
            onClick={() => handleCheckIn('ABSENT')}
            className="flex-1 flex flex-col items-center gap-3 p-6 rounded-2xl border-2 border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            <XCircleIcon className="w-12 h-12 text-red-500" />
            <span className="text-base font-semibold text-red-700">Absent</span>
          </button>
        </div>

        <div className="mt-5">
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

        <button
          onClick={onSkip}
          disabled={loading}
          className="w-full mt-4 text-sm text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          I&apos;ll check in later
        </button>
      </div>
    </Modal>
  )
}
