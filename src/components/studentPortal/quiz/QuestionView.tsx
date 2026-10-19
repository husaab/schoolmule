// src/components/studentPortal/quiz/QuestionView.tsx
// One quiz question on its own screen (Student-Quiz board): "Question 2 of 4 ·
// 2 points", the question, its picture and hint, then the answer: big choice
// buttons with a letter (round for one answer, square-ish for several;
// picked: indigo), a one-line box for short text, a large box for a written
// answer. Back / Next ("Review & turn in" on the last) and the numbered dots.
'use client'

import { useEffect, useRef, type KeyboardEvent } from 'react'
import { CheckCircleIcon } from '@heroicons/react/24/solid'
import { answerText, questionLine, rejectedLine } from '@/lib/quizPlayer'
import type { QuizAnswerValue, StudentQuestion } from '@/services/types/quiz'
import QuizDots from './QuizDots'

interface QuestionViewProps {
  question: StudentQuestion
  index: number
  count: number
  answer: QuizAnswerValue | null | undefined
  answered: boolean[]
  /** Questions whose answer the quiz refused (a rose dot). */
  problems?: boolean[]
  /** This question's answer was refused for good: the server's words. */
  rejected?: string | null
  /** "Clear my answer". */
  onClear?: () => void
  nextLabel: string
  /** Nothing can change (a preview of answers already in). */
  readOnly?: boolean
  /** The student moved here (Next, Back, a dot): the question takes the focus. */
  focusOnMount?: boolean
  onPick: (optionId: string) => void
  onText: (value: string) => void
  /** A text box lost focus: save what is in it. */
  onTextBlur: () => void
  onBack: () => void
  onNext: () => void
  onGo: (index: number) => void
}

const letterAt = (i: number) => String.fromCharCode(65 + i)

const field = (value: unknown, key: string): unknown =>
  typeof value === 'object' && value !== null ? (value as Record<string, unknown>)[key] : undefined

