// src/components/AuthGuard.tsx
'use client'
import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'

const PUBLIC_PATHS = ['/welcome', '/login', '/signup', '/about', '/product', '/contact']

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
    // logged in on a public page → dashboard
    else if (user.id && PUBLIC_PATHS.includes(path)) {
      router.replace('/dashboard')
    }
  }, [hasHydrated, user.id, path, router])

  // don’t render anything while we’re redirecting
    if (!hasHydrated) {
    return null
  }

  return <>{children}</>
}
