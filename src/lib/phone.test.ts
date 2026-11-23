import { describe, expect, it } from 'vitest'
import { badPhone, cleanPhone, telHref } from './phone'

describe('phone numbers', () => {
  it('checks a number as the server does', () => {
    expect(cleanPhone(' 416  555-0100 ')).toBe('416 555-0100')
    expect(cleanPhone('+1 (416) 555-0100 ext. 12')).toBe('+1 (416) 555-0100 ext. 12')
    expect(cleanPhone('555-01')).toBeNull()
    expect(cleanPhone('call my cell')).toBeNull()
  })
  it('blank is fine, junk is not', () => {
    expect(badPhone('')).toBe(false)
    expect(badPhone(null)).toBe(false)
    expect(badPhone('12')).toBe(true)
    expect(badPhone('416-555-0100')).toBe(false)
  })
  it('dials the digits', () => {
    expect(telHref('(905) 555-0199 x4')).toBe('tel:9055550199')
  })
})
