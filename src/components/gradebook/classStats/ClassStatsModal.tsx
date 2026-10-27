'use client'

// "Who counts in the class average": every student of the class with a switch.
// A student switched off is left out of the class's pooled statistics (the
// class average, median, rank and every assessment's class average); a name
// opens the choice between the whole class and only some assessments, and an
// optional note for other staff. Every change saves at once. The students'
// own marks never change, and families never see this list.

import React, { useMemo, useState } from 'react'
import { ChartBarIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, ModalBody, ModalFooter, ModalHeader, textareaClass } from '@/components/shared/modalKit'
import Avatar from '@/components/avatar/Avatar'
import { CLASSROOM_AVERAGE_FLOOR, classAverage, leftOutIndex, leftOutOfClassCount, statusLine, toggledColumn } from '@/lib/classStats'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { StudentPayload } from '@/services/types/student'
import type { AssessmentPayload } from '@/services/types/assessment'
import type { StatsExclusion } from '@/services/types/classStatsExclusion'
import type { StatsExclusionDecision, StatsExclusionsState } from '@/hooks/useStatsExclusions'

interface ClassStatsModalProps {
  isOpen: boolean
  onClose: () => void
  students: Pick<StudentPayload, 'studentId' | 'name' | 'avatar' | 'photoUrl'>[]
  /** The class's assessments; the checklist offers the top-level ones (columns and categories). */
  assessments: AssessmentPayload[]
  /** Each student's term grade, when the page has it (the gradebook); omitted elsewhere. */
  gradeOf?: (studentId: string) => number | null
  exclusions: StatsExclusionsState
  /** A past school year or an admin preview: look, don't change. */
  readOnly?: boolean
  /** Opens with this student's choices showing. */
  focusStudentId?: string | null
}

const pct = (v: number | null) => (v == null ? '—' : `${v.toFixed(1)}%`)

