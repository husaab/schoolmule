// src/components/classes/settings/ClassOptionsCard.tsx
// Settings → Class options: three switches that save the moment they change,
// and the school's private-comments rule shown read-only.
'use client'

import { useState } from 'react'
import { updateClassOptions } from '@/services/classroomService'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { ClassOptions } from '@/services/types/classroom'

interface ClassOptionsCardProps {
  classId: string
  options: ClassOptions
  /** The school's setting (Student accounts → Classroom settings). */
  parentsReadPrivateComments: boolean
  canEdit: boolean
  /** The options the server now holds. */
  onChanged: (options: ClassOptions) => void
}

const ROWS: { key: keyof ClassOptions; label: string }[] = [
  { key: 'emailNewPosts', label: 'Email students and parents about new posts by default' },
  { key: 'acceptLate', label: 'Accept work after the due date (marked late)' },
  { key: 'showClassAverage', label: 'Show students their class average in Classes' },
]

export default function ClassOptionsCard({
  classId,
  options,
  parentsReadPrivateComments,
  canEdit,
  onChanged,
}: ClassOptionsCardProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  // What the switches show while a save is in flight.
  const [pending, setPending] = useState<Partial<ClassOptions>>({})

  const toggle = async (key: keyof ClassOptions, value: boolean) => {
    setPending((p) => ({ ...p, [key]: value }))
    try {
      const res = await updateClassOptions(classId, { [key]: value })
      onChanged(res.data.options)
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : "The option couldn't be saved. Try again.", 'error')
    } finally {
      setPending((p) => {
        const next = { ...p }
        delete next[key]
        return next
      })
    }
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-[22px]">
      <h3 className="font-display text-[19px] font-semibold text-slate-900">Class options</h3>
      {ROWS.map(({ key, label }) => {
        const saving = key in pending
        const checked = saving ? !!pending[key] : options[key]
        return (
          <label key={key} className="flex items-center justify-between gap-4 text-sm text-slate-800">
            {label}
            <input
              type="checkbox"
              checked={checked}
              disabled={!canEdit || saving}
              onChange={(e) => void toggle(key, e.target.checked)}
              className="h-[18px] w-[18px] shrink-0 cursor-pointer accent-cyan-600 disabled:cursor-not-allowed"
            />
          </label>
        )
      })}
      <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
        Parents can read private comments
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs">
          {parentsReadPrivateComments ? 'On' : 'Off'} · set by the school
        </span>
      </div>
    </div>
  )
}
