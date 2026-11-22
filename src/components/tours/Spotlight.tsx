// src/components/tours/Spotlight.tsx
// Dims the page and cuts a highlight around the target. Four click-catchers
// surround the highlight so a stray click only nudges the callout; on a "Your
// turn" step the highlight itself stays open, so the real click lands on the
// real button. With no target (a centred card) the whole page is dimmed.
'use client'

const PAD = 6

export interface SpotRect {
  left: number
  top: number
  width: number
  height: number
}

export function spotRect(r: DOMRect | null): SpotRect | null {
  if (!r) return null
  const vw = window.innerWidth
  const vh = window.innerHeight
  const left = Math.max(2, r.left - PAD)
  const top = Math.max(2, r.top - PAD)
  const right = Math.min(vw - 2, r.right + PAD)
  const bottom = Math.min(vh - 2, r.bottom + PAD)
  return { left, top, width: Math.max(0, right - left), height: Math.max(0, bottom - top) }
}

export default function Spotlight({
  rect,
  open,
  ring,
  glide,
  onStray,
}: {
  rect: SpotRect | null
  /** The highlight lets clicks through ("Your turn"). */
  open: boolean
  ring: string
  /** Animate the move (between steps), not while the page scrolls. */
  glide: boolean
  onStray: () => void
}) {
  if (!rect) {
    return <div className="tour-fade fixed inset-0 z-[95] bg-slate-900/55" onClick={onStray} aria-hidden="true" />
  }
  const { left, top, width, height } = rect
  const radius = Math.min(14, height / 2)
  const catcher = 'fixed z-[95]'
  return (
    <>
      <div
        aria-hidden="true"
        className={`pointer-events-none fixed z-[95] ${glide ? 'tour-glide' : ''}`}
        style={{
          left,
          top,
          width,
          height,
          borderRadius: radius,
          boxShadow: '0 0 0 2px rgba(255,255,255,0.92), 0 0 0 9999px rgba(15,23,42,0.55)',
        }}
      >
        {open && <span className="tour-ring absolute -inset-[3px] border-2" style={{ borderColor: ring, borderRadius: radius + 3 }} />}
      </div>
      <div className={catcher} style={{ left: 0, top: 0, right: 0, height: top }} onClick={onStray} />
      <div className={catcher} style={{ left: 0, top: top + height, right: 0, bottom: 0 }} onClick={onStray} />
      <div className={catcher} style={{ left: 0, top, width: left, height }} onClick={onStray} />
      <div className={catcher} style={{ left: left + width, top, right: 0, height }} onClick={onStray} />
      {!open && <div className={catcher} style={{ left, top, width, height }} onClick={onStray} />}
    </>
  )
}