const ClassStatsModal: React.FC<ClassStatsModalProps> = ({
  isOpen,
  onClose,
  students,
  assessments,
  gradeOf,
  exclusions,
  readOnly = false,
  focusStudentId = null,
}) => {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [openId, setOpenId] = useState<string | null>(focusStudentId)
  // Chose "Only some assessments" but hasn't ticked one yet (nothing saved).
  const [picking, setPicking] = useState<Set<string>>(new Set())
  const [busyId, setBusyId] = useState<string | null>(null)
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({})

  const { byStudent } = exclusions
  const sorted = useMemo(() => [...students].sort((a, b) => a.name.localeCompare(b.name)), [students])
  const columns = useMemo(() => assessments.filter((a) => !a.parentAssessmentId), [assessments])
  const names = useMemo(() => new Map(assessments.map((a) => [a.assessmentId, a.name])), [assessments])

  // The figures the switches move, when the page knows the grades.
  const summary = useMemo(() => {
    if (!gradeOf) return null
    const index = leftOutIndex(
      exclusions.exclusions,
      assessments.map((a) => ({ assessment_id: a.assessmentId, parent_assessment_id: a.parentAssessmentId ?? null })),
    )
    const grades = students.map((s) => ({ studentId: s.studentId, pct: gradeOf(s.studentId) }))
    return { counted: classAverage(grades, index, 'counted'), everyone: classAverage(grades, index, 'everyone') }
  }, [gradeOf, exclusions.exclusions, assessments, students])
  const leftOutOfClass = leftOutOfClassCount(exclusions.exclusions)

  /** The note to save: what's typed, else the note the student already has. */
  const noteFor = (studentId: string, current: StatsExclusion | undefined) =>
    (noteDrafts[studentId] ?? current?.note ?? '').trim() || null
  const noteOf = (studentId: string) => noteDrafts[studentId] ?? byStudent.get(studentId)?.note ?? ''

  // One change for a student: saved, then the typed note and the half-made
  // "only some assessments" choice are forgotten (the server now holds them).
  const change = async (
    studentId: string,
    name: string,
    decide: StatsExclusionDecision,
    done: (after: StatsExclusion | null) => string | null,
  ) => {
    setBusyId(studentId)
    try {
      const after = await exclusions.update(studentId, decide)
      setNoteDrafts((prev) => {
        const next = { ...prev }
        delete next[studentId]
        return next
      })
      setPicking((prev) => {
        const next = new Set(prev)
        next.delete(studentId)
        return next
      })
      if (!after) setOpenId((id) => (id === studentId ? null : id))
      const message = done(after)
      if (message) showNotification(message, 'success')
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : `Couldn't change ${name}. Try again.`, 'error')
    } finally {
      setBusyId(null)
    }
  }

  const countAgain = (studentId: string, name: string) =>
    change(studentId, name, () => null, () => `${name} counts in the class average again`)

  const leaveOutOfClass = (studentId: string, name: string) =>
    change(
      studentId,
      name,
      (current) => (current?.scope === 'class' ? undefined : { scope: 'class', note: noteFor(studentId, current) }),
      () => `${name} is left out of the class average`,
    )

  const toggleSwitch = (studentId: string, name: string) => {
    if (byStudent.get(studentId)?.scope === 'class') return void countAgain(studentId, name)
    setOpenId(studentId)
    void leaveOutOfClass(studentId, name)
  }

  // A column chip: replaces a whole-class exclusion with just this column.
  const toggleColumn = (studentId: string, name: string, assessmentId: string) =>
    void change(
      studentId,
      name,
      (current) => {
        const next = toggledColumn(current?.scope === 'assessments' ? current : undefined, assessmentId)
        return next && { ...next, note: noteFor(studentId, current) }
      },
      (after) => (after ? `Saved for ${name}` : `${name} counts in the class average again`),
    )

  const saveNote = (studentId: string, name: string) => {
    if (noteDrafts[studentId] === undefined) return
    void change(
      studentId,
      name,
      (current) => {
        const note = noteFor(studentId, current)
        if (!current || (current.note ?? null) === note) return undefined
        return { scope: current.scope, assessmentIds: current.assessmentIds, note }
      },
      (after) => (after ? `Note saved for ${name}` : null),
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-2xl" fullScreenOnMobile>
      <ModalHeader
        title="Who counts in the class average"
        subtitle="Students you leave out keep every mark and their term grade. They're left out of the class average, median, rank and every assessment's class average. Families never see this list."
        icon={ChartBarIcon}
      />

      <ModalBody>
        {summary && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <span className="font-display text-[28px] font-semibold leading-none tabular-nums text-slate-900">
              {pct(summary.counted.average)}
            </span>
            <span className="text-[13px] leading-snug text-slate-500 tabular-nums">
              {pct(summary.everyone.average)} with everyone
              <br />
              {students.length - leftOutOfClass} of {students.length} students counted
            </span>
          </div>
        )}
        {summary && summary.counted.n > 0 && summary.counted.n < CLASSROOM_AVERAGE_FLOOR && (
          <p className="text-[13px] text-amber-700">
            With fewer than {CLASSROOM_AVERAGE_FLOOR} students counted, Classes won&apos;t show students a class average.
          </p>
        )}
        {exclusions.error && <p className="text-sm text-rose-700">{exclusions.error}</p>}

        <ul className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
          {sorted.map((stu) => {
            const e = byStudent.get(stu.studentId)
            const isPicking = picking.has(stu.studentId)
            const mode = isPicking ? 'assessments' : e?.scope ?? null
            const counted = e?.scope !== 'class'
            const expanded = openId === stu.studentId
            const busy = busyId === stu.studentId
            const grade = gradeOf?.(stu.studentId)
            const detailId = `class-stats-${stu.studentId}`
            return (
              <li key={stu.studentId}>
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <Avatar student name={stu.name} avatar={stu.avatar ?? null} photoUrl={stu.photoUrl} size={30} />
                  <button
                    type="button"
                    onClick={() => setOpenId(expanded ? null : stu.studentId)}
                    aria-expanded={expanded}
                    aria-controls={detailId}
                    className="flex min-w-0 flex-1 cursor-pointer items-center gap-1.5 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-slate-900">{stu.name}</span>
                      <span className={`block truncate text-xs ${isPicking ? 'text-amber-700' : e ? 'text-slate-700' : 'text-slate-500'}`}>
                        {statusLine(e, isPicking, names)}
                      </span>
                    </span>
                    <ChevronDownIcon className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </button>
                  {grade !== undefined && <span className="w-14 text-right text-sm tabular-nums text-slate-600">{pct(grade)}</span>}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={counted}
                    aria-label={`Count ${stu.name} in the class average`}
                    disabled={readOnly || busy}
                    onClick={() => toggleSwitch(stu.studentId, stu.name)}
                    className={`relative h-[22px] w-[38px] shrink-0 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                      counted ? 'bg-cyan-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-[3px] h-4 w-4 rounded-full bg-white shadow transition-[left] ${counted ? 'left-[19px]' : 'left-[3px]'}`}
                    />
                  </button>
                </div>

                {expanded && (
                  <div id={detailId} className="flex flex-col gap-3 px-4 pb-4 pl-[58px] text-sm">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Leave out of</span>
                      <div className="flex flex-wrap gap-1.5">
                        <ScopePill
                          pressed={mode === 'class'}
                          disabled={readOnly || busy}
                          onClick={() => void leaveOutOfClass(stu.studentId, stu.name)}
                        >
                          The whole class
                        </ScopePill>
                        <ScopePill
                          pressed={mode === 'assessments'}
                          disabled={readOnly || busy || columns.length === 0}
                          onClick={() => setPicking((prev) => new Set(prev).add(stu.studentId))}
                        >
                          Only some assessments
                        </ScopePill>
                      </div>
                    </div>

                    {mode === 'assessments' && (
                      <div className="flex flex-wrap gap-1.5" role="group" aria-label={`Assessments ${stu.name} is left out of`}>
                        {columns.map((a) => (
                          <ScopePill
                            key={a.assessmentId}
                            pressed={e?.scope === 'assessments' && e.assessmentIds.includes(a.assessmentId)}
                            disabled={readOnly || busy}
                            onClick={() => toggleColumn(stu.studentId, stu.name, a.assessmentId)}
                          >
                            {a.name}
                            {a.isParent ? ' (category)' : ''}
                          </ScopePill>
                        ))}
                      </div>
                    )}

                    {e && (
                      <>
                        <label className="flex flex-col gap-1.5">
                          <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Note for other staff (optional)</span>
                          <textarea
                            rows={2}
                            maxLength={500}
                            value={noteOf(stu.studentId)}
                            disabled={readOnly || busy}
                            onChange={(ev) => setNoteDrafts((prev) => ({ ...prev, [stu.studentId]: ev.target.value }))}
                            onBlur={() => saveNote(stu.studentId, stu.name)}
                            placeholder="e.g. ESL newcomer, modified expectations"
                            className={textareaClass}
                          />
                        </label>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs text-slate-500">
                            {e.createdByName ? `Set by ${e.createdByName} · ` : ''}
                            {new Date(e.createdAt).toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })}
                          </span>
                          <Button variant="secondary" disabled={readOnly || busy} onClick={() => void countAgain(stu.studentId, stu.name)}>
                            Count everywhere again
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </ModalBody>

      <ModalFooter>
        <span className="mr-auto text-xs text-slate-500">Changes save as you make them.</span>
        <Button onClick={onClose}>Done</Button>
      </ModalFooter>
    </Modal>
  )
}

function ScopePill({
  pressed,
  disabled,
  onClick,
  children,
}: {
  pressed: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={`cursor-pointer rounded-full border px-3 py-1 text-[13px] transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
        pressed ? 'border-cyan-600 bg-cyan-50 font-medium text-cyan-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
      }`}
    >
      {children}
    </button>
  )
}

export default ClassStatsModal
