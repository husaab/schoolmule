'use client'

// The student's Messages (Student-Messages board): their conversations with
// their own teachers, with their parents always in them, and "Message a
// teacher" to start one. The open conversation is ?thread=; a class page's
// "Message {teacher}" button arrives with ?compose=1&teacher=&class= (those
// three are momentary, never remembered). The server decides who a student may
// write to; nothing here sends a student id.

import { Suspense } from 'react'
import { PlusIcon } from '@heroicons/react/24/outline'
import StudentInbox from '@/components/studentPortal/messages/StudentInbox'
import StudentShell from '@/components/studentPortal/StudentShell'
import { useFilterParams } from '@/hooks/useFilterParams'
import { composePatch } from '@/lib/studentMessages'
import { useImpersonationStore } from '@/store/useImpersonationStore'
import { useUserStore } from '@/store/useUserStore'

function StudentMessagesContent() {
  const userId = useUserStore((s) => s.user.id)
  const role = useUserStore((s) => s.user.role)
  const previewing = useImpersonationStore((s) => s.session !== null)
  const filters = useFilterParams({ remember: false, transient: ['compose', 'teacher', 'class'] })

  return (
    <StudentShell
      title="Messages"
      wide
      actions={
        <button
          type="button"
          onClick={() => filters.setParams(composePatch())}
          aria-label="Message a teacher"
          className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-indigo-600 px-3.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 sm:px-4"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
          <span className="sm:hidden">New</span>
          <span className="hidden sm:inline">Message a teacher</span>
        </button>
      }
    >
      <div className="max-w-[1180px]">
        {userId && role === 'STUDENT' ? <StudentInbox filters={filters} userId={userId} previewing={previewing} /> : null}
      </div>
    </StudentShell>
  )
}

export default function StudentMessagesPage() {
  return (
    <Suspense fallback={null}>
      <StudentMessagesContent />
    </Suspense>
  )
}
