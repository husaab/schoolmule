// src/components/gradebook/LegacyGradebookRedirect.tsx
// The gradebook moved into each class (Grades tab). Every old /gradebook URL
// (bookmarks, emails, "open in gradebook" links) renders this and is replaced
// by where it lives now (legacyGradebookRedirect).
'use client'

import { useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { legacyGradebookRedirect } from '@/lib/classroomRoutes'

export default function LegacyGradebookRedirect() {
  const router = useRouter()
  const pathname = usePathname()
  useEffect(() => {
    router.replace(legacyGradebookRedirect(pathname, window.location.search))
  }, [pathname, router])
  return <main className="lg:ml-72 pt-20 min-h-screen bg-slate-50" />
}
