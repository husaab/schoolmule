'use client'
import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, m, useInView, useReducedMotion } from 'framer-motion'
import { BrowserBar, Tray } from './frames'
import { VIEW_COLOURS, type ViewKey } from '@/lib/marketing/site'
import { cx } from './ui'

// "Follow one quiz through the school": the film's story told with its real
// captures. One set of records carries a grade from the teacher's gradebook
// to the student, to the parent, and back to the teacher as a question.
//
// The steps advance on their own while the section is on screen, and stop
// for good once someone picks a step. Each screen pushes in slowly toward the
// part that matters, like the film's camera (not for reduced motion).

interface Step {
  who: string
  view: ViewKey
  title: string
  detail: string
  src: string
  url: string
  alt: string
  /** transform-origin for the slow push-in, as "x% y%". */
  focus: string
}

const STEPS: Step[] = [
  {
    who: 'Teacher',
    view: 'teachers',
    title: 'Ms. Saleh enters Quiz 3.',
    detail: 'Scores save as she types, and the quiz totals update.',
    src: '/marketing/screens/teacher-scores.jpg',
    url: 'schoolmule.ca/classes/grade-5-math',
    alt: 'The Grade 5 Math quizzes grid with a score of 19 being typed for Adam Haddad',
    focus: '63% 56%',
  },
  {
    who: 'Teacher',
    view: 'teachers',
    title: 'She clicks Publish & Notify.',
    detail: 'Families only see grades once they are published, and each one gets a single email.',
    src: '/marketing/screens/teacher-publish.jpg',
    url: 'schoolmule.ca/classes/grade-5-math',
    alt: 'The publish dialog for Quiz 3, which will notify 23 parents covering 12 students',
    focus: '63% 74%',
  },
  {
    who: 'Student',
    view: 'students',
    title: 'Adam sees 19 out of 20.',
    detail: 'It is at the top of his new grades the moment it is published.',
    src: '/marketing/screens/student-home.jpg',
    url: 'schoolmule.ca/student',
    alt: "Adam's student home, with Quiz 3 at 19 out of 20 under New grades",
    focus: '78% 33%',
  },
  {
    who: 'Parent',
    view: 'parents',
    title: 'His mother asks about it.',
    detail: 'She writes to the teacher from the grade itself, so the question carries its context.',
    src: '/marketing/screens/parent-ask.jpg',
    url: 'schoolmule.ca/parent/grades',
    alt: 'The parent grades page with a message to Layla Saleh about Quiz 3 being written',
    focus: '60% 34%',
  },
  {
    who: 'Teacher',
    view: 'teachers',
    title: 'The question arrives with Quiz 3 pinned.',
    detail: 'Ms. Saleh sees the grade, the class average and the message together, and replies.',
    src: '/marketing/screens/teacher-reply.jpg',
    url: 'schoolmule.ca/messages',
    alt: "The teacher's messages, with Amal Haddad's question and Quiz 3 pinned to the conversation",
    focus: '70% 38%',
  },
]

const STEP_MS = 5200

export default function QuizStory() {
  const [current, setCurrent] = useState(0)
  const [userChose, setUserChose] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const inView = useInView(root, { amount: 0.4 })
  const reduce = useReducedMotion()
  const auto = inView && !userChose && !reduce

  useEffect(() => {
    if (!auto) return
    const t = window.setTimeout(() => setCurrent((c) => (c + 1) % STEPS.length), STEP_MS)
    return () => window.clearTimeout(t)
  }, [auto, current])

  const step = STEPS[current]

  return (
    <div ref={root} className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.5fr)] lg:gap-12">
      <ol className="order-2 grid gap-1.5 lg:order-1">
        {STEPS.map((s, i) => {
          const active = i === current
          const colours = VIEW_COLOURS[s.view]
          return (
            <li key={s.title}>
              <button
                type="button"
                aria-current={active ? 'step' : undefined}
                onClick={() => {
                  setUserChose(true)
                  setCurrent(i)
                }}
                className={cx(
                  'grid w-full grid-cols-[2.25rem_1fr] items-start gap-3 rounded-2xl px-3.5 py-3.5 text-left transition-[background-color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
                  active ? 'bg-white shadow-[0_14px_34px_-22px_rgba(11,19,36,0.45)] ring-1 ring-ink/[0.07]' : 'hover:bg-white/60',
                )}
              >
                <span
                  aria-hidden
                  className={cx(
                    'grid size-8 place-items-center rounded-full text-sm font-semibold tabular-nums ring-1 transition-colors duration-200',
                    active ? cx(colours.dot, 'text-white ring-transparent') : 'bg-white text-slate-600 ring-hairline',
                  )}
                >
                  {i + 1}
                </span>
                <span className="grid gap-0.5">
                  <span className={cx('text-sm font-medium', active ? colours.text : 'text-slate-600')}>{s.who}</span>
                  <span className={cx('font-semibold leading-snug', active ? 'text-ink' : 'text-slate-700')}>{s.title}</span>
                  <span
                    className={cx(
                      'text-[0.95rem] leading-relaxed text-slate-600',
                      // Only the active step's detail shows on phones, to keep the list short.
                      !active && 'max-lg:hidden',
                    )}
                  >
                    {s.detail}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      <div className="order-1 lg:sticky lg:top-28 lg:order-2">
        <Tray>
          <BrowserBar url={step.url} />
          <div className="relative aspect-[8/5] overflow-hidden bg-white">
            <AnimatePresence initial={false}>
              <m.div
                key={current}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className={cx('absolute inset-0', !reduce && 'mk-push')}
                  style={{ transformOrigin: step.focus, animationDuration: `${STEP_MS + 600}ms` }}
                >
                  <Image
                    src={step.src}
                    alt={step.alt}
                    fill
                    sizes="(min-width: 1024px) 700px, 100vw"
                    className="object-cover object-top"
                  />
                </div>
              </m.div>
            </AnimatePresence>
          </div>
        </Tray>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-hairline" aria-hidden>
            {auto && <div key={current} className="mk-progress h-full rounded-full bg-brand" style={{ animationDuration: `${STEP_MS}ms` }} />}
          </div>
          <p className="text-sm text-slate-600" aria-live="polite">
            Step {current + 1} of {STEPS.length}
          </p>
        </div>
      </div>
    </div>
  )
}
