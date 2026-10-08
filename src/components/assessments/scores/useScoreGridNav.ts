'use client'

// Arrow keys move between score inputs; Enter moves down. Cells are found by
// id (`${gridId}-${row}-${col}`), so an excluded cell, which has no input,
// simply keeps focus where it is.

import type { KeyboardEvent } from 'react'

export function useScoreGridNav(gridId: string, rowCount: number, colCount: number) {
  const inputId = (row: number, col: number) => `${gridId}-${row}-${col}`

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>, row: number, col: number) => {
    const maxRow = rowCount - 1
    const maxCol = colCount - 1
    let nextRow = row
    let nextCol = col

    switch (e.key) {
      case 'ArrowUp':
        nextRow = Math.max(0, row - 1)
        break
      case 'ArrowDown':
      case 'Enter':
        nextRow = Math.min(maxRow, row + 1)
        break
      case 'ArrowLeft':
        nextCol = Math.max(0, col - 1)
        break
      case 'ArrowRight':
        nextCol = Math.min(maxCol, col + 1)
        break
      default:
        return
    }
    e.preventDefault()
    if (nextRow === row && nextCol === col) return

    const next = document.getElementById(inputId(nextRow, nextCol)) as HTMLInputElement | null
    if (next) {
      next.focus()
      next.select()
    }
  }

  return { inputId, onKeyDown }
}
