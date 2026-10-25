'use client'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import Link from 'next/link'
import { AnimatePresence, m } from 'framer-motion'
import { Check } from 'lucide-react'
import FilmPlayer from './film/FilmPlayer'
import { Tray } from './frames'
import { chapter, VIEW_COLOURS, type ViewKey } from '@/lib/marketing/site'
import { cx } from './ui'

// "Four views. One set of records." Each tab plays its view's chapter of the
// film, with "Watch with sound" opening the full film at that chapter.

interface View {
  key: ViewKey
  tab: string
  title: string
  points: string[]
  href: string
  linkLabel: string
  chapter: 'teachers' | 'students' | 'parents' | 'office'
}

const VIEWS: View[] = [
  {
    key: 'leaders',
    tab: 'School leaders',
    title: 'See the whole school without chasing it.',
    points: [
      'Report cards for a whole class at once',
      'Timetables built from your rules, or by hand',
      'Staff hours for each pay period',
      'Every family conversation in one inbox',
    ],
    href: '/for/school-leaders',
    linkLabel: 'How it works for school leaders',
    chapter: 'office',
  },
  {
    key: 'teachers',
    tab: 'Teachers',
    title: 'Attendance and grades in minutes, and families told in one click.',
    points: ['The day at a glance', 'Attendance with Mark all present', 'A gradebook that saves as you type', 'Publish & Notify emails each family'],
    href: '/for/teachers',
    linkLabel: 'How it works for teachers',
    chapter: 'teachers',
  },
  {
    key: 'parents',
    tab: 'Parents',
    title: 'Know how your child is doing without calling the office.',
    points: [
      'A short summary of the week',
      'Grades with the teacher’s feedback',
      'Ask the teacher about a specific grade',
      'No app to install',
    ],
    href: '/for/parents',
    linkLabel: 'How it works for parents',
    chapter: 'parents',
  },
  {
    key: 'students',
    tab: 'Students',
    title: 'Classwork, feedback and what’s due, in one place.',
    points: ['What’s due and what’s new', 'Turn in work and take quizzes', 'Feedback on every graded item', 'Works on a phone'],
    href: '/for/students',
    linkLabel: 'How it works for students',
    chapter: 'students',
  },
]

export default function ViewTabs({ initial = 'teachers' }: { initial?: ViewKey }) {
  const [active, setActive] = useState<ViewKey>(initial)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const baseId = useId()
  const view = VIEWS.find((v) => v.key === active)!
  const colours = VIEW_COLOURS[active]
  const clip = chapter(view.chapter)

  const onKey = (e: KeyboardEvent, i: number) => {
    const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!step && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? VIEWS.length - 1 : (i + step + VIEWS.length) % VIEWS.length
    setActive(VIEWS[next].key)
    tabs.current[next]?.focus()
  }

  return (
    <div>
      <div role="tablist" aria-label="Views" className="flex flex-wrap gap-2">
        {VIEWS.map((v, i) => {
          const selected = v.key === active
          return (
            <button
              key={v.key}
              ref={(el) => {
                tabs.current[i] = el
              }}
              role="tab"
              id={`${baseId}-tab-${v.key}`}
              aria-selected={selected}
              aria-controls={`${baseId}-panel`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActive(v.key)}
              onKeyDown={(e) => onKey(e, i)}
              className={cx(
                'relative inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[0.98rem] font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
                selected ? 'text-ink' : 'text-slate-600 hover:text-ink',
              )}
            >
              {selected && (
                <span className="absolute inset-0 rounded-full bg-white shadow-[0_6px_18px_-10px_rgba(11,19,36,0.35)] ring-1 ring-ink/[0.08]" />
              )}
              <span aria-hidden className={cx('relative size-2.5 rounded-full', VIEW_COLOURS[v.key].dot)} />
              <span className="relative">{v.tab}</span>
            </button>
          )
        })}
      </div>

      <div
        id={`${baseId}-panel`}
        role="tabpanel"
        aria-labelledby={`${baseId}-tab-${active}`}
        className="mt-8 grid items-center gap-10 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.6fr)] lg:gap-14"
      >
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={active}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="grid content-start gap-5"
          >
            <h3 className="text-balance text-2xl font-semibold leading-snug tracking-[-0.02em] text-ink sm:text-[1.75rem]">
              {view.title}
            </h3>
            <ul className="grid gap-3">
              {view.points.map((p) => (
                <li key={p} className="grid grid-cols-[1.5rem_1fr] items-start gap-2 text-slate-600">
                  <Check aria-hidden strokeWidth={2} className={cx('mt-0.5 size-5', colours.text)} />
                  {p}
                </li>
              ))}
            </ul>
            <Link
              href={view.href}
              className={cx(
                'w-fit rounded-sm font-semibold underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30',
                colours.text,
              )}
            >
              {view.linkLabel}
            </Link>
          </m.div>
        </AnimatePresence>

        <Tray>
          <FilmPlayer
            key={active}
            src={clip.loop}
            poster={clip.poster}
            startAt={clip.start}
            from={`views-${active}`}
            length={null}
            pillPosition="bottom"
            sizes="(min-width: 1024px) 720px, 100vw"
            className="rounded-none"
          />
        </Tray>
      </div>
    </div>
  )
}
