// src/components/classes/home/ClassCardMenu.tsx
// A class card's ⋮ menu (the Teacher-Home board): Change banner & color,
// Class settings, Copy to next term, Message all parents, then Archive class.
// It renders in a body portal so the card grid never clips it, and works
// from the keyboard. The trigger sits beside the card's link, never inside
// it, and stops its click so opening the menu never opens the class.
'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { classHref } from '@/lib/classroomRoutes'

interface ClassCardMenuProps {
  classId: string
  /** "Science, Grade 5 · 22 students", read out on the trigger. */
  label: string
  /** False when the viewer may not change the class (a past school year, for teachers). */
  canWrite: boolean
  onChangeBanner: () => void
  onCopy: () => void
  onArchive: () => void
  className?: string
}

const MENU_WIDTH = 240

const itemBase = 'block w-full cursor-pointer rounded-[10px] px-3 py-2.5 text-left text-sm outline-none transition-colors'
const item = `${itemBase} text-slate-900 hover:bg-slate-50 focus-visible:bg-slate-100`
const dangerItem = `${itemBase} text-rose-700 hover:bg-rose-50 focus-visible:bg-rose-50`

export default function ClassCardMenu({
  classId,
  label,
  canWrite,
  onChangeBanner,
  onCopy,
  onArchive,
  className = '',
}: ClassCardMenuProps) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback((refocus = false) => {
    setOpen(false)
    setPosition(null)
    if (refocus) triggerRef.current?.focus()
  }, [])

  // Under the trigger, right-aligned; flipped up when there is no room below.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const height = menuRef.current?.offsetHeight ?? 260
    const upward = rect.bottom + 6 + height > window.innerHeight && rect.top - 6 - height > 0
    setPosition({
      top: upward ? rect.top - 6 - height : rect.bottom + 6,
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    })
  }, [open])

  // Focus the first item once the menu is placed (a hidden menu can't take focus).
  useEffect(() => {
    if (open && position) menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
  }, [open, position])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node
      if (!menuRef.current?.contains(target) && !triggerRef.current?.contains(target)) close()
    }
    const onScrollOrResize = () => close()
    document.addEventListener('mousedown', onDown)
    window.addEventListener('resize', onScrollOrResize)
    window.addEventListener('scroll', onScrollOrResize, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      window.removeEventListener('resize', onScrollOrResize)
      window.removeEventListener('scroll', onScrollOrResize, true)
    }
  }, [open, close])

  const onMenuKey = (e: React.KeyboardEvent) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(index + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(index - 1 + items.length) % items.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      items[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      items[items.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      close()
    }
  }

  const act = (fn: () => void) => () => {
    close()
    fn()
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          if (open) close()
          else setOpen(true)
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Options for ${label}`}
        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-[10px] border border-slate-200 bg-white text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 ${className}`}
      >
        <EllipsisVerticalIcon className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Options for ${label}`}
            onKeyDown={onMenuKey}
            style={{
              position: 'fixed',
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              width: MENU_WIDTH,
              visibility: position ? 'visible' : 'hidden',
            }}
            className="z-[70] flex flex-col rounded-[14px] border border-slate-200 bg-white p-1.5 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),0_4px_16px_-4px_rgba(0,0,0,0.08)]"
          >
            {canWrite && (
              <button type="button" role="menuitem" tabIndex={-1} onClick={act(onChangeBanner)} className={item}>
                Change banner &amp; color
              </button>
            )}
            <Link
              role="menuitem"
              tabIndex={-1}
              href={classHref(classId, 'settings')}
              onClick={() => close()}
              className={item}
            >
              Class settings
            </Link>
            {canWrite && (
              <button type="button" role="menuitem" tabIndex={-1} onClick={act(onCopy)} className={item}>
                Copy to next term
              </button>
            )}
            <Link
              role="menuitem"
              tabIndex={-1}
              href={classHref(classId, 'stream', { compose: '1' })}
              onClick={() => close()}
              className={item}
            >
              Message all parents
            </Link>
            {canWrite && (
              <>
                <div role="separator" className="mx-1.5 my-1 h-px bg-slate-100" />
                <button
                  type="button"
                  role="menuitem"
                  tabIndex={-1}
                  onClick={act(onArchive)}
                  className={dangerItem}
                >
                  Archive class
                </button>
              </>
            )}
          </div>,
          document.body,
        )}
    </>
  )
}
