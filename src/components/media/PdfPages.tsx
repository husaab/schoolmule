// src/components/media/PdfPages.tsx
// A PDF drawn page by page, for phones and tablets: their browsers show a PDF
// in a frame badly (often just the first page, or a download). Pages near the
// screen are drawn and those far away let go of their canvas, so a long PDF
// doesn't run a phone out of memory. A sideways swipe moves to the next file
// while the page isn't zoomed; up and down scroll.
'use client'

import { useEffect, useRef, useState } from 'react'
import Spinner from '@/components/Spinner'
import type { Size } from '@/lib/zoomMath'
import { loadPdfjs, type PdfDocumentProxy } from './loadPdfjs'

interface PdfPagesProps {
  url: string
  quarterTurns: number
  /** 1 is the width of the screen. */
  zoom: number
  /** The file wouldn't load: the viewer asks for a fresh link. */
  onBroken: () => void
  onSwipe: (direction: 1 | -1) => void
}

const PANE_PADDING = 12
const SWIPE_DISTANCE = 60
/** iOS refuses to draw a canvas much past this along a side. */
const MAX_CANVAS_SIDE = 4096
/** A letter page, until the real one is known. */
const PAGE_RATIO = 11 / 8.5

function PdfPage({ doc, number, width, quarterTurns, pane }: { doc: PdfDocumentProxy; number: number; width: number; quarterTurns: number; pane: HTMLElement | null }) {
  const frame = useRef<HTMLDivElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [near, setNear] = useState(number === 1)
  const [size, setSize] = useState<Size | null>(null)

  useEffect(() => {
    const el = frame.current
    if (!el || !pane) return
    const observer = new IntersectionObserver(([entry]) => setNear(entry.isIntersecting), { root: pane, rootMargin: '100% 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [pane])

  useEffect(() => {
    if (!near || width <= 0) return
    let cancelled = false
    let task: ReturnType<Awaited<ReturnType<PdfDocumentProxy['getPage']>>['render']> | null = null
    void doc
      .getPage(number)
      .then((page) => {
        const target = canvas.current
        const context = target?.getContext('2d')
        if (cancelled || !target || !context) return
        const rotation = (page.rotate + quarterTurns * 90) % 360
        const fit = width / page.getViewport({ scale: 1, rotation }).width
        const sharpness = Math.min(window.devicePixelRatio || 1, 2, MAX_CANVAS_SIDE / width)
        const viewport = page.getViewport({ scale: fit * sharpness, rotation })
        target.width = Math.floor(viewport.width)
        target.height = Math.floor(viewport.height)
        setSize({ width: viewport.width / sharpness, height: viewport.height / sharpness })
        task = page.render({ canvas: target, canvasContext: context, viewport })
        return task.promise
      })
      .catch(() => {
        // A cancelled draw, or one bad page: the others still show.
      })
    return () => {
      cancelled = true
      task?.cancel()
    }
  }, [near, doc, number, width, quarterTurns])

  return (
    <div
      ref={frame}
      style={{ width: size?.width ?? width, height: size?.height ?? width * PAGE_RATIO }}
      className="shrink-0 bg-white shadow-lg"
      aria-label={`Page ${number} of ${doc.numPages}`}
      role="img"
    >
      {near && <canvas ref={canvas} className="block h-full w-full" />}
    </div>
  )
}

export default function PdfPages({ url, quarterTurns, zoom, onBroken, onSwipe }: PdfPagesProps) {
  const [doc, setDoc] = useState<PdfDocumentProxy | null>(null)
  const [pane, setPane] = useState<HTMLDivElement | null>(null)
  const [paneWidth, setPaneWidth] = useState(0)
  const pressed = useRef<{ x: number; y: number } | null>(null)
  const broken = useRef(onBroken)
  useEffect(() => {
    broken.current = onBroken
  })

  useEffect(() => {
    let cancelled = false
    let task: ReturnType<Awaited<ReturnType<typeof loadPdfjs>>['getDocument']> | null = null
    loadPdfjs()
      .then((pdfjs) => {
        if (cancelled) return null
        task = pdfjs.getDocument({ url })
        return task.promise
      })
      .then((loaded) => {
        if (!cancelled && loaded) setDoc(loaded)
      })
      .catch(() => {
        if (!cancelled) broken.current()
      })
    return () => {
      cancelled = true
      void task?.destroy()
    }
  }, [url])

  useEffect(() => {
    if (!pane) return
    const observer = new ResizeObserver(([entry]) => setPaneWidth(entry.contentRect.width))
    observer.observe(pane)
    return () => observer.disconnect()
  }, [pane])

  const width = paneWidth * zoom - PANE_PADDING * 2
  // Zoomed in, a sideways drag belongs to the page; fitted, it is ours and means "next".
  const touch = zoom > 1 ? 'touch-auto' : 'touch-pan-y touch-pinch-zoom'

  return (
    <div
      ref={setPane}
      className={`h-full w-full overflow-auto ${touch}`}
      onPointerDown={(e) => {
        pressed.current = { x: e.clientX, y: e.clientY }
      }}
      onPointerCancel={() => {
        pressed.current = null
      }}
      onPointerUp={(e) => {
        const from = pressed.current
        pressed.current = null
        if (!from || zoom > 1) return
        const dx = e.clientX - from.x
        if (Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dx) > Math.abs(e.clientY - from.y) * 2) onSwipe(dx < 0 ? 1 : -1)
      }}
    >
      {!doc ? (
        <div className="flex h-full items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="flex w-max min-w-full flex-col items-center gap-3" style={{ padding: PANE_PADDING }}>
          {Array.from({ length: doc.numPages }, (_, i) => (
            <PdfPage key={i} doc={doc} number={i + 1} width={width} quarterTurns={quarterTurns} pane={pane} />
          ))}
        </div>
      )}
    </div>
  )
}
