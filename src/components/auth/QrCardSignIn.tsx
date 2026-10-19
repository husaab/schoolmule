// src/components/auth/QrCardSignIn.tsx
// "Scan my card": a student holds their printed QR card up to the camera and
// is signed in (on /qr, and in the window /login opens). The steps: a big
// Scan my card button (the camera only opens when asked), the camera view,
// "Signing you in…", then the student portal. Cards are scanned on shared
// classroom devices, so whoever is signed in here is signed out first.
// Every failure has plain words and a way to try again: the camera refused
// or missing, a code that isn't a card, a voided card, too many tries, no
// connection (src/lib/qrSignIn.ts).
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ExclamationCircleIcon, QrCodeIcon } from '@heroicons/react/24/outline'
import QrCardScanner from '@/components/auth/QrCardScanner'
import { landingFor } from '@/lib/authRouting'
import { qrSignInMessage } from '@/lib/qrSignIn'
import { getToken, studentQrSignIn } from '@/services/authService'
import { signOutLocally, startSession } from '@/services/sessionSync'
import { useUserStore } from '@/store/useUserStore'

type Step = { kind: 'ready' } | { kind: 'scanning' } | { kind: 'signing' } | { kind: 'failed'; message: string }

interface QrCardSignInProps {
  /** Open the camera straight away (the login window was opened for this). */
  autoStart?: boolean
  /** Shown under a failure: a way back to the email sign-in (the /qr page links to /login). */
  emailFallback?: 'link' | 'none'
  /** Close the window (login): a Cancel beside the camera. */
  onCancel?: () => void
}

export default function QrCardSignIn({ autoStart = false, emailFallback = 'link', onCancel }: QrCardSignInProps) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(autoStart ? { kind: 'scanning' } : { kind: 'ready' })

  const signIn = async (token: string) => {
    setStep({ kind: 'signing' })
    // Someone else's session (a teacher on the classroom laptop, the last student) must not survive a card scan.
    if (getToken() || useUserStore.getState().user.id) signOutLocally()
    try {
      const res = await studentQrSignIn(token)
      const user = startSession(res.data)
      router.replace(landingFor(user, '/student'))
    } catch (err) {
      setStep({ kind: 'failed', message: qrSignInMessage(err) })
    }
  }

  if (step.kind === 'signing') {
    return (
      <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-2">
        <span className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" aria-hidden="true" />
        <p className="text-base font-medium text-slate-700">Signing you in…</p>
      </div>
    )
  }

  if (step.kind === 'scanning') {
    return (
      <div className="flex flex-col gap-3">
        <QrCardScanner onToken={(token) => void signIn(token)} onCameraError={(message) => setStep({ kind: 'failed', message })} />
        <button
          type="button"
          onClick={() => (onCancel ? onCancel() : setStep({ kind: 'ready' }))}
          className="min-h-11 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Cancel
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      {step.kind === 'failed' && (
        <div role="alert" className="flex w-full flex-col items-center gap-2 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50">
            <ExclamationCircleIcon className="h-6 w-6 text-rose-600" aria-hidden="true" />
          </span>
          <h2 className="font-display text-lg font-semibold text-slate-900">We couldn&apos;t sign you in</h2>
          <p className="text-sm leading-relaxed text-slate-600">{step.message}</p>
        </div>
      )}
      <button
        type="button"
        onClick={() => setStep({ kind: 'scanning' })}
        className="flex min-h-[52px] w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl bg-indigo-600 px-4 text-base font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        <QrCodeIcon className="h-6 w-6" aria-hidden="true" />
        {step.kind === 'failed' ? 'Scan again' : 'Scan my card'}
      </button>
      {step.kind === 'failed' && emailFallback === 'link' && (
        <Link href="/login" className="text-sm font-medium text-indigo-700 hover:text-indigo-900">
          Sign in with your email instead
        </Link>
      )}
    </div>
  )
}
