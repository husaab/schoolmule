'use client'

// /student-invite#<secret> — a student sets up their SchoolMule account from
// the invite email: continue with their school Google account or choose a
// password, and land signed in on their own student home. The secret rides
// in the link's fragment, so it never reaches a server log; it is read once
// and dropped from the address bar.
//
// It opens from any session (a parent on the family laptop, a teacher on a
// classroom Chromebook): whoever is signed in is told and asked before being
// signed out, never bounced. Accepting only sets a credential on the login
// the school already made for this student's record.

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SchoolLogo from '@/components/branding/SchoolLogo'
import { GoogleMark } from '@/components/auth/GoogleSignIn'
import { studentTone } from '@/components/studentPortal/studentTone'
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn'
import { acceptStudentInvite, inspectStudentInvite, type StudentInviteInfo } from '@/services/authService'
import { isApiError } from '@/services/apiClient'
import { signOutLocally, startSession } from '@/services/sessionSync'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import {
  forgetInviteToken,
  inviteOutcomeCopy,
  rememberedInviteToken,
  studentPasswordProblem,
  type InviteOutcome,
} from '@/lib/studentInvite'
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'

type View = 'loading' | 'choose' | 'password' | 'outcome'

const DEAD_STATES = ['expired', 'used', 'replaced', 'cancelled'] as const
const gradeText = (g: string) => (g === 'JK' || g === 'SK' ? g : `Grade ${g}`)

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className={`flex min-h-screen items-start justify-center px-4 py-12 sm:items-center ${studentTone.page}`}>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  )
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-[20px] border border-slate-200/70 bg-white p-6 shadow-sm">{children}</div>
}

