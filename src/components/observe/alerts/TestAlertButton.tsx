// src/components/observe/alerts/TestAlertButton.tsx
'use client'
// "Send test": proves an alert reaches the owners' inbox and phones.
import { useState } from 'react'
import { sendTestAlert } from '@/services/observeService'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useObserveStore } from '@/store/useObserveStore'

const CHANNELS = [
  { key: 'both', label: 'Email and push' },
  { key: 'email', label: 'Email only' },
  { key: 'push', label: 'Push only' },
] as const

export default function TestAlertButton() {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const bumpAlerts = useObserveStore((s) => s.bumpAlerts)
  const [open, setOpen] = useState(false)
  const [sending, setSending] = useState(false)

  const send = async (channel: (typeof CHANNELS)[number]['key']) => {
    setOpen(false)
    setSending(true)
    try {
      const r = await sendTestAlert(channel)
      const parts = []
      if (r.email) parts.push(r.email.ok ? `email sent to ${r.email.recipients}` : `email failed: ${r.email.error}`)
      if (r.push) parts.push(r.push.ok ? `push sent to ${r.push.sent} phone${r.push.sent === 1 ? '' : 's'}` : `no push: ${r.push.error ?? 'not delivered'}`)
      const ok = (!r.email || r.email.ok) && (!r.push || r.push.ok)
      showNotification(`Test alert: ${parts.join(', ')}`, ok ? 'success' : 'info', 6000)
      bumpAlerts()
    } catch (e) {
      showNotification(e instanceof Error ? e.message : 'Could not send the test alert', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={sending}
        aria-expanded={open}
        className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-xs text-slate-300 hover:text-white disabled:opacity-50"
      >
        {sending ? 'Sending…' : 'Send test'}
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-white/[0.08] bg-slate-900 p-1 shadow-xl">
          {CHANNELS.map((c) => (
            <button key={c.key} type="button" onClick={() => send(c.key)} className="block w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white">
              {c.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
