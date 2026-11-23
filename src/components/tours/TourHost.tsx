// src/components/tours/TourHost.tsx
// The web's guided-tour host, mounted once in UserShell (inside AuthGuard).
// It loads the person's progress, offers at most one tour (never over What's
// New, never in a "View as" preview), and carries out the shared state
// machine's effects: navigate, open the phone sidebar or a dialog, find and
// track the target, click it for "Do it for me". It also notices the real
// click or typing a "Your turn" step waits for, and handles the keyboard
// (Esc pauses, ← → move).
'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { usePathname, useRouter } from 'next/navigation'
import { allTours, defineTour, pickOffer, runnable, type Step, type TourState } from '@/lib/tours'
import { useImpersonationStore } from '@/store/useImpersonationStore'
import { useSidebarStore } from '@/store/useSidebarStore'
import { TOUR_PLATFORM, useTourStore } from '@/store/useTourStore'
import { useUserStore } from '@/store/useUserStore'
import Callout from './Callout'
import { ensureVisible, findTarget, focusField, isTypingIn, pressable, typedLength } from './findTarget'
import Spotlight, { spotRect, type SpotRect } from './Spotlight'
import { DoneCard, OfferCard, PausedPill } from './TourCards'
import { samePath, tourPath } from './tourRoutes'
import { tourTone } from './tourTone'
import { useTourCtx } from './useTourCtx'

const OFFER_DELAY_MS = 900
const SIDEBAR_SLIDE_MS = 320
const GLIDE_MS = 450
/** How long a dialog step waits for its opener to appear on a page still loading. */
const SURFACE_WAIT_MS = 3000
/** Below this the sidebar is a drawer (Tailwind lg). */
const DRAWER_PX = 1024

const stepOf = (s: TourState): Step | null =>
  s.phase === 'running' ? runnable(s.tourId, TOUR_PLATFORM)?.steps[s.i] ?? null : null

