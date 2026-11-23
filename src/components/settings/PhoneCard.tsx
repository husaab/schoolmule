// src/components/settings/PhoneCard.tsx
// Settings → Phone number: the signed-in person's own number, optional.
// Staff: families who book a phone call meeting with them see it (unless a
// different "Number I'll call from" is set in My Meetings). Parents: it fills
// in their phone call meetings. Not shown to student logins.
'use client'

import { useState } from 'react'
import { CheckIcon, PhoneIcon } from '@heroicons/react/24/outline'
import { Button, inputClass } from '@/components/shared/modalKit'
import { savePhone } from '@/services/profileService'
import { badPhone, cleanPhone } from '@/lib/phone'
import { useNotificationStore } from '@/store/useNotificationStore'

interface Props {
  /** The saved number (from GET /profile); undefined while it loads. */
  phone: string | null | undefined
  staff: boolean
  onSaved: (phone: string | null) => void
}

export default function PhoneCard({ phone, staff, onSaved }: Props) {
  const showNotification = useNotificationStore((s) => s.showNotification)
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const value = draft ?? phone ?? ''
  const bad = badPhone(value)
  const changed = draft !== null && (cleanPhone(draft) ?? '') !== (phone ?? '')

  const save = async () => {
    if (bad || !changed) return
    setSaving(true)
    try {
      const res = await savePhone(cleanPhone(value))
      onSaved(res.data.phone)
      setDraft(null)
      showNotification(res.data.phone ? 'Phone number saved' : 'Phone number removed', 'success')
    } catch (err) {
      showNotification(err instanceof Error && err.message ? err.message : 'Could not save your phone number', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <PhoneIcon className="w-5 h-5 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-900">Phone number</h3>
      </div>
      <p className="text-sm text-slate-500 mb-4">
        {staff
          ? 'Optional. Families who book a phone call parent–teacher meeting with you see this number, so they know it’s you calling. The office can see it too.'
          : 'Optional. We fill it in for you when you book a phone call parent–teacher meeting.'}
      </p>
      <form
        className="flex flex-wrap items-start gap-3"
        onSubmit={(e) => { e.preventDefault(); void save() }}
      >
        <div className="w-full max-w-xs">
          <label htmlFor="settings-phone" className="sr-only">Phone number</label>
          <input
            id="settings-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            className={inputClass}
            placeholder={phone === undefined ? 'Loading…' : '416-555-0100'}
            disabled={phone === undefined}
            value={value}
            onChange={(e) => setDraft(e.target.value)}
            aria-invalid={bad}
            aria-describedby="settings-phone-hint"
          />
          <p id="settings-phone-hint" className={`mt-1 text-xs ${bad ? 'text-rose-600' : 'text-slate-400'}`}>
            {bad ? 'That doesn’t look like a full phone number.' : 'Leave it blank to remove it.'}
          </p>
        </div>
        <Button type="submit" disabled={!changed || bad} loading={saving}>
          <CheckIcon className="h-4 w-4" /> Save
        </Button>
      </form>
    </div>
  )
}
