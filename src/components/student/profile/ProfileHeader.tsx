'use client'

import React, { useEffect, useRef, useState } from 'react'
import { AcademicCapIcon, ArchiveBoxIcon, BuildingLibraryIcon, ChatBubbleLeftRightIcon, PencilIcon, UserIcon } from '@heroicons/react/24/outline'
import MenuButton, { type MenuItem } from '@/components/shared/MenuButton'
import { getGradeDisplayName, getSchoolName } from '@/lib/schoolUtils'
import { PROFILE_TABS, formatStamp, type ProfileTab } from '@/lib/studentProfile'
import Avatar from '@/components/avatar/Avatar'
import { studentAvatar } from '@/lib/studentAvatar'
import { clean } from './contact'
import type { StudentProfileStudent } from '@/services/types/studentProfile'

interface ProfileHeaderProps {
  student: StudentProfileStudent
  /** The tabs this viewer gets (no Grades without analytics). */
  tabs?: { key: ProfileTab; label: string }[]
  tab: ProfileTab
  onTab: (tab: ProfileTab) => void
  /** Small counts beside a tab label, e.g. open threads. */
  tabBadges?: Partial<Record<ProfileTab, number>>
  onMessage: () => void
  /** Edit the record; omitted for a viewer who can't (no `students`). */
  onEdit?: () => void
  menuItems: MenuItem[]
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ student, tabs = PROFILE_TABS, tab, onTab, tabBadges = {}, onMessage, onEdit, menuItems }) => {
  const archived = Boolean(student.isArchived)
  const gradeLabel = student.grade ? getGradeDisplayName(student.grade) : 'No grade'
  const avatar = studentAvatar(student)

  // The identity block scrolls away with the content. Once it has, a slim bar
  // with the student's name takes its place, pinned above the tab bar. The
  // sentinel sits one bar-height above the identity's bottom edge, which is
  // the exact scroll point where the tabs pin under the bar. The observer uses
  // the viewport, but the modal's scroll area clips what counts as visible.
  // Everything pinned leaves room on the right for the modal's close button.
  const [condensed, setCondensed] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setCondensed(!entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      {/* Zero-height so showing the bar never shifts the content beneath it. */}
      <div className="sticky top-0 z-10 h-0" aria-hidden>
        <div
          className={`absolute inset-x-0 top-0 flex h-14 items-center gap-3 border-b border-slate-100 bg-white pl-5 pr-14 transition-all duration-200 motion-reduce:transition-none sm:pl-6 md:pr-16 ${
            condensed ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
          }`}
        >
          <Avatar student name={student.name} avatar={avatar} photoUrl={student.photoUrl} size={32} />
          <p className="truncate font-semibold text-slate-900">{student.name}</p>
          <span className="hidden flex-shrink-0 rounded-md bg-purple-50 px-1.5 py-0.5 text-xs font-medium text-purple-700 sm:inline">{gradeLabel}</span>
          {archived && <span className="flex-shrink-0 rounded-md bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-700">Archived</span>}
        </div>
      </div>

      <div className="relative flex flex-col gap-5 border-b border-slate-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50 py-6 pl-5 pr-14 sm:pl-6 md:flex-row md:items-center md:justify-between md:pr-16">
        <div ref={sentinel} className="pointer-events-none absolute inset-x-0 bottom-14 h-px" />
        <div className="flex min-w-0 items-center gap-4">
          <Avatar student name={student.name} avatar={avatar} photoUrl={student.photoUrl} size={64} className="shadow-sm ring-4 ring-white" />
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900">{student.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700">
                <AcademicCapIcon className="h-4 w-4" />
                {gradeLabel}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-white px-2 py-1 text-sm text-slate-600 ring-1 ring-slate-200">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">OEN</span>
                <span className="font-mono">{clean(student.oen) ?? '—'}</span>
              </span>
              {archived && (
                <span className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-sm font-medium text-amber-700">
                  <ArchiveBoxIcon className="h-4 w-4" />
                  Archived {student.archivedAt ? formatStamp(student.archivedAt) : ''}
                </span>
              )}
            </div>
            <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="h-4 w-4 text-slate-400" />
                {student.homeroomTeacherName ? `Homeroom: ${student.homeroomTeacherName}` : 'No homeroom teacher'}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <BuildingLibraryIcon className="h-4 w-4 text-slate-400" />
                {getSchoolName(student.school)}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-shrink-0 items-center gap-2">
          {!archived && (
            <>
              <button
                onClick={onMessage}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                <ChatBubbleLeftRightIcon className="h-4 w-4" />
                <span className="sm:hidden">Message</span>
                <span className="hidden sm:inline">Message guardians</span>
              </button>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600"
                >
                  <PencilIcon className="h-4 w-4" />
                  Edit
                </button>
              )}
            </>
          )}
          {menuItems.length > 0 && <MenuButton items={menuItems} label="More actions" />}
        </div>
      </div>

      <nav
        className="sticky top-14 z-10 flex gap-1 overflow-x-auto border-b border-slate-100 bg-white pl-3 pr-14 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Student profile sections"
      >
        {tabs.map((t) => {
          const active = t.key === tab
          const badge = tabBadges[t.key]
          return (
            <button
              key={t.key}
              onClick={() => onTab(t.key)}
              aria-current={active ? 'page' : undefined}
              className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-medium transition-colors ${
                active ? 'border-cyan-500 text-cyan-700' : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {t.label}
              {badge ? (
                <span className={`rounded-full px-1.5 text-[11px] font-semibold ${active ? 'bg-cyan-100 text-cyan-700' : 'bg-slate-100 text-slate-500'}`}>
                  {badge}
                </span>
              ) : null}
            </button>
          )
        })}
      </nav>
    </>
  )
}

export default ProfileHeader
