// The class's standard comments: one sentence per Core Standards level and per
// Work Habits rating, and the mark cut-offs that suggest a level. Opened from
// the Progress Comments tab. Saving changes what the next rating pick builds;
// comments already built are left as they are.
'use client'

import React, { useEffect, useState } from 'react'
import { ChatBubbleBottomCenterTextIcon } from '@heroicons/react/24/outline'
import Modal from '@/components/shared/modal'
import { Button, Field, FieldRow, FormSection, ModalBody, ModalFooter, ModalHeader, inputClass, selectClass, textareaClass } from '@/components/shared/modalKit'
import {
  CORE_STANDARDS_LEVELS,
  STARTER_COMMENT_BANK,
  buildStandardComment,
  commentBankProblem,
  type CommentStudent,
} from '@/lib/commentBank'
import {
  getClassCommentBank,
  getCommentBankSources,
  resetClassCommentBank,
  saveClassCommentBank,
} from '@/services/commentBankService'
import type { CommentBank, CommentBankCutoffs, CommentBankSource, WorkHabitKey } from '@/services/types/commentBank'
import { useNotificationStore } from '@/store/useNotificationStore'

const WORK_HABITS: { key: WorkHabitKey; label: string }[] = [
  { key: 'E', label: 'E - Excellent' },
  { key: 'G', label: 'G - Good' },
  { key: 'S', label: 'S - Satisfactory' },
  { key: 'N', label: 'N - Needs Improvement' },
]

const CUTOFFS: { key: keyof CommentBankCutoffs; label: string }[] = [
  { key: 'exceeding', label: 'Exceeding from (%)' },
  { key: 'meeting', label: 'Meeting from (%)' },
  { key: 'workingTowards', label: 'Working towards from (%)' },
]

const sameBank = (a: CommentBank, b: CommentBank) => JSON.stringify(a) === JSON.stringify(b)

interface StandardCommentsModalProps {
  isOpen: boolean
  onClose: () => void
  classId: string
  bank: CommentBank
  /** False while the class uses SchoolMule's starter set. */
  bankSaved: boolean
  subject: string
  /** Whose name the preview uses (the class's first student). */
  previewStudent: CommentStudent | null
  onSaved: (bank: CommentBank, saved: boolean) => void
}

