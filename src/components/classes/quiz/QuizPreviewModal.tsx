// src/components/classes/quiz/QuizPreviewModal.tsx
// "Preview as a student" (Teacher-Quiz board): the student's quiz player,
// run on the builder's questions as they stand, in a large window. It is
// local only: nothing is started, saved or turned in, and the answer key
// never enters it (the questions go through previewQuestions).
'use client'

import { useMemo } from 'react'
import Modal from '@/components/shared/modal'
import QuizDone from '@/components/studentPortal/quiz/QuizDone'
import QuizPlayer from '@/components/studentPortal/quiz/QuizPlayer'
import { previewQuestions, totalPoints, type DraftQuestion } from '@/lib/quizBuilder'
import { doneCopy, playerSubline } from '@/lib/quizPlayer'
import type { QuizRelease } from '@/services/types/quiz'

interface QuizPreviewModalProps {
  isOpen: boolean
  /** Changes each time it opens, so every preview starts at question 1 with nothing answered. */
  run: number
  onClose: () => void
  title: string
  subject: string
  teacherName: string | null
  release: QuizRelease
  questions: DraftQuestion[]
}

export default function QuizPreviewModal({ isOpen, run, onClose, title, subject, teacherName, release, questions }: QuizPreviewModalProps) {
  const shown = useMemo(() => previewQuestions(questions), [questions])
  const written = questions.filter((q) => q.kind === 'long').length

  return (
    <Modal isOpen={isOpen} onClose={onClose} style="w-full max-w-5xl h-[85vh]">
      <div className="h-full overflow-y-auto">
        {shown.length === 0 ? (
          <div className="flex h-full items-center justify-center p-10 text-center text-slate-600">Add a question to preview the quiz.</div>
        ) : (
          <QuizPlayer
            key={run}
            embedded
            title={title || 'Quiz'}
            subline={playerSubline(subject, totalPoints(questions))}
            questions={shown}
            initialAnswers={{}}
            onTurnIn={async () => true}
            finishLater={{ label: 'Close preview', onClick: onClose }}
            notice={
              <p className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm text-cyan-900">
                Preview: this is what students see. Nothing here is saved or turned in.
              </p>
            }
            done={
              <QuizDone
                copy={doneCopy({ first: '', teacher: teacherName, writtenCount: written, release })}
                action={{ label: 'Close preview', onClick: onClose }}
              />
            }
          />
        )}
      </div>
    </Modal>
  )
}
