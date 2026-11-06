'use client'

// The label box for a modified mark. Rendered in a portal with fixed
// positioning, so a grid's scroll box can't clip it on the bottom row. Escape,
// a press outside and scrolling the page behind it all cancel.

import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { inputClass } from '@/components/shared/modalKit'
import { MODIFIED_LABEL_MAX, normalizeModifiedLabel, validateModifiedLabel } from '@/lib/modifiedMark'

export interface PopoverAnchor {
  top: number
  bottom: number
  right: number
}

interface ModifiedLabelPopoverProps {
  anchor: PopoverAnchor
  initialLabel: string
  suggestions: string[]
  busy: boolean
  onSave: (label: string | null) => void
  onCancel: () => void
}

const WIDTH = 300
const GAP = 6
const EST_HEIGHT = 300

const ModifiedLabelPopover: React.FC<ModifiedLabelPopoverProps> = ({ anchor, initialLabel, suggestions, busy, onSave, onCancel }) => {
  const [label, setLabel] = useState(initialLabel)
  const boxRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const error = validateModifiedLabel(label)

  useEffect(() => {
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [])

  useEffect(() => {
    // Captured, and stopped here, so Escape closes this box and not the window under it.
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.stopPropagation()
      onCancel()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) onCancel()
    }
    // Not on a touch screen: focusing the field there scrolls the page for the keyboard.
    const onScroll = (e: Event) => {
      if (!boxRef.current?.contains(e.target as Node) && window.matchMedia('(pointer: fine)').matches) onCancel()
    }
    document.addEventListener('keydown', onKey, true)
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [onCancel])

  const vw = typeof window === 'undefined' ? 1024 : window.innerWidth
  const vh = typeof window === 'undefined' ? 768 : window.innerHeight
  const width = Math.min(WIDTH, vw - 16)
  const left = Math.min(Math.max(anchor.right - width, 8), vw - width - 8)
  const above = anchor.bottom + GAP + EST_HEIGHT > vh && anchor.top > vh - anchor.bottom
  const style: React.CSSProperties = above
    ? { left, bottom: vh - anchor.top + GAP, width }
    : { left, top: anchor.bottom + GAP, width }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!error && !busy) onSave(normalizeModifiedLabel(label))
  }

  return createPortal(
    <form
      ref={boxRef}
      role="dialog"
      aria-label="Modified assessment"
      onSubmit={submit}
      onClick={(e) => e.stopPropagation()}
      style={style}
      className="fixed z-[70] flex flex-col gap-2.5 rounded-xl border border-slate-200 bg-white p-4 text-left shadow-lg"
    >
      <p className="text-sm font-semibold text-slate-900">Modified assessment</p>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="modified-label" className="text-xs font-medium text-slate-600">
          What was different about this test?
        </label>
        <input
          id="modified-label"
          ref={inputRef}
          value={label}
          maxLength={MODIFIED_LABEL_MAX}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={error ? 'modified-label-error' : undefined}
          autoComplete="off"
          onChange={(e) => setLabel(e.target.value)}
          className={inputClass}
        />
      </div>
      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setLabel(s)
                inputRef.current?.focus()
              }}
              className="cursor-pointer rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-xs text-violet-700 hover:bg-violet-100"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {error && (
        <p id="modified-label-error" className="text-xs font-medium text-rose-700">
          {error}
        </p>
      )}
      <p className="text-xs leading-relaxed text-slate-500">
        Families see this beside the mark. Describe the test, not the student. Same test with extra time or read aloud? That isn&apos;t modified.
      </p>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="cursor-pointer rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100">
          Cancel
        </button>
        <button
          type="submit"
          disabled={Boolean(error) || busy}
          className="cursor-pointer rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Save
        </button>
      </div>
    </form>,
    document.body,
  )
}

export default ModifiedLabelPopover
