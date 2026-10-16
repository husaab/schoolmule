'use client'

import { FC, useState } from 'react'
import Link from 'next/link'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { useGoogleSignIn } from '@/hooks/useGoogleSignIn'
import { googleAuth } from '@/services/authService'
import { ApiError } from '@/services/apiClient'
import { useNotificationStore } from '@/store/useNotificationStore'
import type { GoogleAuthResponse } from '@/services/types/auth'
import type { SignupRole } from '@/services/types/adminApproval'

type GoogleSignInProps = {
  /** Text in the divider between this button and the email form below it. */
  dividerLabel: string
  /** Called with the session payload; the caller stores it and navigates. */
  onSignedIn: (data: GoogleAuthResponse['data']) => void
} & (
  | { intent: 'login' }
  | { intent: 'signup'; school: string; role: SignupRole }
)

// Google's "G", in Google's colours (its branding rules don't allow a
// recoloured mark).
const GoogleMark: FC = () => (
  <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5 shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
)

const Spinner: FC = () => (
  <svg className="animate-spin h-5 w-5 shrink-0 text-slate-500" viewBox="0 0 24 24" aria-hidden="true">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
)

/**
 * "Sign in with Google" / "Sign up with Google" above the email form, with the
 * "or …" divider that separates the two. Renders nothing when Google sign-in
 * isn't configured or Google's script can't load, so the email form stands
 * alone.
 *
 * On /login, a Google account with no SchoolMule account gets an inline
 * notice pointing to the school directory instead of an error toast.
 */
const GoogleSignIn: FC<GoogleSignInProps> = (props) => {
  const { intent, dividerLabel, onSignedIn } = props
  const { enabled, failed, requestCode } = useGoogleSignIn()
  const showNotification = useNotificationStore((state) => state.showNotification)
  const [busy, setBusy] = useState(false)
  const [noAccountEmail, setNoAccountEmail] = useState<string | null>(null)

  if (!enabled || failed) return null

  const signIn = async () => {
    setNoAccountEmail(null)
    // requestCode opens the popup synchronously, inside this click.
    let code: string | null
    try {
      code = await requestCode()
    } catch (error) {
      showNotification((error as Error).message, 'error')
      return
    }
    if (!code) return

    setBusy(true)
    try {
      const response = await googleAuth(
        props.intent === 'signup'
          ? { code, intent: 'signup', school: props.school, role: props.role }
          : { code, intent: 'login' }
      )
      onSignedIn(response.data)
    } catch (error) {
      setBusy(false)
      if (error instanceof ApiError && error.code === 'GOOGLE_NO_ACCOUNT') {
        setNoAccountEmail((error.data as { email?: string } | null)?.email ?? '')
        return
      }
      showNotification(
        error instanceof ApiError ? error.message : 'Google sign-in failed. Please try again.',
        'error'
      )
    }
  }

  return (
    <div className="space-y-5">
      {noAccountEmail !== null && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          <InformationCircleIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
          <div className="space-y-1.5">
            <p>
              There&apos;s no SchoolMule account for{' '}
              {noAccountEmail ? <span className="font-semibold">{noAccountEmail}</span> : 'that Google account'}.
            </p>
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Link href="/signup" className="font-semibold text-cyan-700 hover:text-cyan-800">
                Find your school to sign up
              </Link>
              <span className="text-amber-700/60" aria-hidden="true">·</span>
              <button
                type="button"
                onClick={signIn}
                className="font-semibold text-cyan-700 hover:text-cyan-800 cursor-pointer"
              >
                Try another Google account
              </button>
            </p>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={signIn}
        disabled={busy}
        className="w-full py-3.5 px-4 flex items-center justify-center gap-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus-visible:border-cyan-500 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {busy ? <Spinner /> : <GoogleMark />}
        <span>
          {busy
            ? intent === 'signup' ? 'Creating account...' : 'Signing in...'
            : intent === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}
        </span>
      </button>

      <div className="flex items-center gap-3" role="separator" aria-label={dividerLabel}>
        <span className="h-px flex-1 bg-slate-200" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400" aria-hidden="true">
          {dividerLabel}
        </span>
        <span className="h-px flex-1 bg-slate-200" />
      </div>
    </div>
  )
}

export default GoogleSignIn
