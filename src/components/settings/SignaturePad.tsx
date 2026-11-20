// src/components/settings/SignaturePad.tsx
// A 3:1 pad to sign on with a mouse, a finger or a pen (pointer events). It
// records strokes (lib/signatureStrokes.ts), the format the server draws the
// saved signature from, so what is saved matches what was drawn.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { extendStroke, padSize, penWidth, startStroke, type Point, type Stroke } from '@/lib/signatureStrokes'

interface SignaturePadProps {
  strokes: Stroke[]
  onChange: (strokes: Stroke[], size: { width: number; height: number }) => void
}

export default function SignaturePad({ strokes, onChange }: SignaturePadProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [size, setSize] = useState({ width: 600, height: 200 })
  const drawing = useRef(false)
  const live = useRef<Stroke[]>(strokes)

  useEffect(() => {
    live.current = strokes
  }, [strokes])

  // Fit the container's width, 3:1.
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const fit = () => setSize(padSize(el.clientWidth))
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Redraw everything (cheap: a signature is a few hundred points).
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const ratio = window.devicePixelRatio || 1
    canvas.width = Math.round(size.width * ratio)
    canvas.height = Math.round(size.height * ratio)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.clearRect(0, 0, size.width, size.height)
    ctx.strokeStyle = '#111111'
    ctx.fillStyle = '#111111'
    ctx.lineWidth = penWidth(size.width, size.height) * 1.4
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    for (const s of strokes) {
      if (s.length === 1) {
        ctx.beginPath()
        ctx.arc(s[0][0], s[0][1], ctx.lineWidth / 2, 0, Math.PI * 2)
        ctx.fill()
        continue
      }
      ctx.beginPath()
      s.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)))
      ctx.stroke()
    }
  }, [strokes, size])

  const pointOf = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = e.currentTarget.getBoundingClientRect()
    return [e.clientX - rect.left, e.clientY - rect.top]
  }

  const emit = useCallback((next: Stroke[]) => {
    live.current = next
    onChange(next, size)
  }, [onChange, size])

  return (
    <div ref={wrapRef} className="w-full">
      <div className="relative rounded-xl border-2 border-dashed border-slate-300 bg-white" style={{ height: size.height }}>
        <canvas
          ref={canvasRef}
          role="img"
          aria-label="Signature pad: sign here with your mouse, finger or pen"
          style={{ width: size.width, height: size.height, touchAction: 'none' }}
          className="block cursor-crosshair rounded-xl"
          onPointerDown={(e) => {
            if (e.button !== 0 && e.pointerType === 'mouse') return
            e.currentTarget.setPointerCapture(e.pointerId)
            drawing.current = true
            emit(startStroke(live.current, pointOf(e)))
          }}
          onPointerMove={(e) => {
            if (!drawing.current) return
            const events = e.nativeEvent.getCoalescedEvents?.() ?? [e.nativeEvent]
            const rect = e.currentTarget.getBoundingClientRect()
            let next = live.current
            for (const ev of events) next = extendStroke(next, [ev.clientX - rect.left, ev.clientY - rect.top])
            if (next !== live.current) emit(next)
          }}
          onPointerUp={() => {
            drawing.current = false
          }}
          onPointerCancel={() => {
            drawing.current = false
          }}
        />
        {/* The line to sign on, and the hint while the pad is empty. */}
        <div className="pointer-events-none absolute inset-x-6 border-b border-slate-300" style={{ top: size.height * 0.72 }} aria-hidden />
        {strokes.length === 0 && (
          <span className="pointer-events-none absolute left-6 text-sm text-slate-400" style={{ top: size.height * 0.72 - 24 }} aria-hidden>
            Sign here
          </span>
        )}
      </div>
    </div>
  )
}
