// When Enter sends a chat message. On a computer, Enter sends and Shift+Enter
// breaks a line. A phone keyboard has no Shift+Enter, so there Return breaks
// a line and the Send button sends: otherwise a parent who types "Salam," and
// presses Return to start the next line sends the greeting on its own (and
// the teacher's email digest can go out holding only that).

type EnterKey = Pick<KeyboardEvent, 'key' | 'shiftKey' | 'metaKey' | 'ctrlKey' | 'isComposing'>

/** True on a touch-first device (phone, tablet), whose on-screen Return key means "new line". */
export const isTouchKeyboard = (): boolean =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(hover: none) and (pointer: coarse)').matches

/** Cmd/Ctrl+Enter sends everywhere; the Enter that ends an IME composition never does. */
export const shouldSendOnKey = (e: EnterKey, touch: boolean): boolean => {
  if (e.key !== 'Enter' || e.isComposing) return false
  if (e.metaKey || e.ctrlKey) return true
  return !touch && !e.shiftKey
}
