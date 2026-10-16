// src/components/studentPortal/StudentSidebar.tsx
// The student portal's desktop sidebar (md and up): logo, main nav, the
// "My classes" list and the student's card with a Sign out menu. Below md the
// shell shows StudentBottomNav instead.
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { ArrowRightStartOnRectangleIcon, EllipsisVerticalIcon, FaceSmileIcon } from '@heroicons/react/24/outline'
import LogoutModal from '@/components/logout/logoutModal'
import Avatar from '@/components/avatar/Avatar'
import AvatarPickerModal from '@/components/avatar/AvatarPickerModal'
import { saveAvatar } from '@/services/profileService'
import type { AvatarSpec } from '@/services/types/profile'
import { useNotificationStore } from '@/store/useNotificationStore'
import { useUserStore } from '@/store/useUserStore'
import { gradeLabel } from '@/lib/studentAccounts'
import { STUDENT_NAV, isStudentNavActive } from './studentNav'
import { studentTone } from './studentTone'
import { useStudentBadges, useStudentClassLinks } from './useStudentBadges'
import { useStudentMe } from './useStudentMe'

export default function StudentSidebar() {
  const pathname = usePathname()
  const badges = useStudentBadges()
  const classes = useStudentClassLinks()

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-20 shrink-0 items-center justify-center px-6">
        <Link href="/student" aria-label="SchoolMule home">
          <Image src="/logo/trimmedlogo.png" alt="SchoolMule" width={140} height={44} className="h-16 w-auto" priority />
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto">
        <nav aria-label="Main" className="flex flex-col gap-1.5 px-4 pb-2 pt-6">
          {STUDENT_NAV.map((item) => {
            const active = isStudentNavActive(item.href, pathname)
            const count = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-[15px] transition-colors ${
                  active ? `${studentTone.navActive} font-medium` : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-indigo-600' : 'text-slate-400'}`} aria-hidden="true" />
                <span className="flex-1">{item.label}</span>
                {count > 0 && (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {count > 99 ? '99+' : count}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>

        {classes.length > 0 && (
          <div className="flex flex-col gap-0.5 px-4 pb-6 pt-2">
            <span className="px-4 pb-1.5 pt-3 text-[11px] font-medium uppercase tracking-[0.06em] text-slate-500">
              My classes
            </span>
            {classes.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                aria-current={pathname === c.href ? 'page' : undefined}
                className={`flex items-center gap-3 rounded-[10px] px-4 py-1.5 text-sm transition-colors ${
                  pathname === c.href ? 'bg-indigo-50 text-indigo-700' : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- static class icon */}
                <img src={c.iconUrl} alt="" className="h-6 w-6 shrink-0 rounded-[7px]" />
                <span className="truncate">{c.label}</span>
              </Link>
            ))}
          </div>
        )}
      </div>

      <StudentUserCard />
    </aside>
  )
}

// The bottom card: who is signed in, and a menu with Change avatar and Sign out.
function StudentUserCard() {
  const username = useUserStore((s) => s.user.username)
  const avatar = useUserStore((s) => s.user.avatar ?? null)
  const photoUrl = useUserStore((s) => s.user.photoUrl ?? null)
  const notify = useNotificationStore((s) => s.showNotification)
  const { me } = useStudentMe()
  const [menuOpen, setMenuOpen] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menuOpen) return
    const close = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) setMenuOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', close)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  const name = me?.student.name ?? username ?? ''

  const save = async (next: AvatarSpec) => {
    const res = await saveAvatar(next)
    const store = useUserStore.getState()
    store.setUser({ ...store.user, avatar: res.data.avatar })
    notify('Avatar saved', 'success')
  }

  return (
    <div ref={cardRef} className="relative shrink-0 border-t border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={name || 'You'} avatar={avatar} photoUrl={photoUrl} size={40} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium text-slate-900">{name}</span>
          <span className="truncate text-xs text-slate-500">
            {me ? `${gradeLabel(me.student.grade)} · student` : 'Student'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Account menu"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <EllipsisVerticalIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Hidden rather than unmounted: the sign-out confirmation lives inside
          LogoutModal and must outlive the menu closing. */}
      <div
        role="menu"
        aria-label="Account"
        className={`absolute bottom-full right-4 mb-2 w-48 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ${
          menuOpen ? '' : 'hidden'
        }`}
      >
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setMenuOpen(false)
            setPickerOpen(true)
          }}
          className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
        >
          <FaceSmileIcon className="h-4 w-4 text-slate-400" />
          Change avatar
        </button>
        <LogoutModal
          trigger={(open) => (
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setMenuOpen(false)
                open()
              }}
              className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
            >
              <ArrowRightStartOnRectangleIcon className="h-4 w-4 text-slate-400" />
              Sign out
            </button>
          )}
        />
      </div>

      <AvatarPickerModal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Your avatar"
        subtitle="Your teachers and classmates see it next to your name."
        name={name}
        value={avatar}
        onSave={save}
      />
    </div>
  )
}
