// src/components/tours/TourCards.tsx
// The New card that offers a tour, the card at the end, and the pill that
// lets a paused tour pick up again.
'use client'
import { useEffect, useRef } from 'react'
import { CheckIcon, PlayIcon, SparklesIcon, XMarkIcon } from '@heroicons/react/24/solid'
import type { TourDefinition } from '@/lib/tours'
import type { TourTone } from './tourTone'

function Scrim() {
  return <div className="tour-fade fixed inset-0 z-[95] bg-slate-900/55" aria-hidden="true" />
}

function useFocusFirst<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })
  }, [])
  return ref
}

export function OfferCard({
  def,
  stepCount,
  tone,
  onStart,
  onLater,
  onNever,
}: {
  def: TourDefinition
  stepCount: number
  tone: TourTone
  onStart: () => void
  onLater: () => void
  onNever: () => void
}) {
  const ref = useFocusFirst<HTMLDivElement>()
  const welcome = def.offer.kind === 'welcome'
  return (
    <>
      <Scrim />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-offer-title"
        className="tour-pop fixed left-1/2 top-1/2 z-[96] w-[min(400px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className={`relative h-28 ${tone.soft}`}>
          <span className={`absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold shadow-sm ${tone.softText}`}>
            <SparklesIcon className="h-3.5 w-3.5" />
            {welcome ? 'Welcome' : 'New in SchoolMule'}
          </span>
          <div aria-hidden="true" className="absolute bottom-0 right-6 grid h-[76px] w-40 content-start gap-2 rounded-t-xl bg-white p-3 shadow-[0_-6px_20px_-10px_rgba(2,6,23,0.25)]">
            <i className="block h-2 w-[70%] rounded bg-slate-200" />
            <i className="block h-2 w-[90%] rounded bg-slate-200" />
            <i className="tour-ring-soft block h-3.5 w-[46%] rounded-md" style={{ background: tone.ring, boxShadow: `0 0 0 4px #fff, 0 0 0 6px ${tone.ring}` }} />
          </div>
        </div>
        <div className="px-5 pb-1 pt-4">
          <h2 id="tour-offer-title" className="text-lg font-semibold text-slate-900">
            {def.offer.title}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">{def.offer.blurb}</p>
          <p className="mt-2 text-xs text-slate-500">{stepCount} short steps</p>
        </div>
        <div className="flex items-center gap-2 px-5 pb-5 pt-4">
          <button type="button" onClick={onNever} className="text-[13px] text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline">
            Don’t show again
          </button>
          <span className="flex-1" />
          <button type="button" onClick={onLater} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            Later
          </button>
          <button type="button" data-autofocus onClick={onStart} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tone.primary}`}>
            Show me how
          </button>
        </div>
      </div>
    </>
  )
}

export function DoneCard({ def, tone, onReplay, onClose }: { def: TourDefinition; tone: TourTone; onReplay: () => void; onClose: () => void }) {
  const ref = useFocusFirst<HTMLDivElement>()
  return (
    <>
      <Scrim />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-done-title"
        className="tour-pop fixed left-1/2 top-1/2 z-[96] w-[min(380px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <div className={`grid h-28 place-items-center ${tone.soft}`}>
          <span className="tour-check grid h-14 w-14 place-items-center rounded-full text-white" style={{ background: tone.ring }}>
            <CheckIcon className="h-8 w-8" />
          </span>
        </div>
        <div className="px-5 pb-1 pt-4">
          <h2 id="tour-done-title" className="text-lg font-semibold text-slate-900">
            You’re all set
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-slate-600">
            Replay “{def.offer.title}” any time from the <span className="font-semibold">?</span> button at the top of the page.
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 pb-5 pt-4">
          <button type="button" onClick={onReplay} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900">
            Replay
          </button>
          <span className="flex-1" />
          <button type="button" data-autofocus onClick={onClose} className={`rounded-xl px-4 py-2 text-sm font-semibold ${tone.primary}`}>
            Done
          </button>
        </div>
      </div>
    </>
  )
}

export function PausedPill({
  def,
  index,
  count,
  tone,
  onResume,
  onDrop,
}: {
  def: TourDefinition
  index: number
  count: number
  tone: TourTone
  onResume: () => void
  onDrop: () => void
}) {
  return (
    <div className="tour-pop fixed bottom-4 left-4 z-[96] flex max-w-[calc(100vw-32px)] items-center gap-0.5 rounded-full bg-slate-900 p-1 text-white shadow-xl lg:left-[19rem]">
      <button type="button" onClick={onResume} className="flex min-w-0 items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3 text-[13px] hover:bg-white/10">
        <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full" style={{ background: tone.ring }}>
          <PlayIcon className="h-3.5 w-3.5" />
        </span>
        <span className="truncate">
          Resume “{def.offer.title}” · step {index + 1} of {count}
        </span>
      </button>
      <button type="button" onClick={onDrop} aria-label="Hide" className="grid h-7 w-7 shrink-0 place-items-center rounded-full opacity-70 hover:bg-white/10 hover:opacity-100">
        <XMarkIcon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
