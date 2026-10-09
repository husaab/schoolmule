// src/components/AuthGuard.tsx
'use client'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { validateSession, getToken } from '@/services/authService'
import { applySession, refreshAccessFlags, signOutLocally } from '@/services/sessionSync'
import { reportClientEvent, flushClientEvents } from '@/services/clientErrors'
import { getUnreadPatchNotes } from '@/services/patchNoteService'
import { usePatchNotesStore } from '@/store/usePatchNotesStore'
import { useImpersonationStore } from '@/store/useImpersonationStore'
import { resolveRedirect, landingFor, createLoopDetector } from '@/lib/authRouting'
import PatchNotesModal from '@/components/patchNotes/PatchNotesModal'

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router   = useRouter()
  const path     = usePathname()
  const user        = useUserStore(s => s.user)
  const hasHydrated = useUserStore(s => s.hasHydrated)
  const clearUser = useUserStore(s => s.clearUser)
  const [showPatchNotes, setShowPatchNotes] = useState(false)
  const patchNotesChecked = useRef(false)
  // One background refresh per mount: a persisted user is otherwise never
  // re-read, so flags changed elsewhere (verified on another device, approved,
  // role changed) would stay stale until the next sign-in.
  const refreshed = useRef(false)
  const loopDetector = useRef(createLoopDetector())
  // The redirect last issued. Store updates re-run the routing effect before
  // the navigation lands; re-issuing the same hop must not count as a loop.
  const lastHop = useRef<string | null>(null)
  const [loopTrail, setLoopTrail] = useState<string | null>(null)
  const setUnread = usePatchNotesStore((s) => s.setUnread)
  const unreadNotes = usePatchNotesStore((s) => s.unreadNotes)
  // During an admin "view as" preview, "What's new" belongs to the previewed
  // user and dismissing it would be a (refused) write, so leave it alone.
  const previewing = useImpersonationStore((s) => Boolean(s.session))

  // Session: fill in or refresh the user from the server.
  useEffect(() => {
    if (!hasHydrated) return

    const token = getToken()

    // If there's no token but user data exists, clear user data
    if (!token && user.id) {
      clearUser()
      return
    }
    if (!token) return

    // If there's a token but no user data, validate the session once on app startup
    if (!user.id) {
      validateSession()
        .then(async response => {
          if (!response.success || !response.data) return
          if (!(await applySession(response.data, token))) return

          // Check for unread patch notes
          try {
            if (previewing) return
            const patchRes = await getUnreadPatchNotes()
            if (patchRes.data.hasUnread) {
              setUnread(true, patchRes.data.notes)
              setShowPatchNotes(true)
            }
          } catch {
            // Silently fail — patch notes are non-critical
          }
        })
        .catch(() => {
          // Let apiClient handle token expiry - this catch is just to prevent unhandled promise rejection
        })
      return
    }

    if (!refreshed.current && !previewing) {
      refreshed.current = true
      validateSession()
        .then((response) => {
          if (response.success && response.data) refreshAccessFlags(response.data, token)
        })
        .catch(() => {
          // An owner flag that couldn't be confirmed is a "no", not a pass.
          const current = useUserStore.getState().user
          if (current.id === user.id && current.isPlatformOwner === undefined) {
            useUserStore.getState().setUser({ ...current, isPlatformOwner: false })
          }
        })
    }
  }, [hasHydrated, user.id, clearUser, setUnread, previewing])

  // Check for unread patch notes when user is already logged in (once per session)
  useEffect(() => {
    if (!hasHydrated || !getToken() || !user.id || !user.isVerifiedEmail || !user.isVerifiedSchool) return
    if (patchNotesChecked.current || previewing) return
    patchNotesChecked.current = true
    getUnreadPatchNotes()
      .then((patchRes) => {
        if (patchRes.data.hasUnread) {
          setUnread(true, patchRes.data.notes)
          setShowPatchNotes(true)
        }
      })
      .catch(() => {})
  }, [hasHydrated, user.id, user.isVerifiedEmail, user.isVerifiedSchool, previewing, setUnread])

  // Routing: every rule lives in lib/authRouting, which is tested so that no
  // redirect can lead to another. The loop detector is the backstop for a
  // rule added without a test: stop, report, and offer a way out.
  useEffect(() => {
    if (!hasHydrated || loopTrail) return

    const state = { hasToken: Boolean(getToken()), user }
    let target = resolveRedirect(path, state)
    if (!target) {
      lastHop.current = null
      return
    }

    // Leaving /login after sign-in: honour ?next= exactly as the login form
    // does, so the two navigations agree.
    if (path === '/login' && state.hasToken && user.id) {
      target = landingFor(user, new URLSearchParams(window.location.search).get('next'))
    }

    const hop = `${path} -> ${target}`
    if (hop === lastHop.current) return
    lastHop.current = hop

    if (loopDetector.current.record(path, target)) {
      const trail = loopDetector.current.trail()
      setLoopTrail(trail)
      reportClientEvent({
        kind: 'redirect_loop',
        message: `Redirect loop (role=${user.role} email=${user.isVerifiedEmail} school=${user.isVerifiedSchool}): ${trail}`,
      })
      flushClientEvents()
      return
    }
    router.replace(target)
  }, [hasHydrated, user, path, router, loopTrail])

  // don’t render anything while we’re redirecting
    if (!hasHydrated) {
    return null
  }

  if (loopTrail) return <RedirectLoopNotice />

  // The Observe console has its own chrome; product announcements belong
  // to the app, not the owner's ops view.
  const onObserve = path.startsWith('/observe')

  return (
    <>
      {children}
      <PatchNotesModal
        isOpen={showPatchNotes && !onObserve}
        onClose={() => setShowPatchNotes(false)}
        notes={unreadNotes}
      />
    </>
  )
}

// Shown instead of reloading forever when the redirect rules disagree. The
// loop has already been reported; signing out clears whatever state caused it.
function RedirectLoopNotice() {
  const signOut = () => {
    signOutLocally()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Something went wrong</h1>
        <p className="text-sm text-slate-600 mb-6">
          We couldn&apos;t open this page. Our team has been notified. Signing out and back in usually fixes it.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={signOut}
            className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 to-teal-600 text-white font-semibold rounded-xl hover:from-cyan-700 hover:to-teal-700 transition-all cursor-pointer"
          >
            Sign out
          </button>
          <button
            onClick={() => window.location.reload()}
            className="text-cyan-600 hover:text-cyan-700 font-semibold text-sm cursor-pointer"
          >
            Try again
          </button>
        </div>
      </div>
    </div>
  )
}
