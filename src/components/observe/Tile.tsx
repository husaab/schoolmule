// src/components/observe/Tile.tsx
'use client'
// A headline figure with a sparkline and a change against the previous
// window. Tone colours only the bar on the left so a scan lands on what
// needs attention; the number itself stays white.
import { useEffect, useRef, useState } from 'react'
import Sparkline from './Sparkline'
import { C } from './chartTheme'

export type TileTone = 'neutral' | 'good' | 'warn' | 'bad'
const BAR: Record<TileTone, string> = { neutral: 'bg-white/[0.12]', good: 'bg-emerald-400', warn: 'bg-amber-400', bad: 'bg-rose-400' }
const SPARK: Record<TileTone, string> = { neutral: C.primary, good: C.good, warn: C.warn, bad: C.bad }

interface TileProps {
  label: string
  value: string
  delta?: number | null
  /** Which direction counts as good for the delta badge. */
  deltaGoodWhen?: 'up' | 'down'
  spark?: number[]
  tone?: TileTone
  sub?: string
  loading?: boolean
}

// Animates numeric text changes with a short count-up. State holds only the
// in-flight frame; outside an animation the value itself is rendered, so the
// effect never sets state synchronously.
function useAnimatedValue(value: string) {
  const [frame, setFrame] = useState<string | null>(null)
  const prev = useRef(value)
  useEffect(() => {
    const previous = prev.current
    prev.current = value
    const from = parseFloat(previous.replace(/[^0-9.]/g, ''))
    const to = parseFloat(value.replace(/[^0-9.]/g, ''))
    const hasWords = /[a-zA-Z]/.test(value.replace(/ms|s|%|k|M/g, ''))
    if (!Number.isFinite(from) || !Number.isFinite(to) || from === to || hasWords) return
    const suffix = value.replace(/[0-9.,]/g, '')
    const decimals = (value.split('.')[1] || '').replace(/[^0-9]/g, '').length
    const start = performance.now()
    let raf = 0
    const step = (t: number) => {
      const p = Math.min(1, (t - start) / 300)
      const eased = 1 - Math.pow(1 - p, 3)
      if (p < 1) {
        setFrame(`${(from + (to - from) * eased).toFixed(decimals)}${suffix}`)
        raf = requestAnimationFrame(step)
      } else {
        setFrame(null)
      }
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return frame ?? value
}

export default function Tile({ label, value, delta, deltaGoodWhen = 'up', spark, tone = 'neutral', sub, loading }: TileProps) {
  const shown = useAnimatedValue(value)
  const good = delta !== null && delta !== undefined && (deltaGoodWhen === 'up' ? delta >= 0 : delta <= 0)
  return (
    <div className="observe-in relative overflow-hidden rounded-2xl border border-white/[0.06] bg-slate-900/60 pl-4 pr-3 pt-3 pb-2">
      <span className={`absolute left-0 top-0 bottom-0 w-[3px] ${BAR[tone]}`} aria-hidden />
      <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{label}</p>
      {loading ? (
        <span className="block h-7 w-16 mt-1 rounded-md bg-white/[0.05] animate-pulse" />
      ) : (
        <p className="mt-0.5 font-mono text-2xl font-semibold text-white tabular-nums leading-tight">{shown}</p>
      )}
      <div className="mt-1 flex items-center gap-2 text-[11px] h-4">
        {delta !== undefined && delta !== null && Number.isFinite(delta) && (
          <span className={`rounded-md px-1.5 py-px font-semibold tabular-nums ${good ? 'bg-emerald-400/10 text-emerald-300' : 'bg-rose-400/10 text-rose-300'}`}>
            {delta >= 0 ? '+' : '−'}{Math.abs(delta * 100).toFixed(0)}%
          </span>
        )}
        {sub && <span className="text-slate-500 truncate">{sub}</span>}
      </div>
      {spark && spark.length > 1 && <div className="-mx-1 mt-1"><Sparkline data={spark} color={SPARK[tone]} height={36} /></div>}
    </div>
  )
}
