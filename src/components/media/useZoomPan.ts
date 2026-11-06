// src/components/media/useZoomPan.ts
// The viewer's hands on a picture, on one set of pointer events so touch, pen
// and mouse agree: two fingers pinch, one finger pans a zoomed picture and
// swipes a fitted one to the next, a double-tap (or a click) zooms in and back
// out, the wheel and a trackpad pinch zoom at the cursor. Tapping the dark
// around the picture closes. The sums are in lib/zoomMath, shared with the app.
'use client'

import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react'
import { clampView, FIT_VIEW, isOnContent, pinchView, toggleZoom, zoomAt, type Point, type Size, type ZoomView } from '@/lib/zoomMath'

/** Further than this and a press is a drag, not a tap. */
const TAP_SLOP = 8
const DOUBLE_TAP_MS = 300
const DOUBLE_TAP_REACH = 30
/** A swipe: this far, or a quick flick of at least FLICK_MIN. */
const SWIPE_DISTANCE = 60
const FLICK_MIN = 20
const FLICK_SPEED = 0.5

type Gesture =
  | { kind: 'one'; start: ZoomView; at: Point; startedAt: number; moved: boolean }
  | { kind: 'pinch'; start: ZoomView; at: Point; spread: number }

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y)
const middle = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })

interface UseZoomPanOptions {
  stageRef: RefObject<HTMLElement | null>
  stage: Size | null
  /** The picture on screen once turned, unzoomed; null until it has loaded. */
  content: Size | null
  /** False for what handles its own hands (a PDF). */
  enabled: boolean
  /** Any change puts the picture back to fitted: the next file, a turn. */
  resetKey: string
  onSwipe: (direction: 1 | -1) => void
  onTapOutside: () => void
}

export function useZoomPan({ stageRef, stage, content, enabled, resetKey, onSwipe, onTapOutside }: UseZoomPanOptions) {
  const [view, setView] = useState<ZoomView>(FIT_VIEW)
  const [swipeX, setSwipeX] = useState(0)
  const [gesturing, setGesturing] = useState(false)
  const [lastKey, setLastKey] = useState(resetKey)
  if (lastKey !== resetKey) {
    setLastKey(resetKey)
    setView(FIT_VIEW)
  }

  const pointers = useRef(new Map<number, Point>())
  const gesture = useRef<Gesture | null>(null)
  const lastTap = useRef<(Point & { time: number }) | null>(null)
  const closeOnClick = useRef(false)

  // Clamped on the way out, so a resized window or a turned picture can't leave it off in the dark.
  const shown = content && stage ? clampView(view, content, stage) : FIT_VIEW

  const fromMiddle = (e: { clientX: number; clientY: number }): Point => {
    const box = stageRef.current?.getBoundingClientRect()
    return box ? { x: e.clientX - box.left - box.width / 2, y: e.clientY - box.top - box.height / 2 } : { x: 0, y: 0 }
  }

  const pair = (): [Point, Point] => {
    const [a, b] = [...pointers.current.values()]
    return [a, b]
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    if (!enabled || (e.pointerType === 'mouse' && e.button !== 0)) return
    closeOnClick.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
    const at = fromMiddle(e)
    pointers.current.set(e.pointerId, at)
    setGesturing(true)
    if (pointers.current.size === 1) {
      gesture.current = { kind: 'one', start: shown, at, startedAt: performance.now(), moved: false }
    } else if (pointers.current.size === 2) {
      const [a, b] = pair()
      setSwipeX(0)
      gesture.current = { kind: 'pinch', start: shown, at: middle(a, b), spread: distance(a, b) || 1 }
    }
  }

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    if (!pointers.current.has(e.pointerId)) return
    const at = fromMiddle(e)
    pointers.current.set(e.pointerId, at)
    const g = gesture.current
    if (g?.kind === 'pinch' && pointers.current.size >= 2) {
      const [a, b] = pair()
      setView(pinchView(g.start, g.at, distance(a, b) / g.spread, middle(a, b)))
    } else if (g?.kind === 'one') {
      const dx = at.x - g.at.x
      const dy = at.y - g.at.y
      if (!g.moved && Math.hypot(dx, dy) < TAP_SLOP) return
      g.moved = true
      if (g.start.scale > 1) setView({ ...g.start, x: g.start.x + dx, y: g.start.y + dy })
      else setSwipeX(dx)
    }
  }

  const tapped = (at: Point, pointerType: string) => {
    if (!content || !isOnContent(shown, content, at)) {
      // Closed on the click that follows, not here: gone already, that click would land on whatever is underneath.
      closeOnClick.current = true
    } else if (pointerType === 'mouse') {
      setView(toggleZoom(shown, at))
    } else {
      const last = lastTap.current
      const now = performance.now()
      if (last && now - last.time < DOUBLE_TAP_MS && distance(last, at) < DOUBLE_TAP_REACH) {
        lastTap.current = null
        setView(toggleZoom(shown, at))
      } else {
        lastTap.current = { ...at, time: now }
      }
    }
  }

  const finish = (e: ReactPointerEvent<HTMLElement>, cancelled: boolean) => {
    if (!pointers.current.delete(e.pointerId)) return
    const g = gesture.current
    if (pointers.current.size === 1) {
      // A pinch lifted one finger: the other carries on as a pan, never a tap.
      const [rest] = pointers.current.values()
      gesture.current = { kind: 'one', start: shown, at: rest, startedAt: performance.now(), moved: true }
      return
    }
    if (pointers.current.size > 1) return
    gesture.current = null
    setGesturing(false)
    setSwipeX(0)
    if (cancelled || g?.kind !== 'one') return
    const at = fromMiddle(e)
    if (!g.moved) {
      tapped(at, e.pointerType)
    } else if (g.start.scale === 1) {
      const dx = at.x - g.at.x
      const speed = Math.abs(dx) / Math.max(1, performance.now() - g.startedAt)
      const sideways = Math.abs(dx) > Math.abs(at.y - g.at.y)
      if (sideways && (Math.abs(dx) > SWIPE_DISTANCE || (Math.abs(dx) > FLICK_MIN && speed > FLICK_SPEED))) onSwipe(dx < 0 ? 1 : -1)
    }
  }

  // The wheel has to be a real listener: React's is passive and can't stop the page scrolling.
  const latest = useRef({ enabled, shown, fromMiddle })
  useEffect(() => {
    latest.current = { enabled, shown, fromMiddle }
  })
  useEffect(() => {
    const el = stageRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      const now = latest.current
      if (!now.enabled) return
      e.preventDefault()
      // A trackpad pinch arrives as a ctrl-wheel with much smaller steps.
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.002))
      setView(zoomAt(now.shown, now.shown.scale * factor, now.fromMiddle(e)))
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [stageRef])

  return {
    view: shown,
    swipeX: shown.scale > 1 ? 0 : swipeX,
    gesturing,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp: (e: ReactPointerEvent<HTMLElement>) => finish(e, false),
      onPointerCancel: (e: ReactPointerEvent<HTMLElement>) => finish(e, true),
      onClick: () => {
        if (!closeOnClick.current) return
        closeOnClick.current = false
        onTapOutside()
      },
    },
    zoomBy: (factor: number) => setView(zoomAt(shown, shown.scale * factor, { x: 0, y: 0 })),
  }
}
