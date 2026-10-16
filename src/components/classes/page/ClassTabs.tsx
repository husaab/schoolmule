// src/components/classes/page/ClassTabs.tsx
// The class page's tab bar. It sits at the bottom of the class banner: the
// tabs are in the class color's ink and the open one is a tab of the page
// below it. Each tab is a real link (cmd-click opens it in a new browser
// tab); a plain click goes through onSelect so the page can keep its URL
// filters in step.
'use client'

import Link from 'next/link'
import { useEffect, useRef, type MouseEvent } from 'react'
import type { ClassTab } from '@/lib/classroomRoutes'
import { CLASS_TABS, type ClassTabItem } from './tabs'

interface ClassTabsProps {
  active: ClassTab
  hrefFor: (tab: ClassTab) => string
  onSelect: (tab: ClassTab) => void
  /** The staff tabs unless a variant passes its own (the student and parent class pages). */
  tabs?: ClassTabItem[]
  /** The open tab's look: it joins the page below it (slate for the student page, white inside the parent's card). */
  activeClassName?: string
}

const isPlainClick = (e: MouseEvent) => e.button === 0 && !e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey

export default function ClassTabs({
  active,
  hrefFor,
  onSelect,
  tabs = CLASS_TABS,
  activeClassName = 'bg-slate-50 text-slate-900',
}: ClassTabsProps) {
  const navRef = useRef<HTMLElement>(null)

  // On a phone the bar scrolls sideways: keep the open tab in view (sideways only, never the page).
  useEffect(() => {
    const nav = navRef.current
    const tab = nav?.querySelector<HTMLElement>('[aria-current="page"]')
    if (!nav || !tab) return
    const bar = nav.getBoundingClientRect()
    const box = tab.getBoundingClientRect()
    if (box.left < bar.left) nav.scrollLeft += box.left - bar.left - 8
    else if (box.right > bar.right) nav.scrollLeft += box.right - bar.right + 8
  }, [active])

  return (
    <nav ref={navRef} aria-label="Class" className="-mx-1 flex gap-1 overflow-x-auto px-1 text-[15px] font-medium">
      {tabs.map((tab) => {
        const on = tab.id === active
        return (
          <Link
            key={tab.id}
            href={hrefFor(tab.id)}
            scroll={false}
            aria-current={on ? 'page' : undefined}
            onClick={(e) => {
              if (!isPlainClick(e)) return
              e.preventDefault()
              if (!on) onSelect(tab.id)
            }}
            className={`whitespace-nowrap rounded-t-xl px-4 pb-3 pt-2.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-current ${
              on ? activeClassName : 'hover:bg-white/45'
            }`}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
