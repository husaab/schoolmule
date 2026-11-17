// src/components/reports/SalaatModal.tsx
// "Salaat" on the progress reports page (schools that print it): the homeroom
// teacher rates each of their students' Work Habits and Behaviour in Salaat
// and can add a comment; it prints as a "Salaat" box after the subject cards.
// Admins (classes.all) see every grade 1-8 student, with grade chips and a
// search. A rating saves when it's tapped, a comment when the field is left
// or a second after typing stops. The page owns the list, so its button's
// "12 of 23" follows every save.
'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckIcon, ExclamationTriangleIcon, MagnifyingGlassIcon, SparklesIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader, textareaClass } from '@/components/shared/modalKit'
import { RatingButtons } from '@/components/gradebook/workspace/RatingButtons'
import { gradeLabel } from '@/lib/reportRoster'
import { SALAAT_COMMENT_MAX, SALAAT_RATINGS, isSalaatDone, salaatByGrade, salaatProgress } from '@/lib/salaat'
import { saveSalaat, type SalaatEntry, type SalaatRating, type SalaatStudent } from '@/services/progressSalaatService'

type RowState = 'saving' | 'saved' | 'error'

interface Props {
  term: string
  students: SalaatStudent[]
  canEditAll: boolean
  /** A student's entry as the server saved it. */
  onSaved: (studentId: string, entry: SalaatEntry) => void
  onClose: () => void
}

const COMMENT_DELAY_MS = 1000

