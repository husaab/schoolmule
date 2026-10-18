// src/components/studentPortal/messages/StudentThreadList.tsx
// The left side of the student's Messages page (Student-Messages board): one
// row per conversation, newest first. A row shows the teacher's avatar and
// name, when the last message was sent, the class icon and the title, a preview
// ("You: …", "Mona: …", "Lina Farouk: …") and a dot when there is something
// unread. The open conversation is tinted.
'use client'

import Avatar from '@/components/avatar/Avatar'
import { defaultIdentity } from '@/lib/classIdentity'
import { isUnread, listWhen, rowPreview, rowTeacher } from '@/lib/studentMessages'
import type { ConversationItem, StudentTargetTeacher } from '@/services/types/messaging'
import type { StudentClassCard } from '@/services/types/studentPortal'

interface StudentThreadListProps {
  items: ConversationItem[]
  /** The student's teachers, to name the person a thread was written to. */
  teachers: StudentTargetTeacher[] | null
  /** The student's classes, for each class's own icon. */
  classes: StudentClassCard[] | null
  selectedId: string | null
  userId: string
  onSelect: (conversationId: string) => void
  now?: Date
}

export default function StudentThreadList({ items, teachers, classes, selectedId, userId, onSelect, now = new Date() }: StudentThreadListProps) {
  return (
    <ul aria-label="Conversations" className="flex flex-col">
      {items.map((item) => {
        const teacher = rowTeacher(item, teachers)
        const selected = item.conversationId === selectedId
        const unread = isUnread(item)
        const icon =
          (item.classId ? classes?.find((c) => c.classId === item.classId)?.identity.iconUrl : null) ?? defaultIdentity(item.classSubject).iconUrl
        return (
          <li key={item.conversationId}>
            <button
              type="button"
              onClick={() => onSelect(item.conversationId)}
              aria-current={selected ? 'true' : undefined}
              className={`flex w-full cursor-pointer items-start gap-3 border-b border-slate-100 px-[18px] py-4 text-left transition-colors ${
                selected ? 'bg-indigo-50' : 'bg-white hover:bg-slate-50'
              }`}
            >
              <Avatar name={teacher.name} avatar={teacher.avatar} size={44} />
              <span className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={`truncate text-sm text-slate-900 ${unread ? 'font-semibold' : 'font-medium'}`}>{teacher.name}</span>
                  <span className="shrink-0 text-xs text-slate-500">{listWhen(item.lastMessageAt, now)}</span>
                </span>
                <span className="flex items-center gap-1.5">
                  {/* eslint-disable-next-line @next/next/no-img-element -- static class icon */}
                  <img src={icon} alt="" className="h-[18px] w-[18px] shrink-0 rounded-[5px]" />
                  <span className={`truncate text-[13px] text-slate-700 ${unread ? 'font-semibold' : 'font-medium'}`}>{item.title}</span>
                  {item.status === 'resolved' && (
                    <span className="shrink-0 rounded-full border border-slate-200 bg-slate-50 px-1.5 py-px text-[10px] font-medium text-slate-600">Finished</span>
                  )}
                </span>
                <span className={`truncate text-[13px] ${unread ? 'text-slate-800' : 'text-slate-500'}`}>{rowPreview(item, userId)}</span>
              </span>
              {unread && !selected && (
                <span className="mt-1.5 h-[9px] w-[9px] shrink-0 rounded-full bg-indigo-600" role="img" aria-label="Unread" />
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
