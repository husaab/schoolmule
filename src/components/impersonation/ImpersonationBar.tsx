'use client'

// The always-visible sign that an admin is previewing School Mule as someone
// else: a violet frame around the viewport plus a floating bar with who is
// being viewed and a one-click way out. Mounted once in the (user) layout so
// it shows on every page, whichever shell that page uses.

import { useEffect } from 'react'
import { EyeIcon, ArrowUturnLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline'
import { useImpersonationStore } from '@/store/useImpersonationStore'
import { useUserStore } from '@/store/useUserStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { endImpersonation, takeImpersonationFlash } from '@/services/impersonation'
import { roleLabel } from '@/components/adminUsers/userDisplay'

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?'

export default function ImpersonationBar() {
  const session = useImpersonationStore((s) => s.session)
  const hasHydrated = useImpersonationStore((s) => s.hasHydrated)
  const clearSession = useImpersonationStore((s) => s.clearSession)
  const currentUserId = useUserStore((s) => s.user.id)
  const userHydrated = useUserStore((s) => s.hasHydrated)
  const notify = useNotificationStore((s) => s.showNotification)

  // Say goodbye once, right after the reload that ended a preview.
  useEffect(() => {
    const flash = takeImpersonationFlash()
    if (flash) notify(flash, 'success')
  }, [notify])

  // Self-heal: if the signed-in user is not the previewed one (e.g. the admin
  // signed in again in another tab), the parked session is stale. Drop it.
  useEffect(() => {
    if (!hasHydrated || !userHydrated || !session || !currentUserId) return
    if (currentUserId !== session.target.userId) clearSession()
  }, [hasHydrated, userHydrated, session, currentUserId, clearSession])

  if (!hasHydrated || !session) return null
  if (currentUserId && currentUserId !== session.target.userId) return null

  const { target } = session

  return (
    <>
      {/* Viewport frame — never intercepts clicks */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[89] ring-[3px] ring-inset ring-violet-500/80 print:hidden"
      />

      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-1/2 z-[90] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 lg:left-[calc(50%+9rem)] print:hidden"
      >
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/95 px-3 py-2.5 text-white shadow-2xl shadow-violet-900/30 backdrop-blur-md sm:px-4">
          <span className="relative flex h-2.5 w-2.5 flex-shrink-0" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-violet-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-violet-400" />
          </span>

          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-500 text-[11px] font-semibold tracking-wide">
            {initialsOf(target.fullName)}
          </div>

          <div className="min-w-0 flex-1 leading-tight">
            <p className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wider text-violet-200">
              <EyeIcon className="h-3.5 w-3.5" />
              Viewing as
            </p>
            <p className="truncate text-sm font-semibold">
              {target.fullName}
              <span className="ml-1.5 font-normal text-slate-300">
                · {roleLabel(target.baseRole ?? target.role)}
                {target.baseRole && target.baseRole !== target.role && (
                  <span className="text-amber-200"> · parent view</span>
                )}
              </span>
            </p>
          </div>

          <span
            className="hidden items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-[11px] font-medium text-slate-200 sm:inline-flex"
            title="Saving, submitting and deleting are turned off while previewing"
          >
            <LockClosedIcon className="h-3 w-3" />
            Read-only
          </span>

          <button
            type="button"
            onClick={() => endImpersonation('manual')}
            className="inline-flex flex-shrink-0 cursor-pointer items-center gap-1.5 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-slate-900 transition-colors hover:bg-violet-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-300"
          >
            <ArrowUturnLeftIcon className="h-4 w-4" />
            Exit preview
          </button>
        </div>
      </div>
    </>
  )
}
