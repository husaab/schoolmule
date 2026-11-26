import type React from 'react'

/**
 * The keyboard half of a group of buttons that act as radios: the arrow keys
 * (and Home / End) move the choice and the focus together, as they do for
 * native radio inputs. Each button passes its own position; with
 * `tabIndex={selected ? 0 : -1}` on the buttons, Tab then reaches the group
 * once, at the chosen option.
 */
export function onRadioKeyDown(event: React.KeyboardEvent<HTMLElement>, index: number, count: number, choose: (index: number) => void) {
  let next: number
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = (index + 1) % count
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      next = (index - 1 + count) % count
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = count - 1
      break
    default:
      return
  }
  event.preventDefault()
  choose(next)
  const radios = event.currentTarget.closest('[role="radiogroup"]')?.querySelectorAll<HTMLElement>('[role="radio"]')
  radios?.[next]?.focus()
}
