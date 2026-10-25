'use client'
import { useState } from 'react'
import Image from 'next/image'
import { Expand } from 'lucide-react'
import Modal from '@/components/shared/modal'
import { trackEvent } from './film/filmEvents'
import { cx } from './ui'

// Real report cards, printed by SchoolMule's own templates for the demo
// school (docs/research/landing-revamp/report-card-renders.md). A stack of
// pages that opens a closer look in a modal.

const SAMPLES = [
  {
    key: 'grade5',
    label: 'Grade 5 report card',
    src: '/marketing/reports/report-card-grade5-p2.jpg',
    alt: 'Page 2 of a Grade 5 report card: Language Arts 86.4% and Math 91.2%, with work habits, behaviour and teacher comments',
  },
  {
    key: 'grade5-cover',
    label: 'Report card cover page',
    src: '/marketing/reports/report-card-grade5.jpg',
    alt: 'Page 1 of a Grade 5 report card with student details and the grading legend',
  },
  {
    key: 'sk',
    label: 'SK skills report card',
    src: '/marketing/reports/kindergarten-report.jpg',
    alt: 'A Senior Kindergarten report card rating math skills from Exemplary to Needs Improvement, with comments',
  },
] as const

type SampleKey = (typeof SAMPLES)[number]['key']

export function ReportSampleModal({ open, initial = 'grade5', onClose }: { open: boolean; initial?: SampleKey; onClose: () => void }) {
  const [active, setActive] = useState<SampleKey>(initial)
  const sample = SAMPLES.find((s) => s.key === active)!
  return (
    <Modal isOpen={open} onClose={onClose} closeOnEscape ariaLabel="Sample report cards" style="w-[min(94vw,52rem)]" maxHeightClass="max-h-[94vh]">
      <div className="mk flex min-h-0 flex-col">
        <div className="flex flex-wrap gap-2 border-b border-hairline px-4 py-3 pr-14 sm:px-5">
          {SAMPLES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => setActive(s.key)}
              aria-pressed={s.key === active}
              className={cx(
                'rounded-full px-3 py-1 text-sm font-medium ring-1 transition-colors duration-150',
                s.key === active ? 'bg-ink text-white ring-ink' : 'bg-white text-slate-700 ring-hairline hover:ring-slate-300',
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="overflow-y-auto bg-mist p-4 sm:p-6">
          <Image
            key={sample.key}
            src={sample.src}
            alt={sample.alt}
            width={1700}
            height={2402}
            sizes="(min-width: 860px) 780px, 90vw"
            className="mx-auto block h-auto w-full max-w-[780px] rounded-md bg-white shadow-[0_20px_50px_-30px_rgba(11,19,36,0.5)] ring-1 ring-ink/[0.06]"
          />
          <p className="mt-3 text-center text-xs text-slate-600">Demo school with sample data. Printed by SchoolMule as a PDF.</p>
        </div>
      </div>
    </Modal>
  )
}

/** Two report card pages fanned out; opens the samples. */
export default function ReportSamples({ from }: { from: string }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          trackEvent('report_samples_open', { from })
        }}
        className="group relative mx-auto block w-full max-w-[30rem] rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
        aria-label="Open sample report cards"
      >
        <span className="relative block aspect-[1700/1900] w-[78%] translate-x-[24%] rotate-[3deg] overflow-hidden rounded-lg bg-white shadow-[0_24px_50px_-28px_rgba(11,19,36,0.45)] ring-1 ring-ink/[0.07] transition-transform duration-300 ease-film group-hover:rotate-[4deg] max-sm:rotate-0 max-sm:translate-x-[18%]">
          <Image src="/marketing/reports/kindergarten-report.jpg" alt="" fill quality={60} sizes="(min-width: 640px) 380px, 70vw" className="object-cover object-top" />
        </span>
        <span className="absolute left-0 top-[8%] block aspect-[1700/1700] w-[78%] -rotate-[2deg] overflow-hidden rounded-lg bg-white shadow-[0_30px_60px_-28px_rgba(11,19,36,0.55)] ring-1 ring-ink/[0.07] transition-transform duration-300 ease-film group-hover:-rotate-[3deg] max-sm:rotate-0">
          <Image src="/marketing/reports/report-card-grade5-p2.jpg" alt="" fill quality={60} sizes="(min-width: 640px) 380px, 70vw" className="object-cover object-top" />
        </span>
        <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-2 text-sm font-semibold text-ink shadow-[0_8px_24px_-12px_rgba(11,19,36,0.5)] ring-1 ring-ink/5">
          <Expand aria-hidden className="size-4" strokeWidth={1.75} />
          Open sample report cards
        </span>
      </button>
      <ReportSampleModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}

/** A text button that opens the samples (the demo page's third door). */
export function ReportSamplesLink({ from, children = 'See sample report cards' }: { from: string; children?: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true)
          trackEvent('report_samples_open', { from })
        }}
        className="rounded-sm font-semibold text-brand-ink underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/30"
      >
        {children}
      </button>
      <ReportSampleModal open={open} onClose={() => setOpen(false)} />
    </>
  )
}
