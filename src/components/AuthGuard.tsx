// src/components/AuthGuard.tsx
'use client'
import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { validateSession, getToken } from '@/services/authService'

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
        .then(response => {
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
          }
          // Note: Don't handle errors here - let apiClient handle 401s automatically
        })
        .catch(() => {
          // Let apiClient handle token expiry - this catch is just to prevent unhandled promise rejection
        })
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
      } else if (path.startsWith('/admin-panel') && user.role !== "ADMIN") {
        router.replace('/dashboard')
      } else if (user.role === 'PARENT' && !isParentPath(path)) {
        router.replace("/parent/dashboard")
      }
    }
  }, [hasHydrated, user.id, user.isVerifiedEmail, path, router, user.role, user.isVerifiedSchool, clearUser])

  // don’t render anything while we’re redirecting
    if (!hasHydrated) {
    return null
  }

  return <>{children}</>
}
