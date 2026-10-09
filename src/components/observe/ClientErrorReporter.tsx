'use client'
// Hooks the window's error events once and flushes on page hide.
import { useEffect } from 'react'
import { reportClientEvent, flushClientEvents } from '@/services/clientErrors'

export default function ClientErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      reportClientEvent({
        kind: 'js_error',
        message: e.message || String(e.error) || 'Script error',
        stack: e.error && e.error.stack ? String(e.error.stack) : `${e.filename || ''}:${e.lineno || 0}:${e.colno || 0}`,
      })
    }
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e.reason
      reportClientEvent({
        kind: 'unhandled_rejection',
        message: r && r.message ? String(r.message) : String(r),
        stack: r && r.stack ? String(r.stack) : null,
      })
    }
    const onHide = () => flushClientEvents()
    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    window.addEventListener('pagehide', onHide)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      window.removeEventListener('pagehide', onHide)
    }
  }, [])
  return null
}
