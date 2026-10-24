'use client'
// The client-side half of lib/websiteVisit: a signed-in user who navigates
// onto a website page inside the app (the logo, the footer, "Go home") goes
// to their home page, unless they opened the website on purpose (?website,
// or earlier in this tab). A fresh page load never gets here with a redirect
// to make: WEBSITE_REDIRECT_SCRIPT already handled it before paint.
import { useEffect } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useUserStore } from '@/store/useUserStore'
import { getToken } from '@/services/authService'
import {
  VIEW_WEBSITE_PARAM,
  isVisitingWebsite,
  scriptIsRedirecting,
  startWebsiteVisit,
  websiteRedirect,
} from '@/lib/websiteVisit'

export default function WebsiteRedirect() {
  const router = useRouter()
  const path = usePathname()
  const opened = useSearchParams().has(VIEW_WEBSITE_PARAM)
  const user = useUserStore((s) => s.user)
  const hasHydrated = useUserStore((s) => s.hasHydrated)

  useEffect(() => {
    if (!hasHydrated || scriptIsRedirecting()) return
    if (opened) startWebsiteVisit()
    const target = websiteRedirect(path, { hasToken: Boolean(getToken()), user }, opened || isVisitingWebsite())
    if (target) router.replace(target)
  }, [hasHydrated, path, opened, user, router])

  return null
}
