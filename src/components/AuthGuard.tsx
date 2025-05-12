// src/components/AuthGuard.tsx
'use client'
import { ReactNode, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'

const PUBLIC_PATHS = ['/welcome', '/login', '/signup', '/about', '/product', '/contact']

export default function AuthGuard({ children }: { children: ReactNode }) {
  const router   = useRouter()
  const path     = usePathname()
  const user     = useUserStore(s => s.user)

  useEffect(() => {
    // if not logged in and NOT on a public page → redirect to /welcome
    if (!user.id && !PUBLIC_PATHS.includes(path)) {
      router.replace('/welcome')
    }
    // if logged in and on a public page → redirect to your dashboard
    else if (user.id && PUBLIC_PATHS.includes(path)) {
      router.replace('/dashboard')
    }
  }, [user.id, path, router])

  // don’t render anything while we’re redirecting
  if ((!user.id && !PUBLIC_PATHS.includes(path)) ||
      (user.id  &&  PUBLIC_PATHS.includes(path))) {
    return null
  }

  return <>{children}</>
}
