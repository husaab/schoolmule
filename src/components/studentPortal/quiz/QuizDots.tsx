// src/components/studentPortal/quiz/QuizDots.tsx
// The numbered squares under a quiz question (Student-Quiz board): one per
// question, to jump straight to it. The current one is filled indigo, an
// answered one is tinted, the rest are plain.
'use client'

interface QuizDotsProps {
  count: number
  current: number
  answered: boolean[]
  onGo: (index: number) => void
}

export default function QuizDots({ count, current, answered, onGo }: QuizDotsProps) {
  return (
    <nav aria-label="Questions" className="flex flex-wrap justify-center gap-2">
      {Array.from({ length: count }, (_, i) => {
        const here = i === current
        const done = answered[i]
        const tone = here
          ? 'border-indigo-600 bg-indigo-600 text-white'
          : done
            ? 'border-indigo-200 bg-indigo-50 text-indigo-800 hover:border-indigo-300'
            : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
        return (
          <button
            key={i}
            type="button"
            onClick={() => onGo(i)}
            aria-label={`Go to question ${i + 1}${done ? ', answered' : ''}`}
            aria-current={here ? 'step' : undefined}
            className={`h-10 w-10 cursor-pointer rounded-xl border-2 text-[15px] font-semibold transition-colors ${tone}`}
          >
            {i + 1}
          </button>
        )
      })}
    </nav>
  )
}
