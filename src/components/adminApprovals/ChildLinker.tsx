'use client'

// The "link children" half of approving a parent. Students whose family email
// matches the signup come pre-checked; anyone else is a search away. Nothing
// is written until the admin clicks Approve.

import React, { useMemo, useState } from 'react'
import { ChildCandidate, SuggestedChild } from '@/services/types/adminApproval'
import { RELATION_PRESETS } from '@/components/relation/RelationFormFields'
import { getGradeDisplayName } from '@/lib/schoolUtils'
import { MagnifyingGlassIcon, PlusIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/outline'

export interface SelectedChild extends ChildCandidate {
  relation: string
  /** Came from the email match rather than the search box. */
  suggested: boolean
}

const RELATIONS = [...RELATION_PRESETS, 'Other'] as const

interface ChildLinkerProps {
  students: ChildCandidate[]
  suggested: SuggestedChild[]
  selected: SelectedChild[]
  onChange: (next: SelectedChild[]) => void
  loading: boolean
}

const ChildLinker: React.FC<ChildLinkerProps> = ({ students, suggested, selected, onChange, loading }) => {
  const [query, setQuery] = useState('')

  const selectedIds = useMemo(() => new Set(selected.map((c) => c.studentId)), [selected])
  const suggestedIds = useMemo(() => new Set(suggested.map((s) => s.studentId)), [suggested])

  // Suggested students that the admin unticked stay visible so they can tick them back.
  const untickedSuggestions = suggested.filter((s) => !selectedIds.has(s.studentId))

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return []
    return students
      .filter((s) => !selectedIds.has(s.studentId) && s.name.toLowerCase().includes(q))
      .slice(0, 8)
  }, [query, students, selectedIds])

  const add = (student: ChildCandidate, relation = 'Guardian') => {
    onChange([...selected, { ...student, relation, suggested: suggestedIds.has(student.studentId) }])
    setQuery('')
  }
  const remove = (studentId: string) => onChange(selected.filter((c) => c.studentId !== studentId))
  const setRelation = (studentId: string, relation: string) =>
    onChange(selected.map((c) => (c.studentId === studentId ? { ...c, relation } : c)))

  if (loading) {
    return (
      <div className="space-y-2" aria-busy>
        {[0, 1].map((i) => (
          <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {suggested.length > 0 && (
        <p className="flex items-start gap-2 text-xs text-slate-500">
          <SparklesIcon className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" aria-hidden />
          <span>
            {suggested.length === 1 ? 'One student has' : `${suggested.length} students have`} this email on
            file as a parent contact. Untick any that aren&apos;t theirs.
          </span>
        </p>
      )}

      {selected.length > 0 && (
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {selected.map((child) => (
            <li key={child.studentId} className="flex items-center gap-3 bg-white px-3 py-2">
              <input
                type="checkbox"
                checked
                onChange={() => remove(child.studentId)}
                aria-label={`Unlink ${child.name}`}
                className="h-4 w-4 flex-shrink-0 accent-cyan-600"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">{child.name}</p>
                <p className="text-xs text-slate-500">
                  {getGradeDisplayName(child.grade)}
                  {child.suggested && <span className="ml-1.5 text-amber-600">· email match</span>}
                </p>
              </div>
              <select
                value={child.relation}
                onChange={(e) => setRelation(child.studentId, e.target.value)}
                aria-label={`Relation to ${child.name}`}
                className="w-32 flex-shrink-0 cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                {RELATIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}

      {untickedSuggestions.length > 0 && (
        <ul className="space-y-1">
          {untickedSuggestions.map((s) => (
            <li key={s.studentId}>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={false}
                  onChange={() => add(s, s.relation)}
                  className="h-4 w-4 accent-cyan-600"
                />
                <span className="flex-1 truncate">{s.name}</span>
                <span className="text-xs">{getGradeDisplayName(s.grade)}</span>
              </label>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={students.length === 0 ? 'No students in the active school year' : 'Add another student by name'}
          disabled={students.length === 0}
          aria-label="Search students"
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-60"
        />
        {query.trim() && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
            {matches.length === 0 ? (
              <li className="px-3 py-2 text-sm text-slate-400">No students match</li>
            ) : (
              matches.map((s) => (
                <li key={s.studentId}>
                  <button
                    type="button"
                    onClick={() => add(s)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-cyan-50 cursor-pointer"
                  >
                    <PlusIcon className="h-4 w-4 text-cyan-600" aria-hidden />
                    <span className="flex-1 truncate text-slate-900">{s.name}</span>
                    <span className="text-xs text-slate-500">{getGradeDisplayName(s.grade)}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
        {query.trim() && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

export default ChildLinker
