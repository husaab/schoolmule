'use client'

// /email-login?next=<path>#<token> — a button in a parent's grades email
// (View in Parent Portal, "Speak to … about this") signs the parent in on one
// tap and opens `next`. The token rides in the fragment, so it never reaches a
// server log; it is read once and dropped from the address bar.
//
// It opens from any session (lib/emailLogin.emailLoginPlan): already that
// parent, it just goes on; another parent on a shared device is swapped for
// the link's parent; staff and students keep their own session. A link that
// no longer works goes to sign-in, which brings the parent back to `next`.

import { useEffect, useRef } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { emailLinkLogin, getToken } from '@/services/authService'
import { signOutLocally, startSession } from '@/services/sessionSync'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { landingFor, safeNextPath } from '@/lib/authRouting'
import { emailLoginPlan, emailLoginSubject, readEmailLoginToken } from '@/lib/emailLogin'
import { LOGIN_NOTICE_LINK_EXPIRED, LOGIN_NOTICE_PARAM } from '@/lib/loginNotice'

const EmailLoginPage = () => {
  const router = useRouter()
  const showNotification = useNotificationStore((s) => s.showNotification)
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    const token = readEmailLoginToken(window.location.hash)
    const next = safeNextPath(new URLSearchParams(window.location.search).get('next')) ?? '/parent/dashboard'
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)

    const current = useUserStore.getState().user
    const hasToken = Boolean(getToken())
    const toSignIn = `/login?next=${encodeURIComponent(next)}&${LOGIN_NOTICE_PARAM}=${LOGIN_NOTICE_LINK_EXPIRED}`
    if (!token) {
      router.replace(hasToken ? next : toSignIn)
      return
    }

    const plan = emailLoginPlan(
      { hasToken, userId: current.id || null, role: current.baseRole ?? current.role ?? null },
      emailLoginSubject(token),
    )
    if (plan === 'forward') {
      router.replace(next)
      return
    }

    emailLinkLogin(token)
      .then((res) => {
        if (hasToken) signOutLocally()
        const user = startSession(res.data)
        router.replace(landingFor(user, next))
      })
      .catch(() => {
        if (hasToken) {
          // Keep the session that is open here; the link only failed to sign anyone in.
          showNotification('That sign-in link has expired.', 'info')
          router.replace(next)
        } else {
          router.replace(toSignIn)
        }
      })
  }, [router, showNotification])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-[20px] border border-slate-200/70 bg-white p-6 text-center shadow-sm">
        <Image src="/logo/trimmedlogo.png" alt="SchoolMule" width={140} height={44} className="mx-auto mb-5 h-10 w-auto" priority />
        <p role="status" className="text-sm text-slate-500">Signing you in…</p>
      </div>
    </div>
  )
}

export default EmailLoginPage
