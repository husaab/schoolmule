import { describe, expect, it } from 'vitest'
import { isAvatarSpec } from './avatar'
import { drawnAvatar, studentAvatar } from './studentAvatar'

const girls = ['Fatima', 'Zahraa', 'Maryam', 'Zeinab', 'Batoul', 'Noor', 'Emily'].flatMap((first) =>
  Array.from({ length: 30 }, (_, i) => `${first} Example ${i}`),
)
const boys = ['Ali', 'Mohamad', 'Hussein', 'Jawad', 'Abdulrahman', 'Adam', 'William'].flatMap((first) =>
  Array.from({ length: 30 }, (_, i) => `${first} Example ${i}`),
)

describe('studentAvatar', () => {
  it('gives a girl the hijab and a boy short hair', () => {
    for (const name of girls) expect(studentAvatar({ name })?.style).toBe('hijab')
    for (const name of boys) expect(studentAvatar({ name })?.style).toBe('short')
  })

  it('gives a student the same avatar every time', () => {
    expect(studentAvatar({ name: 'Fatima Example' })).toEqual(studentAvatar({ name: 'Fatima Example' }))
  })

  it('ignores case and stray spaces in the name', () => {
    expect(studentAvatar({ name: '  fatima   EXAMPLE ' })).toEqual(studentAvatar({ name: 'Fatima Example' }))
  })

  it('draws only valid avatars, spread across skin tones and backgrounds', () => {
    const avatars = [...girls, ...boys].map((name) => studentAvatar({ name })!)
    for (const avatar of avatars) expect(isAvatarSpec(avatar)).toBe(true)
    expect(new Set(avatars.map((a) => a.skin)).size).toBe(5)
    expect(new Set(avatars.map((a) => a.bg)).size).toBe(8)
  })

  it('shows the neutral avatar when the name does not say girl or boy', () => {
    expect(studentAvatar({ name: 'Test Student' })).toBeNull()
    expect(studentAvatar({ name: '' })).toBeNull()
    expect(studentAvatar({ name: null })).toBeNull()
  })

  it('keeps an avatar that was picked for the student', () => {
    const picked = { style: 'kufi', skin: 3, bg: 6 } as const
    expect(studentAvatar({ name: 'Fatima Example', avatar: picked })).toEqual(picked)
    expect(studentAvatar({ name: 'Test Student', avatar: picked })).toEqual(picked)
  })

  it('ignores an invalid pick', () => {
    expect(studentAvatar({ name: 'Ali Example', avatar: { style: 'mohawk' } })).toEqual(studentAvatar({ name: 'Ali Example' }))
    expect(studentAvatar({ name: 'Ali Example', avatar: null })?.style).toBe('short')
  })

  it('draws by the same rule for anyone, so a teacher or parent gets one too', () => {
    expect(drawnAvatar('Maryam Example')?.style).toBe('hijab')
    expect(drawnAvatar('Hassan Example')?.style).toBe('short')
    expect(drawnAvatar('Hassan Example')).toEqual(drawnAvatar(' hassan  EXAMPLE'))
    expect(drawnAvatar('Fatima Example')).toEqual(studentAvatar({ name: 'Fatima Example' }))
    expect(drawnAvatar('Teacher One')).toBeNull()
    expect(drawnAvatar(null)).toBeNull()
  })
})
