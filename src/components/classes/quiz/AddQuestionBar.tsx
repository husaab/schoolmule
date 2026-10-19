// src/components/classes/quiz/AddQuestionBar.tsx
// The dashed bar under the questions (Teacher-Quiz board): "Add a question"
// with One answer · Several answers · Short text · Written answer, and Image,
// which adds an image to the selected question. Written answers are off
// while scores show right after submit; at 50 questions nothing more is added.
'use client'

import { PhotoIcon } from '@heroicons/react/24/outline'
import { MAX_QUESTIONS, QUESTION_KIND_LABELS, QUESTION_KINDS } from '@/lib/quizBuilder'
import type { QuestionKind } from '@/services/types/quiz'

interface AddQuestionBarProps {
  count: number
  onAdd: (kind: QuestionKind) => void
  /** Adds an image to the selected question; null when there is no question to add it to. */
  onImage: (() => void) | null
  /** "Question 3": where Image puts the image. */
  imageTarget: string | null
  writtenOff: boolean
  disabled: boolean
}

const BUTTON =
  'inline-flex cursor-pointer items-center gap-1.5 rounded-[10px] border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 transition-colors hover:border-slate-300 hover:bg-white disabled:cursor-not-allowed disabled:opacity-50'

export default function AddQuestionBar({ count, onAdd, onImage, imageTarget, writtenOff, disabled }: AddQuestionBarProps) {
  const full = count >= MAX_QUESTIONS
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1.5 text-sm text-slate-600">Add a question</span>
        {QUESTION_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            onClick={() => onAdd(kind)}
            disabled={disabled || full || (kind === 'long' && writtenOff)}
            title={kind === 'long' && writtenOff ? 'Choose "After I review and publish" under Show scores to add a written answer.' : undefined}
            className={BUTTON}
          >
            {QUESTION_KIND_LABELS[kind]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onImage?.()}
          disabled={disabled || !onImage}
          title={imageTarget ? `Adds an image to ${imageTarget.toLowerCase()}` : 'Add a question first'}
          className={BUTTON}
        >
          <PhotoIcon className="h-4 w-4" aria-hidden="true" />
          Image
        </button>
      </div>
      {full && <p className="text-xs text-slate-500">A quiz holds at most 50 questions.</p>}
      {writtenOff && !full && (
        <p className="text-xs text-slate-500">Written answers need you to grade them, so they aren&apos;t offered while scores show right after submit.</p>
      )}
      {imageTarget && onImage && <p className="text-xs text-slate-500">Image goes on {imageTarget.toLowerCase()}, the one you&apos;re working on.</p>}
    </div>
  )
}
