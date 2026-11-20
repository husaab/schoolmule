// src/components/classes/settings/ClassOptionsCard.tsx
// Settings → Class options: switches that save the moment they change, who
// counts in the class average, the school's private-comments rule shown
// read-only, and (grades 1-8) how the class prints on reports: on report
// cards or progress reports only, and the name printed after the subject on
// progress reports ("Salaat – Supervisor").
'use client'

import { useEffect, useState } from 'react'
import { updateClassOptions } from '@/services/classroomService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { REPORT_TEACHER_NAME_MAX, reportTeacherNameChange } from '@/lib/classReportOptions'
import type { ClassOptions } from '@/services/types/classroom'
import ClassStatsRow from './ClassStatsRow'

type Switch = 'acceptLate' | 'emailNewPosts' | 'showClassAverage' | 'onReportCard'

interface ClassOptionsCardProps {
  classId: string
  options: ClassOptions
  /** The school's setting (Student accounts → Classroom settings). */
  parentsReadPrivateComments: boolean
  canEdit: boolean
  /** Who counts in the class average (classes with percentage grades, not JK/SK). */
  showClassStats?: boolean
  /** How the class prints on report cards and progress reports (grades 1-8, not JK/SK). */
  showReportOptions?: boolean
  /** The options the server now holds. */
  onChanged: (options: ClassOptions) => void
}

const ROWS: { key: Switch; label: string }[] = [
  { key: 'emailNewPosts', label: 'Email students and parents about new posts by default' },
  { key: 'acceptLate', label: 'Accept work after the due date (marked late)' },
  { key: 'showClassAverage', label: 'Show students their class average in Classes' },
]

const switchClass = 'h-[18px] w-[18px] shrink-0 cursor-pointer accent-cyan-600 disabled:cursor-not-allowed'

export default function ClassOptionsCard({
  classId,
  options,
  parentsReadPrivateComments,
  canEdit,
  showClassStats = false,
  showReportOptions = false,
  onChanged,
}: ClassOptionsCardProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  // What the switches show while a save is in flight.
  const [pending, setPending] = useState<Partial<Record<Switch, boolean>>>({})
  // The name on progress reports as typed; saved when the field is left.
  const [name, setName] = useState(options.reportTeacherName ?? '')
  const [savingName, setSavingName] = useState(false)
  useEffect(() => setName(options.reportTeacherName ?? ''), [options.reportTeacherName])

  const fail = (err: unknown, what: string) =>
    showNotification(err instanceof Error && err.message ? err.message : `The ${what} couldn't be saved. Try again.`, 'error')

  const toggle = async (key: Switch, value: boolean) => {
    setPending((p) => ({ ...p, [key]: value }))
    try {
      const res = await updateClassOptions(classId, { [key]: value })
      onChanged(res.data.options)
    } catch (err) {
      fail(err, 'option')
    } finally {
      setPending((p) => {
        const next = { ...p }
        delete next[key]
        return next
      })
    }
  }

  const saveName = async () => {
    const change = reportTeacherNameChange(name, options.reportTeacherName)
    if (change === undefined) {
      setName(options.reportTeacherName ?? '')
      return
    }
    setSavingName(true)
    try {
      const res = await updateClassOptions(classId, { reportTeacherName: change })
      onChanged(res.data.options)
      showNotification(change ? `Progress reports will print "${change}"` : "Progress reports will print the teacher's name", 'success')
    } catch (err) {
      setName(options.reportTeacherName ?? '')
      fail(err, 'name')
    } finally {
      setSavingName(false)
    }
  }

  const switchRow = (key: Switch, label: React.ReactNode) => {
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
          className={switchClass}
        />
      </label>
    )
  }

  return (
    <div className="flex flex-col gap-3.5 rounded-2xl border border-slate-200/70 bg-white p-[22px]">
      <h3 className="font-display text-[19px] font-semibold text-slate-900">Class options</h3>
      {ROWS.map(({ key, label }) => switchRow(key, label))}
      {showClassStats && <ClassStatsRow classId={classId} canEdit={canEdit} />}
      <div className="flex items-center justify-between gap-4 text-sm text-slate-500">
        Parents can read private comments
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs">
          {parentsReadPrivateComments ? 'On' : 'Off'} · set by the school
        </span>
      </div>

      {showReportOptions && (
        <div className="mt-1 flex flex-col gap-3.5 border-t border-slate-100 pt-4">
          <h4 className="text-sm font-semibold text-slate-900">On reports</h4>
          {switchRow(
            'onReportCard',
            <span>
              Print on report cards
              <span className="block text-xs text-slate-500">Off: progress reports only, for a class with no marks such as Salaat.</span>
            </span>,
          )}
          <label className="flex flex-col gap-1.5 text-sm text-slate-800">
            Name on progress reports
            <span className="text-xs text-slate-500">
              Printed after the subject instead of the teacher&apos;s name, e.g. &ldquo;Supervisor&rdquo;. Leave it empty for the teacher.
            </span>
            <input
              type="text"
              value={name}
              maxLength={REPORT_TEACHER_NAME_MAX}
              disabled={!canEdit || savingName}
              placeholder="The teacher's name"
              onChange={(e) => setName(e.target.value)}
              onBlur={() => void saveName()}
              onKeyDown={(e) => {
                if (e.key === 'Enter') e.currentTarget.blur()
                if (e.key === 'Escape') {
                  setName(options.reportTeacherName ?? '')
                  e.currentTarget.blur()
                }
              }}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 disabled:cursor-not-allowed disabled:bg-slate-50 sm:max-w-sm"
            />
          </label>
        </div>
      )}
    </div>
  )
}
