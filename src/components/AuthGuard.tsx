// src/components/AuthGuard.tsx
'use client'
import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { validateSession } from '@/services/authService'

const PUBLIC_PATHS = ['/welcome', '/login', '/signup', '/about', '/product', '/contact', '/demo', '/forgot-password', '/reset-password']
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

    // Validate session if user appears to be logged in
    if (user.id) {
      validateSession()
        .then(response => {
          if (!response.success) {
            // Session is invalid, clear user state
            clearUser()
            if (!PUBLIC_PATHS.includes(path)) {
              router.replace('/welcome')
            }
          }
        })
        .catch(() => {
          // Session validation failed, clear user state
          clearUser()
          if (!PUBLIC_PATHS.includes(path)) {
            router.replace('/welcome')
          }
        })
    }

    // not logged in → /welcome
    if (!user.id && !PUBLIC_PATHS.includes(path)) {
      router.replace('/welcome')
    }
    console.log("Zustand user:", useUserStore.getState().user)
    if(user.id){
      if (PUBLIC_PATHS.includes(path)) {
        router.replace('/dashboard')
      }

      else if(user.id && !user.isVerifiedEmail && path !== '/verify-email' && path !== '/verify-email-token'){
        router.replace('/verify-email');
      }

      else if (
        user.id &&
        user.role != "ADMIN" &&
        user.isVerifiedEmail &&
        !user.isVerifiedSchool &&
        path !== '/school-approval'
      ) {
        router.replace('/school-approval');
      }

      else if (
        user.id && path.startsWith('/admin-panel') && user.role != "ADMIN"
      ) {
        router.replace('/dashboard')
      }

      else if (user.id && user.role == 'PARENT' && !isParentPath(path)){
        router.replace("/parent/dashboard")
      }
    }
    // logged in on a public page → dashboard


  }, [hasHydrated, user.id,  user.isVerifiedEmail, path, router, user.role, user.isVerifiedSchool, clearUser])

  // don’t render anything while we’re redirecting
    if (!hasHydrated) {
    return null
  }

  return <>{children}</>
}
