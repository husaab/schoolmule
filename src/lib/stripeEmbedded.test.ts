import { describe, it, expect } from 'vitest'
import { canPayHere, publishableKeyMode } from './stripeEmbedded'

describe('paying inside our own page', () => {
  it('reads the key’s mode, and never takes a secret key', () => {
    expect(publishableKeyMode('pk_test_abc')).toBe('test')
    expect(publishableKeyMode('pk_live_abc')).toBe('live')
    expect(publishableKeyMode('sk_live_abc')).toBeNull()
    expect(publishableKeyMode('')).toBeNull()
    expect(publishableKeyMode(undefined)).toBeNull()
  })

  it('only when the key is for the mode the server takes payments in', () => {
    expect(canPayHere('pk_live_abc', false)).toBe(true)
    expect(canPayHere('pk_test_abc', true)).toBe(true)
    expect(canPayHere('pk_test_abc', false)).toBe(false)
    expect(canPayHere('pk_live_abc', true)).toBe(false)
    expect(canPayHere('pk_live_abc', null)).toBe(false)
    expect(canPayHere('', false)).toBe(false)
  })
})
