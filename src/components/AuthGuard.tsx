// src/components/AuthGuard.tsx
'use client'
import { ReactNode, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { validateSession, getToken } from '@/services/authService'
import { getUnreadPatchNotes } from '@/services/patchNoteService'
import { usePatchNotesStore } from '@/store/usePatchNotesStore'
import PatchNotesModal from '@/components/patchNotes/PatchNotesModal'

const PUBLIC_PATHS = ['/', '/login', '/signup', '/about', '/product', '/contact', '/demo', '/forgot-password', '/reset-password']
const PARENT_PATHS = ['/parent/dashboard', '/parent/feedback', '/parent/communication', '/settings', '/parent/report-cards']

// Check if path matches parent patterns (including dynamic routes)
const isParentPath = (path: string) => {
  return PARENT_PATHS.some(parentPath => path.startsWith(parentPath))
}

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router   = useRouter()
  const path     = usePathname()
  const user        = useUserStore(s => s.user)
  const hasHydrated = useUserStore(s => s.hasHydrated)
  const clearUser = useUserStore(s => s.clearUser)
  const [showPatchNotes, setShowPatchNotes] = useState(false)
  const [patchNotesChecked, setPatchNotesChecked] = useState(false)
  const setUnread = usePatchNotesStore((s) => s.setUnread)
  const unreadNotes = usePatchNotesStore((s) => s.unreadNotes)

  useEffect(() => {
    if (!hasHydrated) return

    const token = getToken()

    // If there's no token but user data exists, clear user data
    if (!token && user.id) {
      clearUser()
    }

    // If there's a token but no user data, validate the session only once on app startup
    if (token && !user.id && hasHydrated) {
      validateSession()
        .then(async response => {
          if (response.success && response.data) {
            // Update user store with data from token validation
            const userData = response.data
            useUserStore.getState().setUser({
              id: userData.userId,
              username: userData.username,
              email: userData.email,
              school: userData.school,
              role: userData.role,
              isVerifiedEmail: userData.isVerified,
              isVerifiedSchool: userData.isVerifiedSchool,
              activeTerm: userData.activeTerm || null
            })

            // Check for unread patch notes
            try {
              const patchRes = await getUnreadPatchNotes()
              if (patchRes.data.hasUnread) {
                setUnread(true, patchRes.data.notes)
                setShowPatchNotes(true)
              }
            } catch {
              // Silently fail — patch notes are non-critical
            }
          }
          // Note: Don't handle errors here - let apiClient handle 401s automatically
        })
        .catch(() => {
          // Let apiClient handle token expiry - this catch is just to prevent unhandled promise rejection
        })
    }

    // Check for unread patch notes when user is already logged in (once per session)
    if (token && user.id && user.isVerifiedEmail && user.isVerifiedSchool && !patchNotesChecked) {
      setPatchNotesChecked(true)
      getUnreadPatchNotes()
        .then((patchRes) => {
          if (patchRes.data.hasUnread) {
            setUnread(true, patchRes.data.notes)
            setShowPatchNotes(true)
          }
        })
        .catch(() => {})
    }

    // Handle routing logic
    if (!token && !PUBLIC_PATHS.includes(path)) {
      router.replace('/')
    }

    // Handle authenticated user routing
    if (token && user.id) {
      if (PUBLIC_PATHS.includes(path) || path === '/') {
        router.replace('/dashboard')
      } else if (!user.isVerifiedEmail && path !== '/verify-email' && path !== '/verify-email-token') {
        router.replace('/verify-email')
      } else if (
        user.role !== "ADMIN" &&
        user.isVerifiedEmail &&
        !user.isVerifiedSchool &&
        path !== '/school-approval'
      ) {
        router.replace('/school-approval')
      } else if ((path.startsWith('/admin-panel') || path.startsWith('/staff-attendance')) && user.role !== "ADMIN") {
        router.replace('/dashboard')
      } else if (user.role === 'PARENT' && !isParentPath(path)) {
        router.replace("/parent/dashboard")
      }
    }
  }, [hasHydrated, user.id, user.isVerifiedEmail, path, router, user.role, user.isVerifiedSchool, clearUser, setUnread])

  // don’t render anything while we’re redirecting
    if (!hasHydrated) {
    return null
  }

  return (
    <>
      {children}
      <PatchNotesModal
        isOpen={showPatchNotes}
        onClose={() => setShowPatchNotes(false)}
        notes={unreadNotes}
      />
    </>
  )
}
