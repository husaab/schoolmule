// src/components/studentPortal/StudentBottomNav.tsx
// The phone tab bar (below md): the same entries as the desktop sidebar. Each
// carries its page's remembered filters (the To-do's tab and class, Grades'
// class and term), as the staff and parent sidebars do (final review M4).
'use client'

import { usePathname } from 'next/navigation'
import BackLink from '@/components/shared/BackLink'
import { STUDENT_NAV, isStudentNavActive } from './studentNav'
import { useStudentBadges } from './useStudentBadges'

export default function StudentBottomNav() {
  const pathname = usePathname()
  const badges = useStudentBadges()

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid border-t border-slate-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
      style={{ gridTemplateColumns: `repeat(${STUDENT_NAV.length}, minmax(0, 1fr))` }}
    >
      {STUDENT_NAV.map((item) => {
        const active = isStudentNavActive(item.href, pathname)
        const count = item.badgeKey ? badges[item.badgeKey] ?? 0 : 0
        const Icon = item.icon
        return (
          <BackLink
            key={item.href}
            to={item.href}
            aria-current={active ? 'page' : undefined}
            className={`flex h-16 flex-col items-center justify-center gap-1 text-xs ${
              active ? 'font-semibold text-indigo-700' : 'text-slate-500'
            }`}
          >
            <span className="relative">
              <Icon className={`h-6 w-6 ${active ? 'text-indigo-600' : 'text-slate-500'}`} aria-hidden="true" />
              {count > 0 && (
                <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-indigo-600 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </span>
            {item.label}
          </BackLink>
        )
      })}
    </nav>
  )
}
