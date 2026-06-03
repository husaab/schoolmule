'use client'

// Typeahead student search for the control bar — jump straight to any
// student's analytics profile.

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { MagnifyingGlassIcon, UserIcon } from '@heroicons/react/24/outline'

export interface PickerStudent {
  studentId: string
  studentName: string
  grade: string
}

interface StudentPickerProps {
  students: PickerStudent[]
  onSelect: (student: PickerStudent) => void
}

const StudentPicker: React.FC<StudentPickerProps> = ({ students, onSelect }) => {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(0)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return students.slice(0, 8)
    return students.filter((s) => s.studentName.toLowerCase().includes(q)).slice(0, 8)
  }, [students, query])

  const pick = (s: PickerStudent) => {
    onSelect(s)
    setQuery('')
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className="relative">
      <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          setHighlighted(0)
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return
          if (e.key === 'ArrowDown') {
            e.preventDefault()
            setHighlighted((h) => Math.min(h + 1, matches.length - 1))
          } else if (e.key === 'ArrowUp') {
            e.preventDefault()
            setHighlighted((h) => Math.max(h - 1, 0))
          } else if (e.key === 'Enter') {
            e.preventDefault()
            pick(matches[highlighted])
          } else if (e.key === 'Escape') {
            setOpen(false)
          }
        }}
        placeholder="Find a student…"
        aria-label="Find a student"
        className="pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm w-40 sm:w-48 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
      />

      {open && matches.length > 0 && (
        <div className="absolute left-0 top-11 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 max-h-80 overflow-y-auto">
          {matches.map((s, i) => (
            <button
              key={s.studentId}
              onMouseDown={(e) => {
                e.preventDefault()
                pick(s)
              }}
              onMouseEnter={() => setHighlighted(i)}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-left transition-colors ${
                i === highlighted ? 'bg-cyan-50' : ''
              }`}
            >
              <span className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-3.5 h-3.5 text-cyan-700" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-medium text-slate-900 truncate">{s.studentName}</span>
                <span className="block text-xs text-slate-500">Grade {s.grade}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {open && query.trim() && matches.length === 0 && (
        <div className="absolute left-0 top-11 z-50 w-64 bg-white border border-slate-200 rounded-xl shadow-lg px-3.5 py-3 text-sm text-slate-400">
          No students match “{query.trim()}”
        </div>
      )}
    </div>
  )
}

export default StudentPicker