export default function StandardCommentsModal({ isOpen, onClose, classId, bank, bankSaved, subject, previewStudent, onSaved }: StandardCommentsModalProps) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [form, setForm] = useState<CommentBank>(bank)
  const [problem, setProblem] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [sources, setSources] = useState<CommentBankSource[]>([])
  const [copying, setCopying] = useState(false)
  const [previewLevel, setPreviewLevel] = useState(CORE_STANDARDS_LEVELS[1].value)

  // Each opening starts from what the class has now.
  useEffect(() => {
    if (!isOpen) return
    setForm(bank)
    setProblem(null)
    getCommentBankSources()
      .then((res) => setSources(res.status === 'success' ? res.data.filter((s) => s.classId !== classId) : []))
      .catch(() => setSources([]))
  }, [isOpen, bank, classId])

  const setSentence = (group: 'coreStandards' | 'workHabits', key: string, value: string) =>
    setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }))

  const setCutoff = (key: keyof CommentBankCutoffs, value: string) =>
    setForm((f) => ({ ...f, cutoffs: { ...f.cutoffs, [key]: value === '' ? Number.NaN : Number(value) } }))

  const copyFrom = async (sourceId: string) => {
    if (!sourceId) return
    setCopying(true)
    try {
      const res = await getClassCommentBank(sourceId)
      if (res.status !== 'success' || !res.data) throw new Error(res.message)
      setForm(res.data)
      setProblem(null)
    } catch {
      setProblem("That class's standard comments couldn't be loaded.")
    } finally {
      setCopying(false)
    }
  }

  const save = async () => {
    const reason = commentBankProblem(form)
    if (reason) {
      setProblem(reason)
      return
    }
    setSaving(true)
    setProblem(null)
    try {
      if (sameBank(form, STARTER_COMMENT_BANK)) {
        // The starter set is what a class without a saved bank uses.
        if (bankSaved) {
          const res = await resetClassCommentBank(classId)
          if (res.status !== 'success') throw new Error(res.message)
        }
        onSaved(STARTER_COMMENT_BANK, false)
      } else {
        const res = await saveClassCommentBank(classId, form)
        if (res.status !== 'success') throw new Error(res.message)
        onSaved(res.data, true)
      }
      showNotification('Standard comments saved', 'success')
      onClose()
    } catch (err) {
      setProblem(err instanceof Error && err.message ? err.message : "The standard comments couldn't be saved.")
    } finally {
      setSaving(false)
    }
  }

  const preview = previewStudent
    ? buildStandardComment({ coreStandards: previewLevel, workHabit: 'G' }, { bank: form, student: previewStudent, subject })
    : ''

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-2xl">
      <ModalHeader
        title="Standard comments"
        subtitle="Picking a Core Standards level and Work Habits builds a student's comment from these sentences."
        icon={ChatBubbleBottomCenterTextIcon}
      />
      <ModalBody>
        <p className="text-sm text-slate-500">
          Use {'{First}'}, {'{he}'}, {'{him}'}, {'{his}'} ({'{He}'}, {'{Him}'}, {'{His}'} at the start of a sentence) and {'{subject}'}.
          SchoolMule fills them in for each student.
        </p>

        {sources.length > 0 && (
          <Field label="Copy from another class" htmlFor="bank-copy">
            <select
              id="bank-copy"
              className={selectClass}
              value=""
              disabled={copying}
              onChange={(e) => void copyFrom(e.target.value)}
            >
              <option value="">Choose a class…</option>
              {sources.map((s) => (
                <option key={s.classId} value={s.classId}>
                  Grade {s.grade} · {s.subject}
                  {s.termName ? ` · ${s.termName}` : ''}
                </option>
              ))}
            </select>
          </Field>
        )}

        <FormSection label="Core Standards">
          {CORE_STANDARDS_LEVELS.map((l) => (
            <Field key={l.key} label={l.label} htmlFor={`bank-cs-${l.key}`}>
              <textarea
                id={`bank-cs-${l.key}`}
                rows={3}
                className={textareaClass}
                value={form.coreStandards[l.key]}
                onChange={(e) => setSentence('coreStandards', l.key, e.target.value)}
              />
            </Field>
          ))}
        </FormSection>

        <FormSection label="Work Habits">
          {WORK_HABITS.map((w) => (
            <Field key={w.key} label={w.label} htmlFor={`bank-wh-${w.key}`}>
              <textarea
                id={`bank-wh-${w.key}`}
                rows={2}
                className={textareaClass}
                value={form.workHabits[w.key]}
                onChange={(e) => setSentence('workHabits', w.key, e.target.value)}
              />
            </Field>
          ))}
        </FormSection>

        <FormSection label="Suggested level from the mark">
          <FieldRow>
            {CUTOFFS.map((c) => (
              <Field key={c.key} label={c.label} htmlFor={`bank-cut-${c.key}`}>
                <input
                  id={`bank-cut-${c.key}`}
                  type="number"
                  min={0}
                  max={100}
                  className={inputClass}
                  value={Number.isFinite(form.cutoffs[c.key]) ? form.cutoffs[c.key] : ''}
                  onChange={(e) => setCutoff(c.key, e.target.value)}
                />
              </Field>
            ))}
          </FieldRow>
        </FormSection>

        {previewStudent && (
          <FormSection label="Preview">
            <select
              aria-label="Preview level"
              className={selectClass}
              value={previewLevel}
              onChange={(e) => setPreviewLevel(e.target.value)}
            >
              {CORE_STANDARDS_LEVELS.map((l) => (
                <option key={l.key} value={l.value}>
                  {l.label}, Work Habits G
                </option>
              ))}
            </select>
            <p className="rounded-xl bg-slate-50 px-3.5 py-2.5 text-sm text-slate-700">{preview}</p>
          </FormSection>
        )}

        {problem && <p className="text-sm text-rose-600">{problem}</p>}
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" type="button" className="mr-auto" onClick={() => setForm(STARTER_COMMENT_BANK)}>
          Reset to SchoolMule&apos;s starter set
        </Button>
        <Button variant="secondary" type="button" onClick={onClose}>
          Cancel
        </Button>
        <Button type="button" loading={saving} disabled={saving} onClick={() => void save()}>
          Save
        </Button>
      </ModalFooter>
    </Modal>
  )
}
