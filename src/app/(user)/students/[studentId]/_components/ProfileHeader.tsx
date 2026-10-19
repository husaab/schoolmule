'use client'

import React from 'react'
import {
  AcademicCapIcon,
  ArchiveBoxIcon,
  BuildingLibraryIcon,
  ChatBubbleLeftRightIcon,
  PencilIcon,
  UserIcon,
} from '@heroicons/react/24/outline'
import MenuButton, { type MenuItem } from '@/components/shared/MenuButton'
import { getGradeDisplayName, getSchoolName } from '@/lib/schoolUtils'
import { PROFILE_TABS, formatStamp, type ProfileTab } from '@/lib/studentProfile'
import { initials } from '@/components/messaging/formatters'
import { clean } from '@/components/student/view/studentViewModal'
import type { StudentProfileStudent } from '@/services/types/studentProfile'

interface ProfileHeaderProps {
  student: StudentProfileStudent
  tab: ProfileTab
  onTab: (tab: ProfileTab) => void
  /** Small counts beside a tab label, e.g. open threads. */
  tabBadges?: Partial<Record<ProfileTab, number>>
  onMessage: () => void
  onEdit: () => void
  menuItems: MenuItem[]
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({ student, tab, onTab, tabBadges = {}, onMessage, onEdit, menuItems }) => {
  const archived = Boolean(student.isArchived)

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-gradient-to-br from-cyan-50 via-white to-teal-50 shadow-sm">
      <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 text-xl font-semibold tracking-wide text-white shadow-sm">
            {initials(student.name)}
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-2xl font-bold text-slate-900">{student.name}</h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg bg-purple-50 px-2 py-1 text-sm font-medium text-purple-700">
                <AcademicCapIcon className="h-4 w-4" />
                {student.grade ? getGradeDisplayName(student.grade) : 'No grade'}
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
              <button
                onClick={onEdit}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:from-cyan-600 hover:to-teal-600"
              >
                <PencilIcon className="h-4 w-4" />
                Edit
              </button>
            </>
          )}
          <MenuButton items={menuItems} label="More actions" />
        </div>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-t border-slate-100 bg-white/70 px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Student profile sections"
      >
        {PROFILE_TABS.map((t) => {
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
    </div>
  )
}

export default ProfileHeader
