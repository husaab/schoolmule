import { describe, expect, it } from 'vitest'
import { isAvatarSpec } from './avatar'
import { studentAvatar } from './studentAvatar'

const names = Array.from({ length: 300 }, (_, i) => `Test Student ${i}`)

describe('studentAvatar', () => {
  it('gives a student the same avatar every time', () => {
    expect(studentAvatar({ name: 'Test Student 7' })).toEqual(studentAvatar({ name: 'Test Student 7' }))
  })

  it('ignores case and stray spaces in the name', () => {
    expect(studentAvatar({ name: '  test   STUDENT 7 ' })).toEqual(studentAvatar({ name: 'Test Student 7' }))
  })

  it('draws only valid hijab or short-hair avatars', () => {
    for (const name of names) {
      const avatar = studentAvatar({ name })
      expect(isAvatarSpec(avatar)).toBe(true)
      expect(['hijab', 'short']).toContain(avatar.style)
    }
  })

  it('spreads styles, skin tones and backgrounds across a school', () => {
    const avatars = names.map((name) => studentAvatar({ name }))
    const hijabs = avatars.filter((a) => a.style === 'hijab').length
    expect(hijabs).toBeGreaterThan(100)
    expect(hijabs).toBeLessThan(200)
    expect(new Set(avatars.map((a) => a.skin)).size).toBe(5)
    expect(new Set(avatars.map((a) => a.bg)).size).toBe(8)
  })

  it('keeps an avatar that was picked for the student', () => {
    const picked = { style: 'kufi', skin: 3, bg: 6 } as const
    expect(studentAvatar({ name: 'Test Student 7', avatar: picked })).toEqual(picked)
  })

  it('draws one for a missing or invalid pick, and for a missing name', () => {
    expect(isAvatarSpec(studentAvatar({ name: 'Test Student 7', avatar: null }))).toBe(true)
    expect(studentAvatar({ name: 'Test Student 7', avatar: { style: 'mohawk' } })).toEqual(studentAvatar({ name: 'Test Student 7' }))
    expect(isAvatarSpec(studentAvatar({ name: null }))).toBe(true)
  })
})
