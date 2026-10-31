// src/components/progress-report/generate/GenerateMissingModal.tsx
// "Generate missing" on the progress reports page: every student without a
// report this term, by grade, ticked (or the grades on screen), so the person
// sees who will get one and can untick anyone before anything is built. JK/SK
// reports print a date, so that field shows when a JK or SK student is listed.
// Mounted only while open, so each opening starts from `initialSelectedIds`.
'use client'

import { useState } from 'react'
import { DocumentPlusIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import Avatar from '@/components/avatar/Avatar'
import { Button, Field, FormSection, ModalBody, ModalFooter, ModalHeader, inputClass } from '@/components/shared/modalKit'
import { gradeLabel } from '@/lib/progressReportRoster'
import type { AvatarSpec } from '@/lib/avatar'

export interface MissingStudent {
  studentId: string
  name: string
  /** As on the roster: 'JK', '3', '-' when unknown. */
  grade: string
  photoUrl?: string | null
  avatar?: AvatarSpec | null
}

interface Props {
  onClose: () => void
  term: string
  /** Students without a report this term, in list order (grade, then name). */
  students: MissingStudent[]
  /** Ticked when the window opens. */
  initialSelectedIds: string[]
  reportDate: string
  onReportDateChange: (date: string) => void
  onGenerate: (studentIds: string[]) => void
}

const linkButton =
  'cursor-pointer rounded-lg px-2.5 py-1 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:cursor-not-allowed disabled:opacity-50'

export default function GenerateMissingModal({ onClose, term, students, initialSelectedIds, reportDate, onReportDateChange, onGenerate }: Props) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set(initialSelectedIds))

  const grades: { grade: string; rows: MissingStudent[] }[] = []
  for (const s of students) {
    const last = grades[grades.length - 1]
    if (last && last.grade === s.grade) last.rows.push(s)
    else grades.push({ grade: s.grade, rows: [s] })
  }
  const hasKindergarten = students.some((s) => s.grade === 'JK' || s.grade === 'SK')
  // Only ids still on the list count (a student can gain a report while this is open).
  const chosen = students.filter((s) => selected.has(s.studentId)).map((s) => s.studentId)
  const count = chosen.length

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleGrade = (rows: MissingStudent[]) =>
    setSelected((prev) => {
      const next = new Set(prev)
      const all = rows.every((r) => next.has(r.studentId))
      rows.forEach((r) => (all ? next.delete(r.studentId) : next.add(r.studentId)))
      return next
    })

  return (
    <Modal isOpen onClose={onClose} style="w-full max-w-2xl" fullScreenOnMobile ariaLabel="Generate missing progress reports">
      <ModalHeader
        title="Generate missing reports"
        subtitle={`${term}. ${students.length} student${students.length === 1 ? " doesn't" : "s don't"} have a report yet.`}
        icon={DocumentPlusIcon}
      />
      <ModalBody>
        <FormSection label="Students">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-600">
              <span className="font-medium text-slate-900">{count}</span> of {students.length} selected
            </p>
            <div className="flex gap-1.5">
              <button type="button" onClick={() => setSelected(new Set(students.map((s) => s.studentId)))} className={`${linkButton} font-medium text-cyan-700 hover:bg-cyan-50`}>
                Select all
              </button>
              <button type="button" onClick={() => setSelected(new Set())} disabled={count === 0} className={`${linkButton} text-slate-600 hover:bg-slate-100`}>
                Clear
              </button>
            </div>
          </div>

          {grades.length > 1 && (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Select a whole grade">
              {grades.map(({ grade, rows }) => {
                const inGrade = rows.filter((r) => selected.has(r.studentId)).length
                const all = inGrade === rows.length
                return (
                  <button
                    key={grade}
                    type="button"
                    aria-pressed={all}
                    onClick={() => toggleGrade(rows)}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                      all ? 'border-cyan-200 bg-cyan-50 font-medium text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {gradeLabel(grade)}
                    <span className="ml-1.5 text-xs tabular-nums text-slate-400">
                      {inGrade}/{rows.length}
                    </span>
                  </button>
                )
              })}
            </div>
          )}

          <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100">
            {grades.map(({ grade, rows }) => (
              <div key={grade}>
                <p className="sticky top-0 z-10 bg-slate-50 px-4 py-1.5 text-xs font-medium text-slate-500">{gradeLabel(grade)}</p>
                {rows.map((s) => (
                  <label key={s.studentId} className="flex cursor-pointer items-center gap-3 px-4 py-2 text-sm text-slate-800 hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={selected.has(s.studentId)}
                      onChange={() => toggle(s.studentId)}
                      className="h-4 w-4 cursor-pointer rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                    />
                    <Avatar student name={s.name} photoUrl={s.photoUrl ?? null} avatar={s.avatar ?? null} size={26} />
                    <span className="min-w-0 flex-1 truncate">{s.name}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-500">Each report prints the ratings and comments teachers have entered for {term} so far.</p>
        </FormSection>

        {hasKindergarten && (
          <FormSection label="JK and SK">
            <Field label="Report date" htmlFor="pr-missing-date" hint="Printed on JK and SK reports. Other grades don't print a date.">
              <input id="pr-missing-date" type="date" value={reportDate} onChange={(e) => onReportDateChange(e.target.value)} className={inputClass} />
            </Field>
          </FormSection>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" disabled={count === 0} onClick={() => onGenerate(chosen)}>
          <DocumentPlusIcon className="h-4 w-4" aria-hidden="true" />
          Generate {count} report{count === 1 ? '' : 's'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
