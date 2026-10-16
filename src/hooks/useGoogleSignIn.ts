'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GIS_SRC, loadScript } from '@/lib/googleScripts'

// The same Google Cloud OAuth client the Sheets integration uses.
const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

interface CodeResponse {
  code?: string
  error?: string
}

interface CodeClient {
  requestCode: () => void
}

type Pending = {
  resolve: (code: string | null) => void
  reject: (error: Error) => void
}

/**
 * Google's sign-in popup as a promise. `requestCode()` resolves with the
 * one-time code POST /auth/google exchanges, or with null when the person
 * closes the popup or declines.
 *
 * The script loads and the client is built on mount, not on click: browsers
 * only allow a popup opened straight from the click, so by the time someone
 * clicks there must be nothing left to wait for.
 *
 * `enabled` is false when the client id isn't configured, and `failed` when
 * Google's script couldn't load (offline, blocked); callers hide the button
 * in both cases so the email form stands on its own.
 */
export function useGoogleSignIn() {
  const clientRef = useRef<CodeClient | null>(null)
  const pendingRef = useRef<Pending | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!CLIENT_ID) return
    let active = true

    const settle = (finish: (pending: Pending) => void) => {
      const pending = pendingRef.current
      pendingRef.current = null
      if (pending) finish(pending)
    }

    loadScript(GIS_SRC)
      .then(() => {
        if (!active) return
        clientRef.current = window.google.accounts.oauth2.initCodeClient({
          client_id: CLIENT_ID,
          // Identity only. The Sheets grant (drive.file) stays out of sign-in.
          scope: 'openid email profile',
          include_granted_scopes: false,
          ux_mode: 'popup',
          // Always show the account chooser, so "Try another Google account"
          // and shared family computers work.
          select_account: true,
          callback: (response: CodeResponse) =>
            settle((p) => {
              if (response.code) p.resolve(response.code)
              else if (response.error === 'access_denied') p.resolve(null)
              else p.reject(new Error('Google sign-in failed. Please try again.'))
            }),
          error_callback: (error: { type?: string }) =>
            settle((p) => {
              if (error.type === 'popup_closed') p.resolve(null)
              else if (error.type === 'popup_failed_to_open') {
                p.reject(new Error('Your browser blocked the Google window. Allow pop-ups for this site and try again.'))
              } else p.reject(new Error('Google sign-in failed. Please try again.'))
            }),
        })
      })
      .catch(() => {
        if (active) setFailed(true)
      })

    return () => {
      active = false
    }
  }, [])

  const requestCode = useCallback(
    () =>
      new Promise<string | null>((resolve, reject) => {
        const client = clientRef.current
        if (!client) {
          reject(new Error('Google sign-in is still loading. Try again in a moment.'))
          return
        }
        // A popup left open from an earlier click is superseded by this one.
        pendingRef.current?.resolve(null)
        pendingRef.current = { resolve, reject }
        client.requestCode()
      }),
    []
  )

  return { enabled: Boolean(CLIENT_ID), failed, requestCode }
}
