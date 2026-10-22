// src/components/parent/classes/ChildClassroomCard.tsx
// One child on the parent's Classes page (Parent-Classes board). A child who
// signs in shows the week at a glance (due, missing, new grades) and the
// latest grade with the teacher's comment. A child who does not sign in shows
// what their teachers posted instead. Either way one button opens the lens.
'use client'

import { ChevronRightIcon } from '@heroicons/react/24/outline'
import Avatar from '@/components/avatar/Avatar'
import { childSubline, firstNameOf, notSigningNote, openChildLabel, recentPostMeta, scoreText, statTiles } from '@/lib/classroomText'
import type { ChildClassroomSummary } from '@/services/types/parentClassroom'

interface ChildClassroomCardProps {
  child: ChildClassroomSummary
  onOpen: () => void
  /** Layout classes from the page (a phone shows one child at a time). */
  className?: string
  now?: Date
}

export default function ChildClassroomCard({ child, onOpen, className = 'flex', now = new Date() }: ChildClassroomCardProps) {
  const first = firstNameOf(child.name)
  const grade = child.latestGrade

  return (
    <article className={`${className} flex-col gap-4 rounded-[18px] border border-stone-200 bg-white p-[22px] shadow-sm`}>
      <div className="flex items-center gap-3">
        <Avatar student name={child.name} avatar={child.avatar} photoUrl={child.photoUrl} size={44} />
        <div className="flex min-w-0 flex-1 flex-col">
          <h4 className="truncate font-display text-xl font-semibold text-slate-900">{first}</h4>
          <span className="text-[13px] text-stone-500">{childSubline(child)}</span>
        </div>
      </div>

      {child.signsIn ? (
        <>
          <div className="grid grid-cols-3 gap-2.5">
            {statTiles(child).map((tile) => {
              const alarm = tile.key === 'missing' && tile.value > 0
              return (
                <div key={tile.key} className={`flex flex-col gap-0.5 rounded-[14px] p-3 ${alarm ? 'bg-rose-50' : 'bg-stone-50'}`}>
                  <span className={`font-display text-2xl font-semibold ${alarm ? 'text-rose-700' : 'text-slate-900'}`}>{tile.value}</span>
                  <span className={`text-xs ${alarm ? 'text-rose-800' : 'text-stone-600'}`}>{tile.label}</span>
                </div>
              )
            })}
          </div>

          {grade && (
            <div className="flex flex-col gap-2.5">
              <div className="flex items-baseline justify-between gap-2.5 text-sm">
                <span>
                  {grade.title} <span className="text-stone-500">· {grade.subject}</span>
                </span>
                <span className={`font-semibold ${grade.status === 'missing' ? 'text-rose-700' : ''}`}>{scoreText(grade)}</span>
              </div>
              {grade.feedback && (
                <p className="line-clamp-2 rounded-xl bg-stone-50 px-3 py-2.5 text-sm italic leading-relaxed text-stone-700">&ldquo;{grade.feedback}&rdquo;</p>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-stone-600">{notSigningNote(child.name, child.homeroomTeacherName)}</p>
          {child.recentPosts.map((post) => (
            <div key={post.announcementId} className="flex flex-col gap-1.5 rounded-[14px] bg-stone-50 p-3.5">
              <span className="text-xs text-stone-500">{recentPostMeta(post, now)}</span>
              <span className="text-[15px] font-medium text-slate-900">{post.title}</span>
              <span className="line-clamp-2 text-sm leading-relaxed text-stone-700">{post.body}</span>
            </div>
          ))}
        </>
      )}

      <button
        type="button"
        onClick={onOpen}
        className={`mt-auto flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors ${
          child.signsIn
            ? 'bg-amber-700 text-white hover:bg-amber-800'
            : 'border border-stone-200 bg-white text-slate-700 hover:bg-stone-50'
        }`}
      >
        {openChildLabel(child)}
        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </article>
  )
}
