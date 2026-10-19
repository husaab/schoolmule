'use client'

// /qr — "Scan my card": a student signs in by holding their printed QR card up
// to the device's camera (final review I2). It works signed out and from any
// session: cards are scanned on shared classroom devices, so whoever is
// signed in here is signed out first, then the card's student is signed in
// and lands in the student portal.
//
// A card carries "SCHOOLMULE-QR:<token>", read only by this in-app scanner.
// The first cards carried a /qr?t=<token> link instead; opening such a link
// no longer signs anyone in (a link stays in a shared iPad's history and
// address-bar suggestions, where the next student could reopen it). The
// param is dropped from the address at once and the scanner is shown.

import { Suspense, useEffect, useState } from 'react'
import Image from 'next/image'
import { useSearchParams } from 'next/navigation'
import QrCardSignIn from '@/components/auth/QrCardSignIn'
import { studentTone } from '@/components/studentPortal/studentTone'

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

function QrSignInContent() {
  const searchParams = useSearchParams()
  // Opened from an early card's link: say why the link alone doesn't sign in. Read once, so it survives
  // dropping the param.
  const [fromLink] = useState(() => searchParams.has('t'))

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (!params.has('t')) return
    params.delete('t')
    const query = params.toString()
    // Out of the address bar (and this tab's history entry) at once.
    window.history.replaceState(window.history.state, '', `${window.location.pathname}${query ? `?${query}` : ''}`)
  }, [])

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-xl font-semibold text-slate-900">Sign in with your card</h1>
        <p className="text-sm leading-relaxed text-slate-600">
          {fromLink
            ? 'Card links no longer sign you in. Tap Scan my card and hold your card up to the camera.'
            : 'Tap Scan my card and hold your card up to the camera.'}
        </p>
      </div>
      <QrCardSignIn />
    </div>
  )
}

export default function QrSignInPage() {
  return (
    <QrFrame>
      <Suspense fallback={null}>
        <QrSignInContent />
      </Suspense>
    </QrFrame>
  )
}
