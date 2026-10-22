// src/components/classes/items/AudienceField.tsx
// "For": every student in the class, or chosen students. Choosing loads the
// class roster (with each student's avatar) the first time it is needed.
'use client'

import { useEffect, useMemo, useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import { getClassPeople } from '@/services/classroomService'
import type { PeopleStudent } from '@/services/types/classroom'
import { FIELD_SELECT, LabeledField, fieldId } from './formParts'

interface AudienceFieldProps {
  classId: string
  studentCount: number
  audience: 'all' | 'some'
  studentIds: string[]
  onChange: (patch: { audience?: 'all' | 'some'; studentIds?: string[] }) => void
  error?: string
  disabled?: boolean
}

type Roster = { status: 'idle' | 'loading' } | { status: 'ready'; students: PeopleStudent[] } | { status: 'error' }

export default function AudienceField({ classId, studentCount, audience, studentIds, onChange, error, disabled }: AudienceFieldProps) {
  const [roster, setRoster] = useState<Roster>({ status: 'idle' })
  const [query, setQuery] = useState('')
  const [attempt, setAttempt] = useState(0)
  const choosing = audience === 'some'

  useEffect(() => {
    if (!choosing) return
    let cancelled = false
    getClassPeople(classId).then(
      (res) => !cancelled && setRoster({ status: 'ready', students: res.data.students }),
      () => !cancelled && setRoster({ status: 'error' }),
    )
    return () => {
      cancelled = true
    }
  }, [choosing, classId, attempt])

  const chosen = useMemo(() => new Set(studentIds), [studentIds])
  const students = roster.status === 'ready' ? roster.students : []
  const needle = query.trim().toLowerCase()
  const visible = needle ? students.filter((s) => s.name.toLowerCase().includes(needle)) : students

  const toggle = (id: string) =>
    onChange({ studentIds: chosen.has(id) ? studentIds.filter((s) => s !== id) : [...studentIds, id] })

  return (
    <div className="flex flex-col gap-2">
      <LabeledField label="For" name="audience" error={choosing ? undefined : error}>
        <select
          id={fieldId('audience')}
          value={audience}
          disabled={disabled}
          onChange={(e) => onChange({ audience: e.target.value as 'all' | 'some' })}
          className={FIELD_SELECT}
        >
          <option value="all">{studentCount === 1 ? 'The 1 student' : `All ${studentCount} students`}</option>
          <option value="some">Choose students…</option>
        </select>
      </LabeledField>

      {choosing && (
        <div id={fieldId('studentIds')} tabIndex={-1} className="rounded-xl border border-slate-200 bg-white outline-none">
          {students.length > 8 && (
            <div className="relative border-b border-slate-100 p-2">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find a student"
                aria-label="Find a student"
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-8 pr-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-cyan-200"
              />
            </div>
          )}
          <ul className="max-h-64 overflow-y-auto p-1">
            {(roster.status === 'idle' || roster.status === 'loading') && (
              <li className="px-2 py-3 text-center text-xs text-slate-400">Loading students…</li>
            )}
            {roster.status === 'error' && (
              <li className="flex items-center justify-center gap-2 px-2 py-3 text-xs text-slate-500">
                The class list couldn&apos;t be loaded.
                <button
                  type="button"
                  onClick={() => {
                    setRoster({ status: 'loading' })
                    setAttempt((n) => n + 1)
                  }}
                  className="cursor-pointer font-medium text-cyan-700 underline"
                >
                  Try again
                </button>
              </li>
            )}
            {roster.status === 'ready' && visible.length === 0 && (
              <li className="px-2 py-3 text-center text-xs text-slate-400">{students.length ? 'No one matches.' : 'No students in this class yet.'}</li>
            )}
            {visible.map((s) => (
              <li key={s.studentId}>
                <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={chosen.has(s.studentId)}
                    disabled={disabled}
                    onChange={() => toggle(s.studentId)}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-cyan-600"
                  />
                  <Avatar student name={s.name} avatar={s.avatar} photoUrl={s.photoUrl} size={26} />
                  <span className="min-w-0 flex-1 truncate">{s.name}</span>
                </label>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center gap-2 rounded-b-xl border-t border-slate-100 bg-slate-50 px-3 py-2 text-xs">
            <span className="font-semibold text-slate-600">{studentIds.length} chosen</span>
            {roster.status === 'ready' && students.length > 0 && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange({ studentIds: [...new Set([...studentIds, ...visible.map((s) => s.studentId)])] })}
                className="cursor-pointer font-medium text-cyan-700 hover:text-cyan-800"
              >
                Select all{needle ? ' shown' : ''}
              </button>
            )}
            {studentIds.length > 0 && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => onChange({ studentIds: [] })}
                className="ml-auto cursor-pointer text-slate-500 hover:text-slate-700"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
      {choosing && error && <p className="text-xs text-rose-700">{error}</p>}
    </div>
  )
}
