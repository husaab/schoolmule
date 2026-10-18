// src/components/parent/EmailPreferencesLink.tsx
// The way from the parent's Classes page to their email choices (the weekly
// summary and the missing-work alert).
import Link from 'next/link'
import { EnvelopeIcon } from '@heroicons/react/24/outline'

export default function EmailPreferencesLink() {
  return (
    <Link
      href="/parent/notifications"
      className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-50 hover:text-amber-900"
    >
      <EnvelopeIcon className="h-4 w-4" aria-hidden="true" />
      Email preferences
    </Link>
  )
}