export default function QuestionView({
  question,
  index,
  count,
  answer,
  answered,
  problems,
  rejected = null,
  onClear,
  nextLabel,
  readOnly = false,
  focusOnMount = false,
  onPick,
  onText,
  onTextBlur,
  onBack,
  onNext,
  onGo,
}: QuestionViewProps) {
  const choice = field(answer, 'choice')
  const choices = field(answer, 'choices')
  const picked = new Set<string>(typeof choice === 'string' ? [choice] : Array.isArray(choices) ? (choices as string[]) : [])
  const text = typeof field(answer, 'text') === 'string' ? (field(answer, 'text') as string) : ''
  const several = question.kind === 'many'

  // Moving to a question puts the focus on it, so a screen reader reads it and Tab starts at its answers.
  const headingRef = useRef<HTMLHeadingElement>(null)
  useEffect(() => {
    if (focusOnMount) headingRef.current?.focus()
  }, [focusOnMount])

  // Arrow keys move between the choices (Space or Enter picks one), as in any radio group.
  const choicesRef = useRef<HTMLDivElement>(null)
  const onChoicesKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0
    if (!step) return
    const buttons = Array.from(choicesRef.current?.querySelectorAll<HTMLButtonElement>('button[data-choice]') ?? [])
    const at = buttons.findIndex((b) => b === document.activeElement)
    if (at < 0 || buttons.length === 0) return
    e.preventDefault()
    buttons[(at + step + buttons.length) % buttons.length].focus()
  }
  // One tab stop for a radio group: the picked choice, else the first.
  const tabStop = several ? null : (question.options.find((o) => picked.has(o.id))?.id ?? question.options[0]?.id ?? null)

  return (
    <div className="flex flex-col gap-6">
      <span className="text-[15px] font-medium text-indigo-700">{questionLine(index, count, question.points)}</span>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="font-display m-0 text-[26px] font-semibold leading-tight text-slate-900 outline-none [text-wrap:pretty] sm:text-[30px]"
      >
        {question.prompt}
      </h2>
      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- a signed storage link, sized by the box
        <img src={question.imageUrl} alt="" className="max-h-[320px] w-auto max-w-full self-start rounded-2xl border border-slate-200 object-contain" />
      )}
      {question.hint && <span className="-mt-2 text-base text-slate-600">{question.hint}</span>}

      {(question.kind === 'one' || question.kind === 'many') && (
        <div
          ref={choicesRef}
          role={several ? 'group' : 'radiogroup'}
          aria-label={several ? 'Choices (pick all that are right)' : 'Choices (pick one)'}
          onKeyDown={onChoicesKey}
          className="flex flex-col gap-3"
        >
          {question.options.map((o, i) => {
            const on = picked.has(o.id)
            return (
              <button
                key={o.id}
                type="button"
                data-choice
                role={several ? 'checkbox' : 'radio'}
                aria-checked={on}
                tabIndex={tabStop === null || tabStop === o.id ? 0 : -1}
                disabled={readOnly}
                onClick={() => onPick(o.id)}
                className={`flex min-h-[68px] cursor-pointer items-center gap-4 rounded-2xl border-2 px-[18px] py-3.5 text-left text-[17px] text-slate-900 transition-colors disabled:cursor-default sm:text-[19px] ${
                  on ? 'border-indigo-600 bg-indigo-50' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <span
                  className={`flex h-9 w-9 flex-none items-center justify-center border-2 text-[15px] font-semibold ${several ? 'rounded-lg' : 'rounded-full'} ${
                    on ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 bg-white text-slate-600'
                  }`}
                  aria-hidden="true"
                >
                  {letterAt(i)}
                </span>
                <span className="min-w-0 flex-1 break-words">{o.text}</span>
                {on && (
                  // aria-checked already says it to a screen reader.
                  <span aria-hidden="true" className="flex flex-none items-center gap-1 text-sm font-semibold text-indigo-700">
                    <CheckCircleIcon className="h-6 w-6" />
                    <span className="hidden sm:inline">Selected</span>
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {question.kind === 'short' && (
        <label className="flex flex-col gap-2">
          <span className="text-sm text-slate-600">Your answer</span>
          <input
            type="text"
            value={text}
            maxLength={300}
            readOnly={readOnly}
            onChange={(e) => onText(e.target.value)}
            onBlur={onTextBlur}
            placeholder="Type one word or a short phrase"
            className="rounded-2xl border-2 border-indigo-200 bg-white px-5 py-4 text-xl text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </label>
      )}

      {question.kind === 'long' && (
        <label className="flex flex-col gap-2">
          <span className="text-sm text-slate-600">Your answer</span>
          <textarea
            rows={6}
            value={text}
            maxLength={20000}
            readOnly={readOnly}
            onChange={(e) => onText(e.target.value)}
            onBlur={onTextBlur}
            placeholder="Write 2–3 sentences"
            className="resize-y rounded-2xl border-2 border-indigo-200 bg-white px-5 py-4 text-lg leading-relaxed text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
          />
        </label>
      )}

      {readOnly && !answerText(question, answer) && <p className="text-sm text-slate-500">Not answered.</p>}

      {rejected && (
        <div role="alert" className="flex flex-wrap items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-[15px] text-rose-900">
          <span className="min-w-[200px] flex-1">{rejectedLine(rejected)}</span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="min-h-11 cursor-pointer rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100"
            >
              Clear my answer
            </button>
          )}
        </div>
      )}

      <div className="flex justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          disabled={index === 0}
          className="min-h-[52px] min-w-[120px] cursor-pointer rounded-[14px] border border-slate-200 bg-white px-5 py-3.5 text-[17px] font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-white"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onNext}
          className="min-h-[52px] min-w-[160px] cursor-pointer rounded-[14px] bg-indigo-600 px-[22px] py-3.5 text-[17px] font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          {nextLabel}
        </button>
      </div>
      <QuizDots count={count} current={index} answered={answered} problems={problems} onGo={onGo} />
    </div>
  )
}
