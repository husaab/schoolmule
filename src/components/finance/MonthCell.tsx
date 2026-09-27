'use client'

// One family-month in the grid: a chip coloured by status. The number is what
// matters for that status — paid months show what was paid (the invoiced
// amount), unpaid / partial / overdue months show what is still owed, a voided
// month shows its invoiced amount struck through.
//
// Hover or focus previews the CellPopover. A click (or Enter/Space) pins it
// open without opening the family drawer behind it; keyboard activation also
// moves focus into the popover so its links are reachable, and Escape returns
// focus to the chip.

import React, { useCallback, useEffect, useId, useRef, useState } from 'react'
import type { Cell } from '@/services/types/finance'
import CellPopover, { type AnchorRect } from './CellPopover'
import { STATUS_CHIP, formatMoney, monthLong, statusText } from './format'

interface MonthCellProps {
  cell: Cell
  month: string
  grantName: string
  /** Static chip without the popover (e.g. inside a tappable mobile card). */
  interactive?: boolean
}

const CLOSE_DELAY = 150

export function chipAmount(cell: Cell): string {
  switch (cell.status) {
    case 'none':
      return '—'
    case 'paid':
      return formatMoney(cell.invoiced)
    case 'partial':
    case 'overdue':
    case 'unpaid':
      return formatMoney(cell.balance)
    default:
      // voided — the chip style strikes it through
      return formatMoney(cell.invoiced)
  }
}

/** What the chip's number means, for screen readers. */
function chipDescription(cell: Cell): string {
  const amount = chipAmount(cell)
  switch (cell.status) {
    case 'none':
      return 'no invoice'
    case 'paid':
      return `${amount} paid`
    case 'partial':
      return `${amount} owed, partially paid`
    case 'unpaid':
      return `${amount} owed, unpaid`
    case 'overdue':
      return cell.daysOverdue > 0
        ? `${amount} owed, overdue ${cell.daysOverdue} ${cell.daysOverdue === 1 ? 'day' : 'days'}`
        : `${amount} owed, overdue`
    default:
      return `${amount} invoiced, voided`
  }
}

export const MonthChip = ({ cell }: { cell: Cell }) => (
  <span
    className={`flex w-full min-w-[84px] flex-col items-center rounded-lg px-2 py-1 leading-tight ${STATUS_CHIP[cell.status]}`}
  >
    <span className="text-[13px] font-semibold tabular-nums">{chipAmount(cell)}</span>
    {cell.status !== 'none' && <span className="text-[10px] font-medium opacity-90">{statusText(cell)}</span>}
  </span>
)

const MonthCell: React.FC<MonthCellProps> = ({ cell, month, grantName, interactive = true }) => {
  const popoverId = useId()
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const focusOnOpen = useRef(false)
  const [anchor, setAnchor] = useState<AnchorRect | null>(null)
  const [pinned, setPinned] = useState(false)

  const cancelClose = useCallback(() => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = null
  }, [])

  const measure = useCallback((): AnchorRect | null => {
    const el = buttonRef.current
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { top: r.top, bottom: r.bottom, left: r.left, width: r.width }
  }, [])

  const show = useCallback(() => {
    cancelClose()
    const rect = measure()
    if (rect) setAnchor(rect)
  }, [cancelClose, measure])

  const close = useCallback(
    (returnFocus = false) => {
      cancelClose()
      setAnchor(null)
      setPinned(false)
      if (returnFocus) buttonRef.current?.focus()
    },
    [cancelClose]
  )

  // Hover/focus previews close on leave; a pinned popover stays put.
  const hideSoon = useCallback(() => {
    if (pinned) return
    cancelClose()
    closeTimer.current = setTimeout(() => setAnchor(null), CLOSE_DELAY)
  }, [pinned, cancelClose])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (pinned) {
      close()
      return
    }
    // detail === 0: activated from the keyboard (Enter/Space).
    focusOnOpen.current = e.detail === 0
    cancelClose()
    const rect = measure()
    if (rect) setAnchor(rect)
    setPinned(true)
  }

  // Keyboard-pinned: move focus into the popover once it has rendered.
  useEffect(() => {
    if (!pinned || !anchor || !focusOnOpen.current) return
    focusOnOpen.current = false
    popoverRef.current?.focus()
  }, [pinned, anchor])

  // Fixed positioning goes stale when the page scrolls; close instead (but
  // not when the popover's own content scrolls). Escape closes; a click
  // outside closes a pinned popover.
  useEffect(() => {
    if (!anchor) return
    const inside = (target: EventTarget | null) =>
      target instanceof Node && (!!popoverRef.current?.contains(target) || !!buttonRef.current?.contains(target))
    const onScroll = (e: Event) => {
      if (!inside(e.target)) close()
    }
    const onResize = () => close()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(pinned)
    }
    const onDown = (e: MouseEvent) => {
      if (pinned && !inside(e.target)) close()
    }
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [anchor, pinned, close])

  useEffect(() => cancelClose, [cancelClose])

  if (!interactive) return <MonthChip cell={cell} />

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-describedby={anchor && !pinned ? popoverId : undefined}
        aria-expanded={pinned}
        aria-controls={pinned ? popoverId : undefined}
        aria-label={`${monthLong(month)}: ${chipDescription(cell)}`}
        onMouseEnter={show}
        onMouseLeave={hideSoon}
        onFocus={() => {
          if (!pinned) show()
        }}
        onBlur={hideSoon}
        onClick={handleClick}
        className="block w-full cursor-pointer rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500"
      >
        <MonthChip cell={cell} />
      </button>
      {anchor && (
        <CellPopover
          id={popoverId}
          containerRef={popoverRef}
          pinned={pinned}
          cell={cell}
          month={month}
          grantName={grantName}
          anchor={anchor}
          onMouseEnter={cancelClose}
          onMouseLeave={hideSoon}
          onRequestClose={close}
        />
      )}
    </>
  )
}

export default MonthCell
