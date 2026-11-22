// src/components/tours/HelpMenu.tsx
// The ? button in the top bar: every tour for this person (start, resume,
// replay) plus Help & Support and Contact. The welcome tour's last step
// points here (data-tour="help.tours"). Hidden in a "View as" preview.
'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { QuestionMarkCircleIcon } from '@heroicons/react/24/outline'
import { CheckIcon, PlayIcon } from '@heroicons/react/24/solid'
import { allTours, isOfferable, listForMenu, type MenuEntry } from '@/lib/tours'
import { useTourStore } from '@/store/useTourStore'
import { useUserStore } from '@/store/useUserStore'
import { tourTone } from './tourTone'
import { useTourCtx } from './useTourCtx'

const statusLabel = (m: MenuEntry) =>
  m.status === 'done' ? 'Done' : m.status === 'in_progress' ? `Step ${m.stepIndex + 1} of ${m.stepCount}` : 'New'

export default function HelpMenu({ supportLinks = true }: { supportLinks?: boolean }) {
  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const ctx = useTourCtx()
  const progress = useTourStore((s) => s.progress)
  const dispatch = useTourStore((s) => s.dispatch)
  const role = useUserStore((s) => s.user.role)
  const tone = tourTone(role)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // Handled: a running tour doesn't also pause on this Escape.
      e.preventDefault()
      setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  if (ctx.impersonating) return null
  const entries = listForMenu(ctx, progress, allTours())
  // A dot only for a tour they haven't seen yet (a paused one has its own Resume pill).
  const waiting = entries.some((m) => m.status === 'new' && isOfferable(m.def, ctx, progress[m.def.id]))

  const start = (m: MenuEntry) => {
    setOpen(false)
    dispatch({ t: 'START', tourId: m.def.id, from: m.status === 'in_progress' ? m.stepIndex : 0 })
  }

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        data-tour="help.tours"
        onClick={() => setOpen((v) => !v)}
        aria-label="Help and tours"
        aria-expanded={open}
        title="Help and tours"
        className="relative cursor-pointer rounded-xl p-2.5 text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
      >
        <QuestionMarkCircleIcon className="h-6 w-6" />
        {waiting && <span className={`absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-white ${tone.dot}`} />}
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-[57] mt-2 w-[min(340px,calc(100vw-24px))] rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          <p className="px-2 pb-1.5 pt-1 text-[11px] font-medium uppercase tracking-wide text-slate-500">Tours</p>
          {entries.length === 0 ? (
            <p className="px-2 pb-2 text-sm text-slate-500">No tours for you yet.</p>
          ) : (
            entries.map((m) => (
              <button
                key={m.def.id}
                type="button"
                role="menuitem"
                onClick={() => start(m)}
                className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-slate-50"
              >
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${m.status === 'done' ? 'bg-emerald-50 text-emerald-700' : `${tone.soft} ${tone.softText}`}`}>
                  {m.status === 'done' ? <CheckIcon className="h-4 w-4" /> : <PlayIcon className="h-3.5 w-3.5" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{m.def.offer.title}</span>
                  <span className="block text-xs text-slate-500">
                    {m.status === 'done' ? 'Replay' : m.status === 'in_progress' ? 'Resume' : 'Start'} · {m.stepCount} steps
                  </span>
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                    m.status === 'done' ? 'bg-emerald-50 text-emerald-700' : m.status === 'in_progress' ? `${tone.soft} ${tone.softText}` : `${tone.primary}`
                  }`}
                >
                  {statusLabel(m)}
                </span>
              </button>
            ))
          )}
          {supportLinks && (
            <div className="mt-1 flex gap-4 border-t border-slate-100 px-2 pb-1 pt-2 text-[13px]">
              <Link href="/support" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-900">
                Help &amp; Support
              </Link>
              <Link href="/contact-us" onClick={() => setOpen(false)} className="text-slate-600 hover:text-slate-900">
                Contact
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
