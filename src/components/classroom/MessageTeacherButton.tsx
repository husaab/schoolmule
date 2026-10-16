// src/components/classroom/MessageTeacherButton.tsx
// The one "Message {teacher}" button at the top right of a class page, for
// students and parents (Student-Class and Parent-Lens boards): a white pill
// with the lead teacher's avatar. Students follow a link to their Messages
// page; parents open the existing new-message window, so the button is a link
// or a button depending on what it is given.
'use client'

import Link from 'next/link'
import Avatar from '@/components/avatar/Avatar'
import type { PersonLite } from '@/services/types/profile'

interface MessageTeacherButtonProps {
  teacher: PersonLite
  tone: 'student' | 'parent'
  href?: string
  onClick?: () => void
}

const INK = {
  student: 'text-indigo-700 focus-visible:ring-indigo-500',
  parent: 'text-amber-800 focus-visible:ring-amber-600',
}

export default function MessageTeacherButton({ teacher, tone, href, onClick }: MessageTeacherButtonProps) {
  const className = `inline-flex max-w-full cursor-pointer items-center gap-2.5 rounded-full bg-white py-2 pl-2 pr-4 text-sm font-semibold shadow-[0_2px_8px_rgba(15,23,42,0.1)] outline-none transition-shadow hover:shadow-[0_3px_12px_rgba(15,23,42,0.16)] focus-visible:ring-2 sm:text-[15px] ${INK[tone]}`
  const inner = (
    <>
      <Avatar name={teacher.name} avatar={teacher.avatar} photoUrl={teacher.photoUrl} size={32} />
      <span className="truncate">Message {teacher.name}</span>
    </>
  )
  if (href) {
    return (
      <Link href={href} className={className}>
        {inner}
      </Link>
    )
  }
  return (
    <button type="button" onClick={onClick} className={className}>
      {inner}
    </button>
  )
}
