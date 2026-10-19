// src/components/studentAccounts/StudentAccountActionsMenu.tsx
// The ⋮ menu on a Student accounts row. It lists only the actions the server
// would accept for that row (lib/studentAccounts#rowActions) and renders in a
// body portal, so the table's scroll container never clips it.
'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArchiveBoxArrowDownIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  KeyIcon,
  LinkIcon,
  LinkSlashIcon,
  NoSymbolIcon,
  PaperAirplaneIcon,
  PencilSquareIcon,
  PrinterIcon,
  TrashIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline'
import type { ClassroomSettings, StudentAccountRow } from '@/services/types/studentAccount'
import { ROW_ACTION_LABELS, rowActions, type RowAction } from '@/lib/studentAccounts'

const ICONS: Record<RowAction, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  edit_email: PencilSquareIcon,
  invite: PaperAirplaneIcon,
  resend_invite: ArrowPathIcon,
  cancel_invite: XCircleIcon,
  reset_password: KeyIcon,
  print_qr: PrinterIcon,
  void_qr: NoSymbolIcon,
  view_as: EyeIcon,
  link: LinkIcon,
  unlink: LinkSlashIcon,
  archive: ArchiveBoxArrowDownIcon,
  unarchive: ArrowUturnLeftIcon,
  delete: TrashIcon,
}

// Menu sections, separated by a rule.
const GROUPS: RowAction[][] = [
  ['edit_email', 'invite', 'resend_invite', 'cancel_invite', 'reset_password'],
  ['print_qr', 'void_qr'],
  ['view_as'],
  ['link', 'unlink'],
  ['archive', 'unarchive', 'delete'],
]

const TONE: Partial<Record<RowAction, string>> = {
  cancel_invite: 'text-amber-700 hover:bg-amber-50',
  void_qr: 'text-amber-700 hover:bg-amber-50',
  unlink: 'text-amber-700 hover:bg-amber-50',
  archive: 'text-amber-700 hover:bg-amber-50',
  delete: 'text-rose-700 hover:bg-rose-50',
  view_as: 'text-violet-700 hover:bg-violet-50',
}

const MENU_WIDTH = 224

interface Props {
  row: StudentAccountRow
  /** The school's sign-in mode decides whether Reset password is offered. */
  settings: Pick<ClassroomSettings, 'studentSignIn'>
  onSelect: (action: RowAction) => void
  /** Rows with a request in flight show a disabled trigger. */
  busy?: boolean
}

export default function StudentAccountActionsMenu({ row, settings, onSelect, busy = false }: Props) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const actions = rowActions(row, settings)
  const groups = GROUPS.map((group) => group.filter((a) => actions.includes(a))).filter((g) => g.length > 0)

  const close = useCallback((refocus = false) => {
    setOpen(false)
    setPosition(null)
    if (refocus) triggerRef.current?.focus()
  }, [])

  // Place the menu under the trigger, right-aligned; flip up when there's no room.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const height = menuRef.current?.offsetHeight ?? 320
    const upward = rect.bottom + 4 + height > window.innerHeight && rect.top - 4 - height > 0
    setPosition({
      top: upward ? rect.top - 4 - height : rect.bottom + 4,
      left: Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8)),
    })
  }, [open])

  // Focus the first item once the menu is placed (a hidden menu can't take focus).
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
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]') ?? [])
    const index = items.indexOf(document.activeElement as HTMLButtonElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      items[(index + 1) % items.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      items[(index - 1 + items.length) % items.length]?.focus()
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
        disabled={busy}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account options for ${row.name}`}
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-wait disabled:opacity-50"
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
            aria-label={`Account options for ${row.name}`}
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
            {groups.map((group, gi) => (
              <div key={group.join()} className={gi > 0 ? 'mt-1 border-t border-slate-100 pt-1' : ''}>
                {group.map((action) => {
                  const Icon = ICONS[action]
                  return (
                    <button
                      key={action}
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        close()
                        onSelect(action)
                      }}
                      className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-500 ${
                        TONE[action] ?? 'text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0 opacity-70" aria-hidden="true" />
                      {ROW_ACTION_LABELS[action]}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>,
          document.body,
        )}
    </>
  )
}
