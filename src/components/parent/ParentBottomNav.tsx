// src/components/parent/ParentBottomNav.tsx
// The parent portal's phone tab bar (Parent-Phone board, smoke S11): Overview,
// Classes and Messages, and More, which opens the full sidebar. Below lg only,
// where the sidebar is a drawer. Links carry each page's remembered filters,
// as the sidebar's do.
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentType, SVGProps } from 'react'
import { AcademicCapIcon, EllipsisHorizontalIcon, HomeIcon, InboxIcon } from '@heroicons/react/24/outline'
import { useRememberedHref } from '@/hooks/useFilterParams'
import { useMessagingStore } from '@/store/useMessagingStore'
import { useSidebarStore } from '@/store/useSidebarStore'

const TABS: { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { href: '/parent/dashboard', label: 'Overview', icon: HomeIcon },
  { href: '/parent/classes', label: 'Classes', icon: AcademicCapIcon },
  { href: '/parent/messages', label: 'Messages', icon: InboxIcon },
]

const isActive = (href: string, pathname: string) => pathname === href || pathname.startsWith(`${href}/`)

function Tab({ href, label, icon: Icon, badge }: { href: string; label: string; icon: ComponentType<SVGProps<SVGSVGElement>>; badge: number }) {
  const pathname = usePathname() ?? ''
  const to = useRememberedHref(href)
  const active = isActive(href, pathname)
  return (
    <Link
      href={to}
      aria-current={active ? 'page' : undefined}
      className={`flex h-16 flex-col items-center justify-center gap-1 text-xs ${active ? 'font-semibold text-amber-800' : 'text-stone-500'}`}
    >
      <span className="relative">
        <Icon className={`h-6 w-6 ${active ? 'text-amber-700' : 'text-stone-500'}`} aria-hidden="true" />
        {badge > 0 && (
          <span className="absolute -right-2.5 -top-1.5 min-w-[18px] rounded-full bg-amber-700 px-1 text-center text-[10px] font-semibold leading-[18px] text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </span>
      {label}
    </Link>
  )
}

export default function ParentBottomNav() {
  const unread = useMessagingStore((s) => s.summary.unreadConversations + s.summary.unreadAnnouncements)
  const toggleSidebar = useSidebarStore((s) => s.toggleSidebar)
  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-stone-200 bg-white px-2 pb-[env(safe-area-inset-bottom)] lg:hidden print:hidden"
    >
      {TABS.map((tab) => (
        <Tab key={tab.href} {...tab} badge={tab.href === '/parent/messages' ? unread : 0} />
      ))}
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex h-16 cursor-pointer flex-col items-center justify-center gap-1 text-xs text-stone-500"
      >
        <EllipsisHorizontalIcon className="h-6 w-6" aria-hidden="true" />
        More
      </button>
    </nav>
  )
}
