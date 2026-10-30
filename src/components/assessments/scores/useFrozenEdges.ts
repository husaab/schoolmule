'use client'

// A score grid freezes its header row, pins the Student column and (from
// tablet width up) the total column. This keeps the grid's box in step with
// those edges:
// - scroll-padding, so arrowing onto a cell hidden beneath an edge scrolls the
//   cell clear instead of leaving the focus out of sight;
// - --frozen-travel, how far the header row can ride down a grid that follows
//   the page's scroll (`frozen-grid` in globals.css) before the last row.

import { useEffect } from 'react'

/** `box`: the grid's scroll box, from a callback ref (a modal mounts it after opening). */
export function useFrozenEdges(box: HTMLElement | null) {
  useEffect(() => {
    const table = box?.querySelector('table')
    const head = table?.querySelector('thead')
    const first = head?.querySelector('th')
    const last = head?.querySelector('th:last-child')
    if (!box || !table || !head || !first || !last) return
    const sync = () => {
      const { style } = box
      style.setProperty('scroll-padding-top', `${head.offsetHeight}px`)
      style.setProperty('scroll-padding-left', `${first.getBoundingClientRect().width}px`)
      // The total column is pinned only where it has a right offset (sm and up).
      const pinnedRight = getComputedStyle(last).right !== 'auto'
      style.setProperty('scroll-padding-right', pinnedRight ? `${last.getBoundingClientRect().width}px` : '0px')
      style.setProperty('--frozen-travel', `${Math.max(0, table.offsetHeight - head.offsetHeight)}px`)
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(table)
    observer.observe(head)
    observer.observe(first)
    return () => observer.disconnect()
  }, [box])
}
