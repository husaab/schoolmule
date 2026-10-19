// src/components/classes/quiz/QuestionCard.tsx
// One question in the quiz builder (Teacher-Quiz board): "Question {i}", the
// type (One answer / Several answers / Short text / Written answer), points
// with "pt"/"pts", the question itself, an optional image, then the
// answers: choices with the right ones marked (OptionsEditor), accepted
// answers (AcceptedAnswersEditor), or the "You grade this one" badge for a
// written answer. Move up / down and delete (with a confirm) on every card.
// What still stops the question from saving is listed at its foot.
'use client'

import { useState } from 'react'
import { ArrowDownIcon, ArrowUpIcon, PhotoIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline'
import {
  changeKind,
  parsePointsText,
  pointsUnit,
  PROMPT_MAX,
  QUESTION_KIND_LABELS,
  QUESTION_KINDS,
  type DraftQuestion,
} from '@/lib/quizBuilder'
import type { QuestionKind } from '@/services/types/quiz'
import AcceptedAnswersEditor from './AcceptedAnswersEditor'
import OptionsEditor from './OptionsEditor'

interface QuestionCardProps {
  question: DraftQuestion
  index: number
  count: number
  /** What still stops this question from saving. */
  issues: string[]
  selected: boolean
  onSelect: () => void
  onChange: (next: DraftQuestion) => void
  onMove: (delta: -1 | 1) => void
  onDelete: () => void
  /** Students have answered it: its type can't change (409 QUIZ_TAKEN). */
  kindLocked: boolean
  /** Students have turned the quiz in: a saved question can't be removed (409 QUIZ_TAKEN). */
  deleteLocked: boolean
  /** Scores show right after submit: no written answers (the server would refuse). */
  writtenOff: boolean
  /** The choice ids as last saved (a new choice avoids them). */
  reservedOptionIds: string[]
  /** The image is going up. */
  imageBusy: boolean
  onPickImage: () => void
  disabled: boolean
}

const fmt = (n: number) => String(Math.round(n * 100) / 100)

const ICON_BUTTON =
  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent'

/** The points box: it keeps what is typed ("1." on the way to "1.5") and hands up a number, or null when empty. */
function PointsInput({ value, label, disabled, onChange }: { value: number | null; label: string; disabled: boolean; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(value === null ? '' : fmt(value))
  return (
    <label className="flex items-center gap-1.5 text-[13px] text-slate-600">
      <input
        type="text"
        inputMode="decimal"
        value={text}
        disabled={disabled}
        aria-label={`${label} points`}
        onChange={(e) => {
          const parsed = parsePointsText(e.target.value)
          if (!parsed) return
          setText(e.target.value)
          onChange(parsed.value)
        }}
        className="w-14 rounded-[10px] border border-slate-200 px-2 py-[7px] text-center text-[13px] text-slate-900 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
      {pointsUnit(value)}
    </label>
  )
}

export default function QuestionCard({
  question: q,
  index,
  count,
  issues,
  selected,
  onSelect,
  onChange,
  onMove,
  onDelete,
  kindLocked,
  deleteLocked,
  writtenOff,
  reservedOptionIds,
  imageBusy,
  onPickImage,
  disabled,
}: QuestionCardProps) {
  const [confirming, setConfirming] = useState(false)
  const label = `Question ${index + 1}`

  return (
    <article
      id={`quiz-question-${q.key}`}
      aria-label={label}
      onFocusCapture={onSelect}
      onPointerDown={onSelect}
      className={`flex flex-col gap-3.5 rounded-2xl border bg-white px-4 py-5 transition-shadow sm:px-[22px] ${
        selected ? 'border-cyan-300 shadow-[0_0_0_3px_rgba(103,232,249,0.35)]' : 'border-slate-200/70'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[13px] font-semibold text-slate-600">{label}</span>
        {q.kind === 'long' && <span className="rounded-full bg-amber-100 px-2 py-[3px] text-xs text-amber-900">You grade this one</span>}
        <span className="flex-1" />
        <select
          aria-label={`${label} type`}
          value={q.kind}
          disabled={disabled || kindLocked}
          title={kindLocked ? "Students have answered this one, so its type can't change." : undefined}
          onChange={(e) => onChange(changeKind(q, e.target.value as QuestionKind))}
          className="cursor-pointer rounded-[10px] border border-slate-200 bg-white px-2.5 py-[7px] text-[13px] text-slate-700 disabled:cursor-not-allowed disabled:bg-slate-50"
        >
          {QUESTION_KINDS.map((k) => (
            <option key={k} value={k} disabled={k === 'long' && writtenOff && q.kind !== 'long'}>
              {QUESTION_KIND_LABELS[k]}
            </option>
          ))}
        </select>
        <PointsInput value={q.points} label={label} disabled={disabled} onChange={(points) => onChange({ ...q, points })} />
        <div className="flex items-center">
          <button type="button" onClick={() => onMove(-1)} disabled={disabled || index === 0} aria-label={`Move ${label} up`} className={ICON_BUTTON}>
            <ArrowUpIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => onMove(1)}
            disabled={disabled || index === count - 1}
            aria-label={`Move ${label} down`}
            className={ICON_BUTTON}
          >
            <ArrowDownIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={disabled || deleteLocked}
            aria-label={`Delete ${label}`}
            title={deleteLocked ? 'Students have already taken this quiz, so its questions stay.' : undefined}
            className={`${ICON_BUTTON} hover:!text-rose-700`}
          >
            <TrashIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {confirming && (
        <div role="alertdialog" aria-label={`Delete ${label}?`} className="flex flex-wrap items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-900">
          <span className="flex-1">Delete {label.toLowerCase()}? Its answers and points go with it.</span>
          <button
            type="button"
            onClick={() => {
              setConfirming(false)
              onDelete()
            }}
            className="cursor-pointer rounded-lg bg-rose-600 px-3 py-1.5 text-[13px] font-medium text-white hover:bg-rose-700"
          >
            Delete
          </button>
          <button
            type="button"
            onClick={() => setConfirming(false)}
            className="cursor-pointer rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-[13px] font-medium text-rose-800 hover:bg-rose-100"
          >
            Keep
          </button>
        </div>
      )}

      <textarea
        id={`quiz-prompt-${q.key}`}
        rows={2}
        value={q.prompt}
        maxLength={PROMPT_MAX}
        disabled={disabled}
        onChange={(e) => onChange({ ...q, prompt: e.target.value })}
        aria-label={label}
        placeholder={q.kind === 'long' ? 'e.g. Why do plant cells need a cell wall? Explain in 2–3 sentences.' : 'Type the question'}
        className="resize-y rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-base text-slate-900 outline-none focus:border-cyan-400 focus:bg-white focus:ring-2 focus:ring-cyan-100 disabled:cursor-not-allowed"
      />

      {(q.imageUrl || q.imagePath || imageBusy) && (
        <div className="flex flex-wrap items-end gap-3">
          {imageBusy ? (
            <div className="h-28 w-40 animate-pulse rounded-xl bg-slate-100" aria-label="The image is uploading" />
          ) : q.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- a signed storage link
            <img src={q.imageUrl} alt={`${label} image`} className="max-h-48 max-w-full rounded-xl border border-slate-200 object-contain" />
          ) : (
            <span className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-600">
              <PhotoIcon className="h-4 w-4" aria-hidden="true" />
              Image attached
            </span>
          )}
          {!imageBusy && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onPickImage}
                disabled={disabled}
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Replace image
              </button>
              <button
                type="button"
                onClick={() => onChange({ ...q, imagePath: null, imageUrl: null })}
                disabled={disabled}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[13px] text-slate-700 hover:border-rose-200 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <XMarkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                Remove image
              </button>
            </div>
          )}
        </div>
      )}

      {(q.kind === 'one' || q.kind === 'many') && (
        <OptionsEditor question={q} label={label} reserved={reservedOptionIds} disabled={disabled} onChange={onChange} />
      )}
      {q.kind === 'short' && <AcceptedAnswersEditor question={q} label={label} disabled={disabled} onChange={onChange} />}
      {q.kind === 'long' && (
        <p className="text-[13px] text-slate-500">Students write the answer in a few sentences. You give the points when you review it.</p>
      )}

      {issues.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-[13px] text-amber-900">
          <span className="font-medium">Not saved yet. To save it:</span>
          <ul className="mt-1 list-disc pl-5">
            {issues.map((m) => (
              <li key={m}>{m}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
