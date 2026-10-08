'use client'

// A small dropdown menu behind a trigger button (kebab by default). Closes on
// an outside click, Escape, or after an item is chosen.

import React, { useEffect, useRef, useState } from 'react'
import { CheckIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'

export interface MenuItem {
  key: string
  label: string
  /** One quiet line under the label saying what the item does. */
  description?: string
  icon?: React.ComponentType<{ className?: string }>
  onSelect: () => void
  danger?: boolean
  disabled?: boolean
  /** Shows a check mark (for "current value" menus). */
  checked?: boolean
}

interface MenuButtonProps {
  items: MenuItem[]
  /** Accessible name for the trigger. */
  label: string
  /** Custom trigger content; a kebab icon when omitted. */
  trigger?: React.ReactNode
  triggerClassName?: string
  align?: 'left' | 'right'
  /** Optional heading shown above the items. */
  heading?: string
}

const defaultTrigger =
  'rounded-xl p-2 text-slate-400 transition-colors hover:bg-white hover:text-slate-600 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500'

const MenuButton: React.FC<MenuButtonProps> = ({ items, label, trigger, triggerClassName, align = 'right', heading }) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement | null>(null)
  const described = items.some((i) => i.description)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey, true)
    }
  }, [open])

  return (
    <div ref={ref} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpen((v) => !v)}
        className={triggerClassName ?? defaultTrigger}
      >
        {trigger ?? <EllipsisVerticalIcon className="h-5 w-5" />}
      </button>
      {open && (
        <div
          role="menu"
          className={`absolute top-full z-40 mt-1 rounded-xl border border-slate-200 bg-white p-1 shadow-lg ${described ? 'w-72' : 'w-56'} ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {heading && <p className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">{heading}</p>}
          {items.map((item) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onSelect()
              }}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                item.danger ? 'text-rose-700 hover:bg-rose-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {item.icon ? <item.icon className="h-4 w-4 shrink-0" /> : null}
              <span className="flex-1 min-w-0">
                <span className="block font-medium">{item.label}</span>
                {item.description && <span className="block text-xs text-slate-500">{item.description}</span>}
              </span>
              {item.checked && <CheckIcon className="h-4 w-4 shrink-0 text-cyan-600" aria-label="Current" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default MenuButton
