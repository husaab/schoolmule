// src/components/progress-report/roster/RosterRowMenu.tsx
// The ⋯ menu on a progress reports row: the less frequent actions (download,
// email again, regenerate, delete). It renders in a body portal so the list
// never clips it, flips up near the bottom of the window, and takes arrow
// keys and Escape like the Student accounts menu.
'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { EllipsisHorizontalIcon } from '@heroicons/react/24/outline'

export interface RowMenuItem {
  key: string
  label: string
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  onSelect: () => void
  danger?: boolean
  /** Starts a new group (a rule above it). */
  separated?: boolean
}

const MENU_WIDTH = 216

export default function RosterRowMenu({ label, items }: { label: string; items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const close = useCallback((refocus = false) => {
    setOpen(false)
    setPosition(null)
    if (refocus) triggerRef.current?.focus()
  }, [])

  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const height = menuRef.current?.offsetHeight ?? 200
    const upward = rect.bottom + 4 + height > window.innerHeight && rect.top - 4 - height > 0
    setPosition({
      top: upward ? rect.top - 4 - height : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    })
  }, [open])

  useEffect(() => {
    if (open && position) menuRef.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus()
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
    const els = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
    const index = els.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      els[(index + 1) % els.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      els[(index - 1 + els.length) % els.length]?.focus()
    } else if (e.key === 'Tab') {
      close()
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={`flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 ${
          open ? 'bg-slate-100 text-slate-700' : ''
        }`}
      >
        <EllipsisHorizontalIcon className="h-5 w-5" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKey}
            style={{
              position: 'fixed',
              top: position?.top ?? -9999,
              left: position?.left ?? -9999,
              width: MENU_WIDTH,
              visibility: position ? 'visible' : 'hidden',
            }}
            className="z-[70] rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          >
            {items.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.key} className={item.separated ? 'mt-1 border-t border-slate-100 pt-1' : ''}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      close()
                      item.onSelect()
                    }}
                    className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 ${
                      item.danger ? 'text-rose-700 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                    {item.label}
                  </button>
                </div>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}
