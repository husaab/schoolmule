'use client'

import React, { useEffect, useState } from 'react'
import {
  ALL_CHILDREN,
  useSelectedChildStore,
  useVisibleChildren,
} from '@/store/useSelectedChildStore'
import { childColor, childInitial } from './childColors'
import { childSectionId } from './ChildSections'

/**
 * Floating avatar dock on the right edge (desktop, "All children" mode):
 * one avatar per child; clicking scrolls to that child's section, and a
 * scroll-spy highlights whichever section is currently in view.
 */
const ChildJumpNav: React.FC = () => {
  const visible = useVisibleChildren()
  const selectedChildId = useSelectedChildStore((s) => s.selectedChildId)
  const [activeId, setActiveId] = useState<string | null>(null)

  const show = selectedChildId === ALL_CHILDREN && visible.length > 1

  useEffect(() => {
    if (!show) return
    const elements = visible
      .map((c) => document.getElementById(childSectionId(c.studentId)))
      .filter((el): el is HTMLElement => el !== null)
    if (elements.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const inView = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (inView[0]) setActiveId(inView[0].target.id)
      },
      // A band around the upper-middle of the viewport decides the "current" section.
      { rootMargin: '-25% 0px -55% 0px' },
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [show, visible])

  if (!show) return null

  return (
    <nav
      aria-label="Jump to child"
      className="hidden lg:flex fixed right-4 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2 bg-white/80 backdrop-blur rounded-full border border-stone-200/70 shadow-md p-2"
    >
      {visible.map((child) => {
        const color = childColor(child.studentId)
        const active = activeId === childSectionId(child.studentId)
        return (
          <button
            key={child.studentId}
            title={child.name}
            onClick={() =>
              document
                .getElementById(childSectionId(child.studentId))
                ?.scrollIntoView({ behavior: 'smooth' })
            }
            className={`group relative w-9 h-9 rounded-full bg-gradient-to-br ${color.solid} flex items-center justify-center text-white text-xs font-semibold cursor-pointer transition-all duration-200 ${
              active ? 'scale-110 shadow-md' : 'opacity-45 hover:opacity-90'
            }`}
          >
            {childInitial(child.name)}
            {/* Name flyout on hover */}
            <span className="pointer-events-none absolute right-full mr-2 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {child.name}
            </span>
          </button>
        )
      })}
    </nav>
  )
}

export default ChildJumpNav