export default function SalaatModal({ term, students, canEditAll, onSaved, onClose }: Props) {
  // What's on screen, ahead of the server while a save is on its way.
  const [drafts, setDrafts] = useState<Map<string, { workHabit: SalaatRating; behavior: SalaatRating; comment: string }>>(() => new Map())
  const [rowState, setRowState] = useState<Map<string, RowState>>(() => new Map())
  const [grade, setGrade] = useState<string>('all')
  const [query, setQuery] = useState('')
  // One save at a time per student, in order, so a quick second tap can't land first.
  const queues = useRef(new Map<string, Promise<unknown>>())
  // A comment waiting for typing to stop: saved on time, on leaving the field, or when the window closes.
  const timers = useRef(new Map<string, { timer: ReturnType<typeof setTimeout>; send: () => void }>())

  useEffect(() => {
    const pending = timers.current
    return () => {
      pending.forEach(({ timer, send }) => {
        clearTimeout(timer)
        send()
      })
      pending.clear()
    }
  }, [])

  const valueOf = (s: SalaatStudent) => drafts.get(s.studentId) ?? { workHabit: s.workHabit, behavior: s.behavior, comment: s.comment }
  const merged = students.map((s) => ({ ...s, ...valueOf(s) }))
  const { done, total } = salaatProgress(merged)
  const groups = salaatByGrade(merged)
  const needle = query.trim().toLowerCase()
  const shown = useMemo(
    () => merged.filter((s) => (grade === 'all' || s.grade === grade) && (!needle || s.name.toLowerCase().includes(needle))),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [students, drafts, grade, needle],
  )

  const setState = (id: string, state: RowState | null) =>
    setRowState((prev) => {
      const next = new Map(prev)
      if (state) next.set(id, state)
      else next.delete(id)
      return next
    })

  const save = (student: SalaatStudent, value: { workHabit: SalaatRating; behavior: SalaatRating; comment: string }) => {
    const id = student.studentId
    setState(id, 'saving')
    const run = (queues.current.get(id) ?? Promise.resolve())
      .catch(() => undefined)
      .then(() => saveSalaat(id, { term, ...value }))
      .then((saved) => {
        if (queues.current.get(id) !== run) return // a newer save is queued; it reports
        onSaved(id, saved)
        // Keep a draft typed while this was on its way; drop one the server now holds.
        setDrafts((prev) => {
          const now = prev.get(id)
          if (!now || now.workHabit !== value.workHabit || now.behavior !== value.behavior || now.comment !== value.comment) return prev
          const next = new Map(prev)
          next.delete(id)
          return next
        })
        setState(id, timers.current.has(id) ? 'saving' : 'saved')
      })
      .catch(() => {
        if (queues.current.get(id) === run) setState(id, 'error')
      })
    queues.current.set(id, run)
  }

  const change = (student: SalaatStudent, patch: Partial<{ workHabit: SalaatRating; behavior: SalaatRating; comment: string }>, delay = 0) => {
    const value = { ...valueOf(student), ...patch }
    setDrafts((prev) => new Map(prev).set(student.studentId, value))
    const pending = timers.current.get(student.studentId)
    if (pending) clearTimeout(pending.timer)
    timers.current.delete(student.studentId)
    // Back to what's saved, with nothing on its way: nothing to send.
    const saved = students.find((x) => x.studentId === student.studentId) ?? student
    const unchanged = value.workHabit === saved.workHabit && value.behavior === saved.behavior && value.comment === saved.comment
    if (unchanged && !queues.current.has(student.studentId)) {
      setDrafts((prev) => {
        const next = new Map(prev)
        next.delete(student.studentId)
        return next
      })
      return
    }
    if (delay > 0) {
      const send = () => {
        timers.current.delete(student.studentId)
        save(student, value)
      }
      timers.current.set(student.studentId, { timer: setTimeout(send, delay), send })
    } else {
      save(student, value)
    }
  }

  const flushComment = (student: SalaatStudent) => {
    const pending = timers.current.get(student.studentId)
    if (!pending) return
    clearTimeout(pending.timer)
    pending.send()
  }

  const failed = [...rowState.values()].filter((s) => s === 'error').length

  return (
    <Modal isOpen onClose={onClose} style="w-full max-w-3xl" fullScreenOnMobile ariaLabel={`Salaat, ${term}`}>
      <ModalHeader
        title={`Salaat · ${term}`}
        subtitle={`Prints as a Salaat box after the subjects on each progress report. ${done} of ${total} done.`}
        icon={SparklesIcon}
      />
      <ModalBody>
        {total === 0 ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-600">
            {canEditAll ? 'No grade 1 to 8 students this year.' : 'You have no homeroom students in grades 1 to 8 this year. The office sets homeroom teachers on each student.'}
          </p>
        ) : (
          <div className="space-y-3">
            {(groups.length > 1 || total > 12) && (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                {groups.length > 1 ? (
                  <div className="flex flex-wrap gap-1.5" role="group" aria-label="Grade">
                    {[{ grade: 'all', label: 'All' }, ...groups.map((g) => ({ grade: g.grade, label: gradeLabel(g.grade) }))].map((g) => (
                      <button
                        key={g.grade}
                        type="button"
                        aria-pressed={grade === g.grade}
                        onClick={() => setGrade(g.grade)}
                        className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
                          grade === g.grade ? 'border-cyan-200 bg-cyan-50 font-medium text-cyan-800' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {g.label}
                      </button>
                    ))}
                  </div>
                ) : (
                  <span />
                )}
                <label className="relative block sm:w-56">
                  <span className="sr-only">Find a student</span>
                  <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Find a student"
                    className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                  />
                </label>
              </div>
            )}

            {failed > 0 && (
              <div role="alert" className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm text-rose-800">
                <ExclamationTriangleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
                {failed === 1 ? "One student's Salaat didn't save." : `${failed} students' Salaat didn't save.`} Change it again to retry.
              </div>
            )}

            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
              {shown.map((s) => {
                const state = rowState.get(s.studentId)
                return (
                  <li key={s.studentId} className="space-y-2.5 px-4 py-3" data-testid={`salaat-row-${s.studentId}`}>
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <p className="min-w-0 truncate text-sm font-semibold text-slate-900">
                        {s.name}
                        <span className="ml-2 text-xs font-normal text-slate-500">
                          {gradeLabel(s.grade)}
                          {canEditAll && s.homeroomTeacher ? ` · ${s.homeroomTeacher}` : ''}
                        </span>
                      </p>
                      <span className="text-xs" aria-live="polite">
                        {state === 'saving' && <span className="text-slate-500">Saving…</span>}
                        {state === 'saved' && (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <CheckIcon className="h-3.5 w-3.5" aria-hidden="true" />
                            Saved
                          </span>
                        )}
                        {state === 'error' && <span className="font-medium text-rose-700">Didn&apos;t save</span>}
                        {!state && isSalaatDone(s) && <span className="text-slate-400">Done</span>}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-6 gap-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-24 text-xs font-medium text-slate-600">Work Habits</span>
                        <RatingButtons label={`Work Habits, ${s.name}`} options={SALAAT_RATINGS} value={s.workHabit} onChange={(v) => change(s, { workHabit: v as SalaatRating })} />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-24 text-xs font-medium text-slate-600 sm:w-auto">Behaviour</span>
                        <RatingButtons label={`Behaviour, ${s.name}`} options={SALAAT_RATINGS} value={s.behavior} onChange={(v) => change(s, { behavior: v as SalaatRating })} />
                      </div>
                    </div>
                    <textarea
                      aria-label={`Comment, ${s.name}`}
                      value={s.comment}
                      maxLength={SALAAT_COMMENT_MAX}
                      rows={2}
                      placeholder="Comment (optional)"
                      onChange={(e) => change(s, { comment: e.target.value }, COMMENT_DELAY_MS)}
                      onBlur={() => flushComment(s)}
                      className={`${textareaClass} text-sm`}
                    />
                  </li>
                )
              })}
              {shown.length === 0 && <li className="px-4 py-6 text-center text-sm text-slate-500">No students match.</li>}
            </ul>
          </div>
        )}
      </ModalBody>
      <ModalFooter>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </ModalFooter>
    </Modal>
  )
}
