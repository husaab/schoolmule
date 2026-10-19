// src/components/classes/classwork/CreateMenu.tsx
// Classwork's Create button and its menu (the Teacher-Classwork board):
// Assessment first, then Assignment, Quiz (once quizzes ship), Material and
// Announcement (the Stream's composer), a rule, then Topic and "Copy from
// another class". Keyboard: arrows move, Escape closes.
'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowPathIcon, FolderIcon, MegaphoneIcon, PlusIcon } from '@heroicons/react/24/outline'
import { classHref, newItemHref } from '@/lib/classroomRoutes'
import type { ItemKind } from '@/services/types/classwork'
import { KindTile } from './ItemRow'

interface CreateMenuProps {
  classId: string
  /** The topic the list is filtered to: new work starts in it. */
  topicId?: string | null
  onNewTopic: () => void
  onCopy: () => void
}

const KIND_ROWS: { kind: ItemKind; title: string; detail: string }[] = [
  { kind: 'assessment', title: 'Assessment', detail: 'A test or task you grade. Nothing to turn in online' },
  { kind: 'assignment', title: 'Assignment', detail: 'Students turn something in online' },
  { kind: 'quiz', title: 'Quiz', detail: 'Online questions, graded for you' },
  { kind: 'material', title: 'Material', detail: 'A file or link to read. No grade' },
]

const ROW =
  'flex w-full cursor-pointer items-center gap-3 rounded-xl p-3 text-left text-slate-900 transition-colors hover:bg-slate-50 focus:bg-slate-50 focus:outline-none'

export default function CreateMenu({ classId, topicId = null, onNewTopic, onCopy }: CreateMenuProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const close = useCallback((refocus = false) => {
    setOpen(false)
    if (refocus) triggerRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open, close])

  const onKey = (e: React.KeyboardEvent) => {
    const nodes = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const i = nodes.indexOf(document.activeElement as HTMLElement)
    if (e.key === 'Escape') {
      e.preventDefault()
      close(true)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      nodes[(i + 1) % nodes.length]?.focus()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      nodes[(i - 1 + nodes.length) % nodes.length]?.focus()
    } else if (e.key === 'Tab') {
      close()
    }
  }

  const go = (href: string) => {
    close()
    router.push(href)
  }

  const rows = KIND_ROWS

  return (
    <div ref={ref} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (open ? close() : setOpen(true))}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex cursor-pointer items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 px-[18px] py-[11px] text-[15px] font-medium text-white shadow-sm transition-colors hover:from-cyan-600 hover:to-teal-600"
      >
        <PlusIcon className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />
        Create
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="Create"
          onKeyDown={onKey}
          className="absolute left-0 top-[calc(100%+8px)] z-30 flex w-[min(336px,calc(100vw-32px))] flex-col rounded-2xl border border-slate-200 bg-white p-2 shadow-[0_12px_40px_-8px_rgba(0,0,0,0.18),0_4px_16px_-4px_rgba(0,0,0,0.08)]"
        >
          {rows.map((r) => (
            <button
              key={r.kind}
              type="button"
              role="menuitem"
              tabIndex={-1}
              onClick={() => go(newItemHref(classId, r.kind, { topic: topicId }))}
              className={ROW}
            >
              <KindTile kind={r.kind} shape="square" size={38} />
              <span className="flex flex-col">
                <span className="text-[15px] font-medium">{r.title}</span>
                <span className="text-[13px] text-slate-500">{r.detail}</span>
              </span>
            </button>
          ))}
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => go(classHref(classId, 'stream', { compose: '1' }))}
            className={ROW}
          >
            <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] bg-amber-100" aria-hidden="true">
              <MegaphoneIcon className="h-5 w-5 text-amber-800" />
            </span>
            <span className="flex flex-col">
              <span className="text-[15px] font-medium">Announcement</span>
              <span className="text-[13px] text-slate-500">Post to the Stream and email everyone</span>
            </span>
          </button>
          <div className="mx-2 my-1.5 h-px bg-slate-100" />
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              close()
              onNewTopic()
            }}
            className={`${ROW} !py-2.5 text-sm !text-slate-700`}
          >
            <FolderIcon className="mx-[9px] h-5 w-5 text-slate-500" aria-hidden="true" />
            Topic
          </button>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            onClick={() => {
              close()
              onCopy()
            }}
            className={`${ROW} !py-2.5 text-sm !text-slate-700`}
          >
            <ArrowPathIcon className="mx-[9px] h-5 w-5 text-slate-500" aria-hidden="true" />
            Copy from another class
          </button>
        </div>
      )}
    </div>
  )
}