export default function TourHost() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useUserStore((s) => s.user)
  const hasHydrated = useUserStore((s) => s.hasHydrated)
  const previewing = useImpersonationStore((s) => Boolean(s.session))
  const state = useTourStore((s) => s.state)
  const loaded = useTourStore((s) => s.loaded)
  const progress = useTourStore((s) => s.progress)
  const dispatch = useTourStore((s) => s.dispatch)
  const ctx = useTourCtx()
  const [mounted, setMounted] = useState(false)
  // Where the current target is, and which step measured it: the highlight may
  // glide from the last step's spot, but the bubble waits for its own target.
  const [spot, setSpot] = useState<{ key: string; rect: SpotRect | null }>({ key: '', rect: null })
  const [glide, setGlide] = useState(false)
  const [nudge, setNudge] = useState(0)
  const openedNav = useRef(false)
  const pendingPath = useRef<string | null>(null)
  // Where a just-clicked link is taking the page. Next updates the URL only
  // when the new page is ready, so right after a "Your turn" click the
  // pathname still names the old page.
  const headingTo = useRef<string | null>(null)
  const pathRef = useRef(pathname)
  pathRef.current = pathname

  const signedIn = Boolean(hasHydrated && user.id && user.isVerifiedEmail && user.isVerifiedSchool)
  const active = signedIn && !previewing

  useEffect(() => setMounted(true), [])

  // Development only: try a tour you're writing from the browser console,
  // e.g. __schoolmuleTours.define({...}); __schoolmuleTours.start('my-tour').
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const w = window as unknown as { __schoolmuleTours?: unknown }
    w.__schoolmuleTours = {
      define: defineTour,
      start: (tourId: string, from = 0) => useTourStore.getState().dispatch({ t: 'START', tourId, from }),
      state: () => useTourStore.getState().state,
    }
    return () => {
      delete w.__schoolmuleTours
    }
  }, [])

  // Progress belongs to one person: start clean for each, and never in a preview.
  useEffect(() => {
    const store = useTourStore.getState()
    store.reset()
    if (active) store.load()
  }, [active, user.id])

  // A click on an in-app link: remember where it is going (see headingTo).
  const noteLink = useCallback((el: Element) => {
    const a = el.closest('a[href]') as HTMLAnchorElement | null
    if (!a || a.target === '_blank') return
    const url = new URL(a.href, window.location.href)
    if (url.origin === window.location.origin && !samePath(url.pathname, pathRef.current)) headingTo.current = url.pathname
  }, [])

  // Carry out the machine's effects.
  useEffect(() => {
    const arrive = () => useTourStore.getState().dispatch({ t: 'ARRIVED' })
    const currentTarget = () => stepOf(useTourStore.getState().state)?.target ?? null
    useTourStore.getState().setRunner((effect) => {
      switch (effect.e) {
        case 'navigate': {
          const path = tourPath(effect.route, useUserStore.getState().user.role)
          if (samePath(headingTo.current ?? pathRef.current, path)) arrive()
          else {
            pendingPath.current = path
            router.push(path)
          }
          break
        }
        case 'openNav': {
          if (findTarget(currentTarget()) || window.innerWidth >= DRAWER_PX) {
            arrive()
            break
          }
          if (!useSidebarStore.getState().isOpen) {
            useSidebarStore.getState().openSidebar()
            openedNav.current = true
          }
          window.setTimeout(arrive, SIDEBAR_SLIDE_MS)
          break
        }
        case 'closeNav':
          if (openedNav.current) {
            openedNav.current = false
            useSidebarStore.getState().closeSidebar()
          }
          break
        case 'openSurface': {
          // Already open (the last step's click opened it): don't toggle it
          // shut. Otherwise wait for the page to show the opener (it may still
          // be loading), then press it.
          const started = Date.now()
          const tryOpen = () => {
            if (findTarget(currentTarget())) return arrive()
            const opener = findTarget(effect.opener)
            if (opener) {
              opener.click()
              return arrive()
            }
            if (Date.now() - started < SURFACE_WAIT_MS) window.setTimeout(tryOpen, 150)
            else arrive()
          }
          tryOpen()
          break
        }
        case 'resolve':
          // The tracking loop below looks for the target every frame.
          break
        case 'doIt': {
          const el = findTarget(effect.target)
          if (!el) break
          if (effect.kind === 'click') {
            const press = pressable(el)
            noteLink(press)
            press.click()
          } else focusField(el)
          break
        }
      }
    })
    return () => useTourStore.getState().setRunner(null)
  }, [router, noteLink])

  // Arrived on the page a step navigated to.
  useEffect(() => {
    if (headingTo.current && samePath(pathname, headingTo.current)) headingTo.current = null
    if (pendingPath.current && samePath(pathname, pendingPath.current)) {
      pendingPath.current = null
      dispatch({ t: 'ARRIVED' })
    }
  }, [pathname, dispatch])

  // Offer at most one tour, a moment after the page settles.
  const { here, blocked, conditions } = ctx
  useEffect(() => {
    if (!active || !loaded || state.phase !== 'idle') return
    const def = pickOffer(ctx, progress, allTours(), false)
    if (!def) return
    const timer = window.setTimeout(() => {
      if (useTourStore.getState().state.phase === 'idle') dispatch({ t: 'OFFER', tourId: def.id })
    }, OFFER_DELAY_MS)
    return () => window.clearTimeout(timer)
    // ctx is rebuilt each render; these are the parts that matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, loaded, state.phase, here, blocked, conditions, progress, user.role, ctx.userCreatedAt, dispatch])

  // A preview or sign-out mid-tour: drop it.
  useEffect(() => {
    if (!active && useTourStore.getState().state.phase !== 'idle') dispatch({ t: 'STOP' })
  }, [active, dispatch])

  // Nothing running (finished, stopped, reset for another person): forget
  // where a step was heading, and close the drawer only if the tour opened it.
  useEffect(() => {
    if (state.phase !== 'idle') return
    pendingPath.current = null
    headingTo.current = null
    if (openedNav.current) {
      openedNav.current = false
      useSidebarStore.getState().closeSidebar()
    }
  }, [state.phase])

  // Track the target every frame while a step runs: it can move, scroll or
  // appear late (a dialog animating in, data loading).
  const running = state.phase === 'running'
  const stepKey = running ? `${state.tourId}:${state.i}` : ''
  useEffect(() => {
    if (!running) {
      setSpot({ key: '', rect: null })
      return
    }
    let frame = 0
    let lastKey = ''
    let scrolledFor = ''
    const tick = () => {
      const s = useTourStore.getState().state
      if (s.phase !== 'running') return
      const step = stepOf(s)
      const key = `${s.tourId}:${s.i}`
      if (!step?.target) {
        if (lastKey !== `none:${key}`) {
          lastKey = `none:${key}`
          setSpot({ key, rect: null })
        }
      } else if (s.sub === 'waiting' || s.sub === 'ready' || s.sub === 'missing') {
        const el = findTarget(step.target)
        if (el) {
          if (scrolledFor !== key) {
            scrolledFor = key
            ensureVisible(el)
          }
          if (s.sub !== 'ready') useTourStore.getState().dispatch({ t: 'PLACED', ok: true })
          const r = el.getBoundingClientRect()
          const k = [key, ...[r.left, r.top, r.width, r.height, window.innerWidth, window.innerHeight].map(Math.round)].join(',')
          if (k !== lastKey) {
            lastKey = k
            setSpot({ key, rect: spotRect(r) })
          }
        } else if (s.sub === 'ready') {
          useTourStore.getState().dispatch({ t: 'PLACED', ok: false })
        }
      }
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running])

  // Glide the highlight and bubble to each new step, then follow scrolling exactly.
  useEffect(() => {
    if (!stepKey) return
    setGlide(true)
    const t = window.setTimeout(() => setGlide(false), GLIDE_MS)
    return () => window.clearTimeout(t)
  }, [stepKey])

  // Time passing: a target that never shows becomes "missing".
  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => useTourStore.getState().dispatch({ t: 'TICK' }), 250)
    return () => window.clearInterval(id)
  }, [running])

  // The real click or typing a "Your turn" step waits for. Capture phase, and
  // nothing is prevented: the button does what it always does.
  useEffect(() => {
    if (!running) return
    const later = (s: Extract<TourState, { phase: 'running' }>) =>
      window.setTimeout(() => {
        const now = useTourStore.getState().state
        if (now.phase === 'running' && now.tourId === s.tourId && now.i === s.i) useTourStore.getState().dispatch({ t: 'ACTION_DONE' })
      }, 0)
    const onClick = (e: MouseEvent) => {
      if (!e.isTrusted) return
      if (e.target instanceof Element) noteLink(e.target)
      const s = useTourStore.getState().state
      const step = stepOf(s)
      if (s.phase !== 'running' || step?.kind !== 'click') return
      const el = findTarget(step.target)
      if (el && el.contains(e.target as Node)) later(s)
    }
    const onInput = (e: Event) => {
      const s = useTourStore.getState().state
      const step = stepOf(s)
      if (s.phase !== 'running' || step?.kind !== 'type' || s.typed) return
      const el = findTarget(step.target)
      if (el && el.contains(e.target as Node) && typedLength(e.target) >= (step.typeMin ?? 3)) later(s)
    }
    document.addEventListener('click', onClick, true)
    document.addEventListener('input', onInput, true)
    return () => {
      document.removeEventListener('click', onClick, true)
      document.removeEventListener('input', onInput, true)
    }
  }, [running, noteLink])

  // Keyboard. On window, after the page's own handlers: an open dialog that
  // closes on Escape (shared Modal) prevents the default, and wins.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return
      const s = useTourStore.getState().state
      const go = useTourStore.getState().dispatch
      if (e.key === 'Escape') {
        if (s.phase === 'offer') go({ t: 'LATER' })
        else if (s.phase === 'done') go({ t: 'CLOSE' })
        else if (s.phase === 'running') go({ t: 'PAUSE' })
        else return
        e.preventDefault()
        return
      }
      if (s.phase !== 'running' || isTypingIn(e.target)) return
      if (e.key === 'ArrowRight') go({ t: 'NEXT' })
      else if (e.key === 'ArrowLeft') go({ t: 'BACK' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const stray = useCallback(() => setNudge((n) => n + 1), [])

  if (!mounted || !active || state.phase === 'idle') return null
  const rt = runnable(state.tourId, TOUR_PLATFORM)
  if (!rt) return null
  const tone = tourTone(user.role)

  let body: React.ReactNode = null
  if (state.phase === 'offer') {
    body = (
      <OfferCard
        def={rt.def}
        stepCount={rt.steps.length}
        tone={tone}
        onStart={() => dispatch({ t: 'ACCEPT' })}
        onLater={() => dispatch({ t: 'LATER' })}
        onNever={() => dispatch({ t: 'NEVER' })}
      />
    )
  } else if (state.phase === 'done') {
    body = (
      <DoneCard
        def={rt.def}
        tone={tone}
        onReplay={() => dispatch({ t: 'START', tourId: rt.def.id })}
        onClose={() => dispatch({ t: 'CLOSE' })}
      />
    )
  } else if (state.phase === 'paused') {
    body = (
      <PausedPill
        def={rt.def}
        index={state.i}
        count={rt.steps.length}
        tone={tone}
        onResume={() => dispatch({ t: 'RESUME' })}
        onDrop={() => dispatch({ t: 'STOP' })}
      />
    )
  } else {
    const step = rt.steps[state.i]
    const placing = state.sub === 'navigating' || state.sub === 'opening'
    // While a step finds its place the page stays dimmed (the highlight may
    // still sit on the last step's spot); the bubble waits for its own target.
    const mine = spot.key === stepKey ? spot.rect : null
    const missing = state.sub === 'missing'
    const highlight = step.target && !missing ? spot.rect : null
    const showBubble = !placing && (!step.target || missing || mine !== null)
    body = (
      <>
        <Spotlight rect={highlight} open={(step.kind === 'click' || step.kind === 'type') && state.sub === 'ready'} ring={tone.ring} glide={glide} onStray={stray} />
        {showBubble && (
          <Callout
            step={step}
            index={state.i}
            count={rt.steps.length}
            sub={state.sub}
            typed={state.typed}
            rect={missing ? null : mine}
            tone={tone}
            nudge={nudge}
            glide={glide}
            onNext={() => dispatch({ t: 'NEXT' })}
            onBack={() => dispatch({ t: 'BACK' })}
            onDoIt={() => dispatch({ t: 'DO_IT' })}
            onSkip={() => dispatch({ t: 'SKIP_MISSING' })}
            onPause={() => dispatch({ t: 'PAUSE' })}
          />
        )}
      </>
    )
  }

  return createPortal(<div data-tour-layer="">{body}</div>, document.body)
}