export default function StudentInvitePage() {
  const router = useRouter()
  const notify = useNotificationStore((s) => s.showNotification)
  const signedInName = useUserStore((s) => (s.user.id ? s.user.fullName || s.user.username : null))
  const google = useGoogleSignIn()

  const token = useRef<string | null>(null)
  const [view, setView] = useState<View>('loading')
  const [invite, setInvite] = useState<StudentInviteInfo | null>(null)
  const [outcome, setOutcome] = useState<InviteOutcome>('not_found')
  const [someoneElse, setSomeoneElse] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [again, setAgain] = useState('')
  const [show, setShow] = useState(false)

  const deadEnd = (next: InviteOutcome) => {
    if (next !== 'not_open') forgetInviteToken(window.sessionStorage)
    setOutcome(next)
    setView('outcome')
  }

  // Read the secret (remembered for this tab, so a reload keeps it), take it
  // out of the address bar, then look the invite up.
  useEffect(() => {
    const secret = rememberedInviteToken(window.location.hash, window.sessionStorage)
    window.history.replaceState(window.history.state, '', window.location.pathname)
    if (!secret) return deadEnd('not_found')
    token.current = secret
    inspectStudentInvite(secret)
      .then((res) => {
        const info = res.data
        if ((DEAD_STATES as readonly string[]).includes(info.state)) return deadEnd(info.state as InviteOutcome)
        setInvite(info)
        setView('choose')
      })
      .catch(() => deadEnd('not_found'))
  }, [])

  // Whoever is signed in on this device is asked about first.
  useEffect(() => {
    if (signedInName) setSomeoneElse(true)
  }, [signedInName])

  const finish = (data: Awaited<ReturnType<typeof acceptStudentInvite>>['data']) => {
    if ('activated' in data && data.signedIn === false) return deadEnd('not_open')
    if (!('token' in data)) return deadEnd('not_open')
    forgetInviteToken(window.sessionStorage)
    startSession(data)
    notify(invite ? `You're all set, ${invite.student.firstName}.` : "You're all set.", 'success')
    router.replace('/student')
  }

  const refused = (err: unknown) => {
    if (isApiError(err)) {
      const state = (err.data as { state?: string } | undefined)?.state
      if (err.status === 410 && state && (DEAD_STATES as readonly string[]).includes(state)) return deadEnd(state as InviteOutcome)
      if (err.code === 'INVITE_NOT_FOUND') return deadEnd('not_found')
      setNote(err.message || 'Something went wrong. Please try again.')
      return
    }
    setNote(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
  }

  const withGoogle = async () => {
    if (!token.current) return
    setNote(null)
    let code: string | null
    try {
      code = await google.requestCode()
    } catch (err) {
      setNote(err instanceof Error ? err.message : inviteOutcomeCopy('google_blocked').body)
      return
    }
    // Closed or refused (an under-18 account the school's Google admin hasn't allowed lands here too).
    if (!code) {
      setNote(inviteOutcomeCopy('google_blocked').body)
      return
    }
    setBusy(true)
    try {
      finish((await acceptStudentInvite({ token: token.current, googleCode: code })).data)
    } catch (err) {
      refused(err)
    } finally {
      setBusy(false)
    }
  }

  const withPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.current || !invite) return
    const problem = studentPasswordProblem(password, {
      email: invite.email,
      firstName: invite.student.firstName,
      lastName: invite.student.lastName ?? '',
      schoolName: invite.school.name,
    })
    if (problem) return setNote(problem)
    if (password !== again) return setNote("The two passwords don't match.")
    setNote(null)
    setBusy(true)
    try {
      finish((await acceptStudentInvite({ token: token.current, password })).data)
    } catch (err) {
      refused(err)
    } finally {
      setBusy(false)
    }
  }

  if (view === 'loading') {
    return (
      <Frame>
        <p role="status" className="text-center text-sm text-slate-500">Checking your invite…</p>
      </Frame>
    )
  }

  if (view === 'outcome') {
    const copy = inviteOutcomeCopy(outcome)
    return (
      <Frame>
        <Image src="/logo/trimmedlogo.png" alt="SchoolMule" width={140} height={44} className="mx-auto mb-6 h-12 w-auto" priority />
        <Card>
          <h1 className="text-lg font-semibold text-slate-900">{copy.title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">{copy.body}</p>
          {copy.action && (
            <Link href={copy.action.href} className={`mt-4 inline-flex rounded-xl px-4 py-2.5 text-sm font-semibold ${studentTone.primary}`}>
              {copy.action.label}
            </Link>
          )}
        </Card>
      </Frame>
    )
  }

  if (!invite) return null
  const who = `${invite.student.firstName}${invite.student.lastInitial ? ` ${invite.student.lastInitial}.` : ''}`

  if (someoneElse) {
    return (
      <Frame>
        <Card>
          <h1 className="text-xl font-semibold text-slate-900">You&apos;re signed in as {signedInName}.</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            To set up {invite.student.firstName}&apos;s account, we&apos;ll sign {signedInName} out on this device first.
          </p>
          <div className="mt-5 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                signOutLocally()
                setSomeoneElse(false)
              }}
              className={`min-h-[48px] rounded-xl text-sm font-semibold ${studentTone.primary} cursor-pointer`}
            >
              Sign out and continue
            </button>
            <button
              type="button"
              onClick={() => router.replace('/')}
              className="min-h-[48px] rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Not now
            </button>
          </div>
        </Card>
      </Frame>
    )
  }

  return (
    <Frame>
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <SchoolLogo schoolCode={invite.school.code} size={64} />
        <h1 className="text-2xl font-bold leading-tight text-slate-900">
          {view === 'password' ? 'Choose a password' : 'Set up your SchoolMule account'}
        </h1>
        <p className={`text-sm font-semibold ${studentTone.accentText}`}>
          {who} · {gradeText(invite.student.grade)} · {invite.school.name}
        </p>
      </div>

      <Card>
        {view === 'choose' ? (
          <div className="flex flex-col gap-4">
            {google.enabled && !google.failed && (
              <>
                <button
                  type="button"
                  onClick={() => void withGoogle()}
                  disabled={busy}
                  className="flex min-h-[52px] items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white text-base font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60 cursor-pointer"
                >
                  <GoogleMark />
                  Continue with Google
                </button>
                <p className="-mt-2 text-center text-xs text-slate-500">Use {invite.email}</p>
              </>
            )}
            {invite.methods.password && (
              <>
                {google.enabled && !google.failed && (
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNote(null)
                    setView('password')
                  }}
                  className={`min-h-[52px] rounded-xl text-base font-semibold ${studentTone.primary} cursor-pointer`}
                >
                  Create a password
                </button>
              </>
            )}
            {!invite.methods.password && (!google.enabled || google.failed) && (
              <p className="text-sm text-slate-600">Google sign-in isn&apos;t available on this device right now. Try again later, or tell your teacher.</p>
            )}
            {note && <p role="alert" className="text-sm text-rose-600">{note}</p>}
          </div>
        ) : (
          <form onSubmit={withPassword} className="flex flex-col gap-4" noValidate>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Password
              <span className="flex gap-2">
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-3 text-base font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="flex w-12 items-center justify-center rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  {show ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </span>
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              Type it again
              <input
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={again}
                onChange={(e) => setAgain(e.target.value)}
                className="rounded-xl border border-slate-300 px-3 py-3 text-base font-normal text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </label>
            <p className="text-xs leading-relaxed text-slate-500">At least 8 characters. Don&apos;t use your name or your email.</p>
            {note && <p role="alert" className="text-sm text-rose-600">{note}</p>}
            <button
              type="submit"
              disabled={busy}
              className={`min-h-[52px] rounded-xl text-base font-semibold disabled:opacity-60 ${studentTone.primary} cursor-pointer`}
            >
              {busy ? 'Setting up…' : 'Set password and sign in'}
            </button>
            <button
              type="button"
              onClick={() => {
                setNote(null)
                setView('choose')
              }}
              className="text-sm font-medium text-indigo-700 hover:text-indigo-800 cursor-pointer"
            >
              Back
            </button>
          </form>
        )}
      </Card>

      <p className="mt-6 text-center text-xs text-slate-500">Not {invite.student.firstName}? Close this page and tell your teacher.</p>
    </Frame>
  )
}
