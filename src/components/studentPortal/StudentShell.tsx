// src/components/studentPortal/StudentShell.tsx
// The frame of every student page: sidebar (md and up), top bar with the page
// title and "Not you? Sign out", and the phone tab bar (below md). Indigo
// student tone (studentTone.ts), never the staff cyan.
'use client'

import type { ReactNode } from 'react'
import StudentSidebar from './StudentSidebar'
import StudentTopBar from './StudentTopBar'
import StudentBottomNav from './StudentBottomNav'
import { studentTone } from './studentTone'

interface StudentShellProps {
  /** Shown in the top bar. */
  title?: string
  /** Controls on the right of the top bar, before "Not you? Sign out" (a term picker). */
  actions?: ReactNode
  children: ReactNode
  /** Let the page use the full width (grids, wide tables). */
  wide?: boolean
}

export default function StudentShell({ title, actions, children, wide = false }: StudentShellProps) {
  return (
    <div className={`min-h-screen ${studentTone.page} text-slate-900`}>
      <StudentSidebar />
      <div className="flex min-h-screen flex-col md:pl-72">
        <StudentTopBar title={title} actions={actions} />
        {/* pb-24 keeps the last row clear of the phone tab bar. */}
        <main className={`w-full flex-1 px-4 pb-24 pt-6 md:px-8 md:pb-10 md:pt-8 ${wide ? '' : 'max-w-6xl'}`}>
          {children}
        </main>
      </div>
      <StudentBottomNav />
    </div>
  )
}
