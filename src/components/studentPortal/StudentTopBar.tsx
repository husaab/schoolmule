// src/components/studentPortal/StudentTopBar.tsx
// The bar on top of every student page: the page title, and "Not you? Sign
// out" so a student on a shared classroom device can always leave someone
// else's session.
'use client'

import type { ReactNode } from 'react'
import LogoutModal from '@/components/logout/logoutModal'

export default function StudentTopBar({ title, actions }: { title?: string; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 md:h-20 md:px-8">
      <h1 className="min-w-0 truncate text-lg font-semibold text-slate-900">{title}</h1>
      <div className="flex shrink-0 items-center gap-4">
        {actions}
        <p className="text-sm text-slate-500">
          Not you?{' '}
          <LogoutModal
            trigger={(open) => (
              <button
                type="button"
                onClick={open}
                className="cursor-pointer font-semibold text-indigo-700 underline-offset-2 hover:text-indigo-800 hover:underline"
              >
                Sign out
              </button>
            )}
          />
        </p>
      </div>
    </header>
  )
}
