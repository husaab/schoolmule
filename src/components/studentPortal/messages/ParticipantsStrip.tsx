// src/components/studentPortal/messages/ParticipantsStrip.tsx
// Who is in a conversation, as a row of chips with their avatars
// (Student-Messages board): the teachers ("Lina Farouk · teacher"), "You",
// then the parents ("Mona Haddad · mother"). The server derives the parents,
// so this shows exactly who can read the thread.
'use client'

import Avatar from '@/components/avatar/Avatar'
import { orderParticipants, participantLabel } from '@/lib/studentMessages'
import type { Participant } from '@/services/types/messaging'

interface ParticipantsStripProps {
  participants: Participant[]
  /** The signed-in student. */
  userId: string
  /** Who the thread was written to (an admin who teaches the class reads as a teacher). */
  teacherId: string | null
}

export default function ParticipantsStrip({ participants, userId, teacherId }: ParticipantsStripProps) {
  const people = orderParticipants(participants, userId)
  return (
    // On a phone the chips sit in one row you can swipe, so the people do not push the messages off the screen.
    <ul className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0 sm:pb-0" aria-label="In this conversation">
      {people.map((p) => (
        <li
          key={p.userId}
          className="flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-slate-200 bg-slate-50 py-1 pl-1 pr-3 text-[13px] text-slate-800"
        >
          <Avatar name={p.name} avatar={p.avatar ?? null} photoUrl={p.photoUrl} size={26} />
          {participantLabel(p, userId, teacherId)}
        </li>
      ))}
    </ul>
  )
}
