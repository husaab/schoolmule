// src/components/AuthGuard.tsx
'use client'
import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'

const PUBLIC_PATHS = ['/welcome', '/login', '/signup', '/about', '/product', '/contact', '/demo', '/forgot-password', '/reset-password']

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router   = useRouter()
  const path     = usePathname()
  const user        = useUserStore(s => s.user)
  const hasHydrated = useUserStore(s => s.hasHydrated)

  useEffect(() => {
    if (!hasHydrated) return

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
    }
    // logged in on a public page → dashboard


  }, [hasHydrated, user.id,  user.isVerifiedEmail, path, router])

  // don’t render anything while we’re redirecting
    if (!hasHydrated) {
    return null
  }

  return <>{children}</>
}
