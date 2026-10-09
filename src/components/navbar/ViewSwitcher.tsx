'use client'

// The dual-role view switch for staff who are also parents. One component,
// two placements that share the same state and action:
//
//   variant="label"  the portal line under the school name in the navbar.
//                    Single-role users see the plain label they always did;
//                    dual-role users get a popover listing their views.
//   variant="card"   a one-line action under the user card in the sidebar
//                    footer, which is also the mobile drawer.
//
// Hidden during an admin "view as" preview: that session belongs to the
// previewed user and the violet bar owns the state.

import React, { useEffect, useRef, useState } from 'react'
import { CheckIcon, ChevronDownIcon, ArrowsRightLeftIcon } from '@heroicons/react/24/outline'
import { useUserStore } from '@/store/useUserStore'
import { useImpersonationStore } from '@/store/useImpersonationStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { switchView, takeViewSwitchFlash, isView } from '@/services/viewSwitch'
import { getStudentsByParentId } from '@/services/parentStudentService'
import { canSwitchViews, otherViewFor, viewLabelFor } from '@/lib/viewSwitch'
import { getGradeDisplayName } from '@/lib/schoolUtils'
import { isApiError } from '@/services/apiClient'

type ChildLite = { name: string; grade: string | number | null }

const isParentView = (view: string) => view === 'PARENT'

// The role colours the app already uses: cyan/teal for staff, amber for parents.
const dotClass = (view: string) =>
  isParentView(view) ? 'from-amber-400 to-orange-400' : 'from-cyan-500 to-teal-500'

const staffBlurb = (view: string) =>
  view === 'ADMIN' ? 'Everything, including the admin panel' : 'Classes, gradebook, attendance'

const childrenBlurb = (children: ChildLite[] | null) => {
  if (children === null) return 'Your linked children'
  if (children.length === 0) return 'No linked children this year'
  return children
    .map((c) => (c.grade != null ? `${c.name.split(' ')[0]} · ${getGradeDisplayName(c.grade)}` : c.name.split(' ')[0]))
    .join(', ')
}

const useSwitch = () => {
  const notify = useNotificationStore((s) => s.showNotification)
  const [busy, setBusy] = useState(false)
  const go = async (view: string) => {
    if (busy || !isView(view)) return
    setBusy(true)
    try {
      await switchView(view)
    } catch (err) {
      setBusy(false)
      notify(isApiError(err) ? err.message : "Couldn't switch view. Please try again.", 'error')
    }
  }
  return { busy, go }
}

const ViewSwitcher: React.FC<{ variant: 'label' | 'card' }> = ({ variant }) => {
  const user = useUserStore((s) => s.user)
  const previewing = useImpersonationStore((s) => Boolean(s.session))
  const notify = useNotificationStore((s) => s.showNotification)
  const dual = canSwitchViews(user) && !previewing

  // Say which view we landed in, once, right after the reload that completed
  // a switch. The navbar is on every page, so the label variant owns this.
  useEffect(() => {
    if (variant !== 'label') return
    const flash = takeViewSwitchFlash()
    if (flash) notify(flash, 'success')
  }, [variant, notify])

  if (variant === 'card') return dual ? <CardSwitch /> : null
  if (!dual) {
    return (
      <p className="text-xs text-slate-500">
        {user.role === 'ADMIN' ? 'Administrator' : user.role === 'PARENT' ? 'Parent Portal' : 'Teacher Portal'}
      </p>
    )
  }
  return <LabelSwitch />
}

// ─── navbar label + popover ──────────────────────────────────────────

const LabelSwitch: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const { busy, go } = useSwitch()
  const [open, setOpen] = useState(false)
  const [children, setChildren] = useState<ChildLite[] | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const role = user.role ?? ''
  const views = user.roles ?? []

  // Load the children once per open so the Parent row can name them.
  useEffect(() => {
    if (!open || children !== null || !user.id) return
    getStudentsByParentId(user.id)
      .then((res) =>
        setChildren(
          (res.data ?? []).map((link) => ({ name: link.student?.name || 'Student', grade: link.student?.grade ?? null })),
        ),
      )
      .catch(() => setChildren([]))
  }, [open, children, user.id])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const parent = isParentView(role)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Switch view"
        className={`group -ml-1.5 inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-1.5 py-0.5 text-xs font-medium transition-colors ${
          parent ? 'text-amber-700 hover:bg-amber-50' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
        }`}
      >
        <span className={`h-1.5 w-1.5 rounded-full bg-gradient-to-br ${dotClass(role)}`} aria-hidden />
        {viewLabelFor(role)}
        <ChevronDownIcon className={`h-3 w-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg"
        >
          <p className="border-b border-slate-100 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Viewing School Mule as
          </p>
          <div className="p-1.5">
            {views.map((view) => {
              const active = view === role
              const amber = isParentView(view)
              return (
                <button
                  key={view}
                  role="menuitemradio"
                  aria-checked={active}
                  type="button"
                  disabled={busy || active}
                  onClick={() => {
                    setOpen(false)
                    go(view)
                  }}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active
                      ? amber
                        ? 'bg-amber-50 text-amber-800'
                        : 'bg-cyan-50 text-cyan-800'
                      : 'cursor-pointer text-slate-700 hover:bg-slate-50 disabled:cursor-wait'
                  }`}
                >
                  <span
                    className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white ${dotClass(view)}`}
                    aria-hidden
                  >
                    <ArrowsRightLeftIcon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{viewLabelFor(view).replace(' view', '')}</span>
                    <span className="block truncate text-xs text-slate-500">
                      {amber ? childrenBlurb(children) : staffBlurb(view)}
                    </span>
                  </span>
                  {active && <CheckIcon className="h-4 w-4 flex-shrink-0" />}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── sidebar footer action ───────────────────────────────────────────

const CardSwitch: React.FC = () => {
  const user = useUserStore((s) => s.user)
  const { busy, go } = useSwitch()
  const target = otherViewFor(user)
  if (!target) return null
  const toParent = isParentView(target)
  return (
    <button
      type="button"
      onClick={() => go(target)}
      disabled={busy}
      className={`flex w-full cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-xs font-medium transition-colors disabled:cursor-wait disabled:opacity-60 ${
        toParent
          ? 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'
          : 'border-cyan-100 bg-cyan-50 text-cyan-800 hover:bg-cyan-100'
      }`}
    >
      <span className={`h-3 w-3 flex-shrink-0 rounded bg-gradient-to-br ${dotClass(target)}`} aria-hidden />
      {toParent ? 'Switch to Parent view' : `Back to ${viewLabelFor(target)}`}
      <ArrowsRightLeftIcon className="ml-auto h-3.5 w-3.5 opacity-70" />
    </button>
  )
}

export default ViewSwitcher
