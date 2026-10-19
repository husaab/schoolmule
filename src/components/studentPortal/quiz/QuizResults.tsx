// src/components/studentPortal/quiz/QuizResults.tsx
// A graded quiz on the item page: each question with the student's answer,
// the points it earned and, when the teacher shows them, the right answer,
// plus the teacher's note on an answer. It only renders once the server sends
// `results` (the grade is out); the right answers come inside them, never
// before.
'use client'

import { resultRows, resultsScoreLine, type ResultRow } from '@/lib/quizPlayer'
import type { StudentQuiz } from '@/services/types/quiz'

interface QuizResultsProps {
  quiz: StudentQuiz
  teacherName: string | null
}

const fmt = (n: number) => String(Math.round(n * 100) / 100)

const TONE: Record<ResultRow['tone'], string> = {
  full: 'bg-emerald-50 text-emerald-800 ring-emerald-200',
  part: 'bg-amber-50 text-amber-900 ring-amber-200',
  none: 'bg-rose-50 text-rose-800 ring-rose-200',
  pending: 'bg-slate-100 text-slate-600 ring-slate-200',
}

export default function QuizResults({ quiz, teacherName }: QuizResultsProps) {
  if (!quiz.results) return null
  const rows = resultRows(quiz)
  const setByTeacher = resultsScoreLine(quiz.results, teacherName)
  return (
    <section aria-labelledby="quiz-results-title" className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h3 id="quiz-results-title" className="text-[15px] font-semibold text-slate-900">
          Your answers
        </h3>
        <span className="text-sm text-slate-600">
          {fmt(quiz.results.earned)} / {fmt(quiz.results.possible)} points
        </span>
      </div>
      {setByTeacher && <p className="rounded-xl bg-indigo-50 px-3 py-2 text-sm leading-relaxed text-indigo-900">{setByTeacher}</p>}
      <ol className="flex flex-col gap-2.5">
        {rows.map((r) => (
          <li key={r.questionId} className="flex flex-col gap-1.5 rounded-[14px] border border-slate-200 bg-white px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <span className="text-xs font-medium text-slate-500">Question {r.n}</span>
              <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${TONE[r.tone]}`}>
                {r.points === null ? 'Not graded yet' : `${fmt(r.points)} / ${fmt(r.possible)}`}
              </span>
            </div>
            <p className="text-sm font-medium leading-snug text-slate-900">{r.prompt}</p>
            <p className="text-sm leading-relaxed text-slate-700">
              <span className="text-slate-500">Your answer: </span>
              {r.answer ? <span className="whitespace-pre-wrap break-words">{r.answer}</span> : <span className="italic text-slate-500">No answer</span>}
            </p>
            {r.right && (
              <p className="text-sm leading-relaxed text-emerald-800">
                <span className="text-emerald-700">{r.kind === 'short' ? 'Accepted answers: ' : 'Right answer: '}</span>
                {r.right}
              </p>
            )}
            {r.note && (
              <p className="whitespace-pre-wrap break-words rounded-xl bg-indigo-50 px-3 py-2 text-sm leading-relaxed text-slate-800">
                <span className="text-indigo-800">{teacherName ?? 'Your teacher'}: </span>
                {r.note}
              </p>
            )}
          </li>
        ))}
      </ol>
    </section>
  )
}
