// src/components/classes/shared/KebabMenu.tsx
// A ⋮ menu for a row or a card: the post's Edit/Delete and the student's
// account actions. It renders in a body portal, so a scroll container (the
// People table) never clips it, flips up when there is no room below, and
// works from the keyboard (arrows, Home/End, Escape; Tab hands focus back).
'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType, type SVGProps } from 'react'
import { createPortal } from 'react-dom'
import { EllipsisVerticalIcon } from '@heroicons/react/24/outline'

export interface KebabItem {
  key: string
  label: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  /** Rose, for what removes something. */
  tone?: 'default' | 'danger'
  /** Draws a rule above this item. */
  separatorBefore?: boolean
  onSelect: () => void
}

interface KebabMenuProps {
  /** Read out on the trigger and the menu, e.g. "Options for Lina Farouk". */
  label: string
  items: KebabItem[]
  /** A request for this row is in flight: the trigger spins and cannot be opened. */
  busy?: boolean
  width?: number
  className?: string
}

const ITEM_BASE =
  'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500'

export default function KebabMenu({ label, items, busy = false, width = 208, className = '' }: KebabMenuProps) {
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
    const height = menuRef.current?.offsetHeight ?? 240
    const upward = rect.bottom + 4 + height > window.innerHeight && rect.top - 4 - height > 0
    setPosition({
      top: upward ? rect.top - 4 - height : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
    })
  }, [open, width])

  // Focus the first item once the menu is placed (a hidden menu cannot take focus).
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
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
    const index = nodes.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      nodes[(index + 1) % nodes.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      nodes[(index - 1 + nodes.length) % nodes.length]?.focus()
    } else if (e.key === 'Home') {
      e.preventDefault()
      nodes[0]?.focus()
    } else if (e.key === 'End') {
      e.preventDefault()
      nodes[nodes.length - 1]?.focus()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      close(true)
    }
  }

  if (items.length === 0) return null

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        className={`flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-wait disabled:opacity-50 ${className}`}
      >
        {busy ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500" aria-hidden="true" />
        ) : (
          <EllipsisVerticalIcon className="h-5 w-5" />
        )}
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
              width,
              visibility: position ? 'visible' : 'hidden',
            }}
            className="z-[70] rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
          >
            {items.map((item) => {
              const Icon = item.icon
              return (
                <div key={item.key} className={item.separatorBefore ? 'mt-1 border-t border-slate-100 pt-1' : ''}>
                  <button
                    type="button"
                    role="menuitem"
                    tabIndex={-1}
                    onClick={() => {
                      close()
                      item.onSelect()
                    }}
                    className={`${ITEM_BASE} ${item.tone === 'danger' ? 'text-rose-700 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    {Icon && <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />}
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
