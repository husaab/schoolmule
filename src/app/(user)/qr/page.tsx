'use client'

// /qr?t=… — the link printed on a student's QR sign-in card. It works signed
// out and from any session: cards are scanned on shared classroom devices,
// so whoever is signed in here is signed out first, then the card's student
// is signed in and lands in the student portal.

import { Suspense, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExclamationCircleIcon } from '@heroicons/react/24/outline'
import { useFilterParams } from '@/hooks/useFilterParams'
import { getToken, studentQrSignIn } from '@/services/authService'
import { signOutLocally, startSession } from '@/services/sessionSync'
import { landingFor } from '@/lib/authRouting'
import { useUserStore } from '@/store/useUserStore'
import { studentTone } from '@/components/studentPortal/studentTone'

const MISSING_CODE = 'This link is missing its sign-in code. Scan your card again.'

function QrFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className={`flex min-h-screen items-center justify-center px-4 py-10 ${studentTone.page}`}>
      <div className="w-full max-w-sm rounded-[20px] border border-slate-200/70 bg-white p-8 text-center shadow-sm">
        <Image src="/logo/trimmedlogo.png" alt="SchoolMule" width={140} height={44} className="mx-auto mb-6 h-14 w-auto" priority />
        {children}
      </div>
    </div>
  )
}

function SigningIn() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-2">
      <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" aria-hidden="true" />
      <p className="text-base font-medium text-slate-700">Signing you in…</p>
    </div>
  )
}

function QrSignInContent() {
  const router = useRouter()
  // `t` is the card's secret: a moment, never a filter to remember.
  const { get } = useFilterParams({ transient: ['t'] })
  const cardToken = get('t')
  const [signInError, setSignInError] = useState<string | null>(null)
  const error = cardToken ? signInError : MISSING_CODE
  const started = useRef(false)

  useEffect(() => {
    if (started.current || !cardToken) return
    started.current = true

    // Someone else's session (a teacher on the classroom laptop, the last
    // student) must not survive a card scan.
    if (getToken() || useUserStore.getState().user.id) signOutLocally()

    studentQrSignIn(cardToken)
      .then((res) => {
        const user = startSession(res.data)
        router.replace(landingFor(user, '/student'))
      })
      .catch((err: unknown) => {
        setSignInError(err instanceof Error && err.message ? err.message : 'Sign-in failed. Please try again.')
      })
  }, [cardToken, router])

  if (!error) return <SigningIn />

  return (
    <div role="alert" className="flex flex-col items-center gap-3">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50">
        <ExclamationCircleIcon className="h-6 w-6 text-rose-600" aria-hidden="true" />
      </span>
      <h1 className="font-display text-xl font-semibold text-slate-900">We couldn&apos;t sign you in</h1>
      <p className="text-sm leading-relaxed text-slate-600">{error}</p>
      <Link
        href="/login"
        className={`mt-3 inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold ${studentTone.primary}`}
      >
        Sign in with your email instead
      </Link>
    </div>
  )
}

export default function QrSignInPage() {
  return (
    <QrFrame>
      <Suspense fallback={<SigningIn />}>
        <QrSignInContent />
      </Suspense>
    </QrFrame>
  )
}
