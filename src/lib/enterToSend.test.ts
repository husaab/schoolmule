import { describe, it, expect } from 'vitest'
import { shouldSendOnKey } from './enterToSend'

const key = (over: Partial<Parameters<typeof shouldSendOnKey>[0]> = {}) =>
  ({ key: 'Enter', shiftKey: false, metaKey: false, ctrlKey: false, isComposing: false, ...over })

describe('Enter in a message box', () => {
  it('sends on a computer, and Shift+Enter breaks a line', () => {
    expect(shouldSendOnKey(key(), false)).toBe(true)
    expect(shouldSendOnKey(key({ shiftKey: true }), false)).toBe(false)
  })

  it('breaks a line on a phone, where there is no Shift+Enter', () => {
    expect(shouldSendOnKey(key(), true)).toBe(false)
  })

  it('sends on Cmd/Ctrl+Enter everywhere', () => {
    expect(shouldSendOnKey(key({ metaKey: true }), true)).toBe(true)
    expect(shouldSendOnKey(key({ ctrlKey: true }), false)).toBe(true)
  })

  it('never sends while a keyboard is composing, or on any other key', () => {
    expect(shouldSendOnKey(key({ isComposing: true }), false)).toBe(false)
    expect(shouldSendOnKey(key({ key: 'a' }), false)).toBe(false)
  })
})
