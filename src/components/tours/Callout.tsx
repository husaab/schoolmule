// src/components/tours/Callout.tsx
// The step's bubble: where you are, what this is, what to do. Beside the
// target on a wide screen; a sheet docked to the top or bottom on a phone,
// away from the target, so it never covers the thing to tap.
'use client'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { CursorArrowRaysIcon, PencilIcon, XMarkIcon } from '@heroicons/react/24/outline'
import type { RunSub, Step } from '@/lib/tours'
import type { SpotRect } from './Spotlight'
import type { TourTone } from './tourTone'

const GAP = 14
const MARGIN = 12
const PHONE_PX = 640

type Side = 'top' | 'bottom' | 'left' | 'right' | 'none'
interface Placement {
  x: number
  y: number
  side: Side
  arrow: number
  sheet: boolean
}

function place(rect: SpotRect | null, w: number, h: number, pref: Step['placement']): Placement {
  const vw = window.innerWidth
  const vh = window.innerHeight
  if (vw < PHONE_PX) {
    const below = !rect || rect.top + rect.height / 2 < vh / 2
    return { x: MARGIN, y: below ? vh - h - MARGIN : MARGIN + 8, side: 'none', arrow: 0, sheet: true }
  }
  if (!rect) return { x: (vw - w) / 2, y: (vh - h) / 2, side: 'none', arrow: 0, sheet: false }
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  const fits: Record<Exclude<Side, 'none'>, boolean> = {
    right: rect.left + rect.width + GAP + w <= vw - MARGIN,
    bottom: rect.top + rect.height + GAP + h <= vh - MARGIN,
    top: rect.top - GAP - h >= MARGIN,
    left: rect.left - GAP - w >= MARGIN,
  }
  const order: Array<Exclude<Side, 'none'>> = [
    ...(pref && pref !== 'auto' ? [pref] : []),
    'right',
    'bottom',
    'top',
    'left',
  ]
  const side = order.find((s) => fits[s])
  const clampX = (x: number) => Math.max(MARGIN, Math.min(vw - w - MARGIN, x))
  const clampY = (y: number) => Math.max(MARGIN, Math.min(vh - h - MARGIN, y))
  switch (side) {
    case 'right': {
      const y = clampY(cy - h / 2)
      return { x: rect.left + rect.width + GAP, y, side, arrow: Math.max(18, Math.min(h - 18, cy - y)), sheet: false }
    }
    case 'left': {
      const y = clampY(cy - h / 2)
      return { x: rect.left - GAP - w, y, side, arrow: Math.max(18, Math.min(h - 18, cy - y)), sheet: false }
    }
    case 'bottom': {
      const x = clampX(cx - w / 2)
      return { x, y: rect.top + rect.height + GAP, side, arrow: Math.max(18, Math.min(w - 18, cx - x)), sheet: false }
    }
    case 'top': {
      const x = clampX(cx - w / 2)
      return { x, y: rect.top - GAP - h, side, arrow: Math.max(18, Math.min(w - 18, cx - x)), sheet: false }
    }
    default:
      return { x: clampX(cx - w / 2), y: vh - h - MARGIN, side: 'none', arrow: 0, sheet: false }
  }
}

export interface CalloutProps {
  step: Step
  index: number
  count: number
  sub: RunSub
  typed: boolean
  rect: SpotRect | null
  tone: TourTone
  /** Bumped when a click lands outside the highlight: the bubble shakes. */
  nudge: number
  /** Animate moves between steps (not while the page scrolls). */
  glide: boolean
  onNext: () => void
  onBack: () => void
  onDoIt: () => void
  onSkip: () => void
  onPause: () => void
}

