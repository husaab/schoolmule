'use client'
// A render crash used to be a white screen. Report it and offer a reset.
import { useEffect } from 'react'
import { reportClientEvent } from '@/services/clientErrors'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

export default function UserError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientEvent({ kind: 'render_error', message: error.message || 'Render error', stack: error.stack || error.digest || null })
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm">
        <ExclamationTriangleIcon className="h-10 w-10 text-amber-500 mx-auto mb-3" />
        <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
        <p className="text-sm text-slate-500 mt-2">This page hit an error. It has been reported. You can try again or go back to your dashboard.</p>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={reset} className="px-4 py-2 rounded-xl bg-cyan-600 text-white text-sm font-medium hover:bg-cyan-700">Try again</button>
          <a href="/dashboard" className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50">Dashboard</a>
        </div>
      </div>
    </div>
  )
}
