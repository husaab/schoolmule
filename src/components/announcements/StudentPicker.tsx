'use client'

// Hand-pick the families an announcement goes to: search by student or
// guardian, narrow by grade or class, tick rows, and see the selection as
// removable chips. Pure UI: the parent owns the selected ids.

import React, { useMemo, useState } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import SearchInput from '@/components/teacherAttendance/SearchInput'
import SearchableSelect from '@/components/ui/SearchableSelect'
import type { PickableStudent } from '@/services/types/announcement'

interface Props {
  students: PickableStudent[]
  value: string[]
  onChange: (ids: string[]) => void
  loading?: boolean
}

const MAX_CHIPS = 8

/** "Amina Rahman" → "Amina R." */
export const shortName = (name: string) => {
  const [first, ...rest] = name.trim().split(/\s+/)
  return rest.length ? `${first} ${rest[rest.length - 1][0]}.` : first
}

const StudentPicker: React.FC<Props> = ({ students, value, onChange, loading = false }) => {
  const [query, setQuery] = useState('')
  const [grade, setGrade] = useState('')
  const [classId, setClassId] = useState('')
  const selected = useMemo(() => new Set(value), [value])

  const grades = useMemo(
    () => [...new Set(students.map((s) => s.grade).filter(Boolean) as string[])].sort((a, b) => a.length - b.length || a.localeCompare(b)),
    [students],
  )
  const classes = useMemo(() => {
    const byId = new Map<string, { classId: string; subject: string; grade: string | null }>()
    students.forEach((s) => s.classes.forEach((c) => byId.set(c.classId, { ...c, grade: s.grade })))
    return [...byId.values()].sort((a, b) => (a.grade ?? '').localeCompare(b.grade ?? '') || a.subject.localeCompare(b.subject))
  }, [students])

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return students.filter(
      (s) =>
        (!grade || s.grade === grade) &&
        (!classId || s.classes.some((c) => c.classId === classId)) &&
        (!needle || s.name.toLowerCase().includes(needle) || s.guardianNames.some((g) => g.toLowerCase().includes(needle))),
    )
  }, [students, query, grade, classId])

  const toggle = (id: string) => onChange(selected.has(id) ? value.filter((v) => v !== id) : [...value, id])
  const selectVisible = () => onChange([...new Set([...value, ...visible.map((s) => s.studentId)])])
  const byId = useMemo(() => new Map(students.map((s) => [s.studentId, s])), [students])
  const chips = value.slice(0, MAX_CHIPS)
  const filterLabel = classId
    ? (() => {
        const c = classes.find((x) => x.classId === classId)
        return c ? `in ${c.grade ? `Gr ${c.grade} ` : ''}${c.subject}` : 'shown'
      })()
    : grade
      ? `in Grade ${grade}`
      : 'shown'

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 p-2">
        <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a student or guardian" className="min-w-[180px] flex-1" />
        <SearchableSelect
          size="sm"
          options={grades.map((g) => ({ value: g, label: `Grade ${g}` }))}
          value={grade}
          onChange={setGrade}
          allLabel="All grades"
          ariaLabel="Grade"
          searchPlaceholder="Find a grade"
        />
        <SearchableSelect
          size="sm"
          options={classes.map((c) => ({ value: c.classId, label: `${c.grade ? `Gr ${c.grade} ` : ''}${c.subject}` }))}
          value={classId}
          onChange={setClassId}
          allLabel="All classes"
          ariaLabel="Class"
          searchPlaceholder="Find a class"
        />
        <button
          type="button"
          onClick={selectVisible}
          disabled={visible.length === 0}
          className="rounded-lg px-2 py-1.5 text-xs font-medium text-cyan-700 hover:bg-cyan-50 disabled:opacity-40 cursor-pointer"
        >
          Select all {visible.length} {filterLabel}
        </button>
      </div>
      <ul className="grid max-h-56 grid-cols-1 gap-x-2 overflow-y-auto p-1 sm:grid-cols-2">
        {loading && <li className="col-span-full px-2 py-3 text-center text-xs text-slate-400">Loading students…</li>}
        {!loading && visible.length === 0 && <li className="col-span-full px-2 py-3 text-center text-xs text-slate-400">No one matches.</li>}
        {visible.map((s) => (
          <li key={s.studentId}>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
              <input type="checkbox" checked={selected.has(s.studentId)} onChange={() => toggle(s.studentId)} className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
              <span className="min-w-0 flex-1 truncate">
                {s.name}
                <span className="text-slate-400">
                  {s.grade ? ` · Gr ${s.grade}` : ''}
                  {s.hasEmail ? (s.guardianNames.length ? ` · ${s.guardianNames.join(', ')}` : '') : ''}
                </span>
                {!s.hasEmail && <span className="text-amber-700"> · no guardian email</span>}
              </span>
            </label>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-1.5 rounded-b-xl border-t border-slate-100 bg-slate-50 px-3 py-2">
        <span className="mr-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">Selected · {value.length}</span>
        {chips.map((id) => {
          const name = byId.get(id)?.name ?? 'Student'
          return (
            <span key={id} className="inline-flex items-center gap-1 rounded-full border border-cyan-200 bg-cyan-50 py-0.5 pl-2 pr-1 text-xs text-cyan-800">
              {shortName(name)}
              <button type="button" aria-label={`Remove ${name}`} onClick={() => toggle(id)} className="rounded-full p-0.5 text-cyan-700 hover:bg-cyan-100 cursor-pointer">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </span>
          )
        })}
        {value.length > MAX_CHIPS && <span className="text-xs text-slate-500">+ {value.length - MAX_CHIPS} more</span>}
        {value.length > 0 && (
          <button type="button" onClick={() => onChange([])} className="ml-auto text-xs text-slate-500 hover:text-slate-700 cursor-pointer">
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}

export default StudentPicker