export default function Callout({ step, index, count, sub, typed, rect, tone, nudge, glide, onNext, onBack, onDoIt, onSkip, onPause }: CalloutProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<Placement | null>(null)
  const missing = sub === 'missing'
  const last = index === count - 1
  const touch = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
  const verb = touch ? 'Tap' : 'Click'

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const next = place(rect, el.offsetWidth, el.offsetHeight, step.placement)
    setPos((p) => (p && p.x === next.x && p.y === next.y && p.side === next.side && p.arrow === next.arrow && p.sheet === next.sheet ? p : next))
    // The bubble's size changes with its step, the missing note and the typed hint.
  }, [rect, step.id, step.placement, sub, typed])

  useEffect(() => {
    const el = ref.current
    if (!el || !nudge) return
    el.classList.remove('tour-nudge')
    void el.offsetWidth
    el.classList.add('tour-nudge')
  }, [nudge])

  // Each new step: move focus into the bubble (without scrolling the page).
  useLayoutEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus({ preventScroll: true })
  }, [step.id, missing])

  const hint =
    step.kind === 'click'
      ? `${verb} the highlighted spot to go on.`
      : step.kind === 'type'
        ? typed
          ? 'Looks good. Choose Next when you’re ready.'
          : 'Type in the highlighted box.'
        : null

  const arrowStyle: React.CSSProperties | undefined =
    !pos || pos.side === 'none'
      ? undefined
      : pos.side === 'bottom'
        ? { top: -6, left: pos.arrow - 7 }
        : pos.side === 'top'
          ? { bottom: -6, left: pos.arrow - 7 }
          : pos.side === 'right'
            ? { left: -6, top: pos.arrow - 7 }
            : { right: -6, top: pos.arrow - 7 }

  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-step-title"
      aria-describedby="tour-step-body"
      className={`fixed z-[96] rounded-2xl bg-white p-4 text-slate-900 shadow-2xl ring-1 ring-slate-900/5 ${pos?.sheet ? '' : 'w-[320px]'} ${glide ? 'tour-glide' : ''}`}
      style={{
        left: pos?.x ?? -9999,
        top: pos?.y ?? -9999,
        width: pos?.sheet ? `calc(100vw - ${MARGIN * 2}px)` : undefined,
        visibility: pos ? 'visible' : 'hidden',
      }}
    >
      {arrowStyle && <span aria-hidden="true" className="absolute h-3.5 w-3.5 rotate-45 rounded-[3px] bg-white" style={arrowStyle} />}
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium tabular-nums text-slate-500">
            Step {index + 1} of {count}
          </span>
          {(step.kind === 'click' || step.kind === 'type') && !missing && (
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.soft} ${tone.softText}`}>Your turn</span>
          )}
          <button
            type="button"
            onClick={onPause}
            aria-label="Pause the tour"
            title="Pause (Esc)"
            className="ml-auto -mr-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
        <h2 id="tour-step-title" className="mt-1 text-[17px] font-semibold leading-snug" aria-live="polite">
          {step.title}
        </h2>
        <p id="tour-step-body" className="mt-1 text-sm leading-relaxed text-slate-600">
          {missing ? 'This part of the page didn’t show up, so this step can’t point at it. You can skip ahead.' : step.body}
        </p>
        {hint && !missing && (
          <p className={`mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] ${typed ? 'bg-emerald-50 text-emerald-800' : `${tone.soft} ${tone.softText}`}`}>
            {step.kind === 'type' ? <PencilIcon className="h-4 w-4 shrink-0" /> : <CursorArrowRaysIcon className="h-4 w-4 shrink-0" />}
            {hint}
          </p>
        )}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex gap-1.5" aria-hidden="true">
            {Array.from({ length: count }, (_, k) => (
              <span
                key={k}
                className={`h-1.5 rounded-full transition-all ${k === index ? `w-4 ${tone.dot}` : k < index ? `w-1.5 ${tone.dot} opacity-50` : 'w-1.5 bg-slate-200'}`}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            {index > 0 && (
              <button type="button" onClick={onBack} className="rounded-lg border border-slate-200 px-3 py-1.5 text-[13px] font-medium text-slate-600 hover:text-slate-900">
                Back
              </button>
            )}
            {missing ? (
              <button type="button" data-autofocus onClick={onSkip} className={`rounded-lg px-3 py-1.5 text-[13px] font-medium ${tone.primary}`}>
                Skip this step
              </button>
            ) : (
              <>
                {step.kind === 'click' && !step.realAction && (
                  <button type="button" data-autofocus onClick={onDoIt} className={`rounded-lg px-3 py-1.5 text-[13px] font-medium ${tone.soft} ${tone.softText}`}>
                    Do it for me
                  </button>
                )}
                {step.kind === 'type' && !typed && (
                  <button type="button" onClick={onDoIt} className={`rounded-lg px-3 py-1.5 text-[13px] font-medium ${tone.soft} ${tone.softText}`}>
                    Take me there
                  </button>
                )}
                {step.kind !== 'click' && (
                  <button
                    type="button"
                    data-autofocus
                    onClick={onNext}
                    disabled={step.kind === 'type' && !typed}
                    className={`rounded-lg px-3 py-1.5 text-[13px] font-medium disabled:cursor-not-allowed disabled:opacity-40 ${tone.primary}`}
                  >
                    {last ? 'Finish' : 'Next'}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
