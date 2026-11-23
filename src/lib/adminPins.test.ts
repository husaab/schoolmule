import { describe, it, expect } from 'vitest'
import { parsePins, pinnedTools, pinsKey, togglePin } from './adminPins'
import { adminToolsFor } from './adminTools'
import { PERMISSIONS, type AccessUser } from './permissions'

const fullAdmin: AccessUser = { role: 'ADMIN', isFullAdmin: true, permissions: [...PERMISSIONS], accessRole: null, teachesClasses: false }
const formsOnly: AccessUser = { role: 'ADMIN', isFullAdmin: false, permissions: ['forms'], accessRole: { id: 'r', name: 'Custom' }, teachesClasses: false }

describe('admin pins', () => {
  it('keys pins by account and school', () => {
    expect(pinsKey('u1', 'SCHOOL_A')).toBe('sm.adminPins:u1:SCHOOL_A')
    expect(pinsKey('u1', 'SCHOOL_B')).not.toBe(pinsKey('u1', 'SCHOOL_A'))
    expect(pinsKey(null, null)).toBe('sm.adminPins::')
  })

  it('reads saved pins and treats anything unreadable as none', () => {
    expect(parsePins(JSON.stringify(['/admin-panel/users', '/finance/tuition']))).toEqual(['/admin-panel/users', '/finance/tuition'])
    expect(parsePins(null)).toEqual([])
    expect(parsePins('not json')).toEqual([])
    expect(parsePins('{"a":1}')).toEqual([])
    expect(parsePins(JSON.stringify(['/a', 3, null, '/a']))).toEqual(['/a'])
  })

  it('adds a pin at the end and takes it off again', () => {
    const once = togglePin(['/admin-panel/users'], '/admin-panel/forms')
    expect(once).toEqual(['/admin-panel/users', '/admin-panel/forms'])
    expect(togglePin(once, '/admin-panel/users')).toEqual(['/admin-panel/forms'])
  })

  it('shows pinned tools in pin order and hides the ones the user can’t open', () => {
    const pins = ['/admin-panel/forms', '/admin-panel/users', '/gone']
    expect(pinnedTools(pins, adminToolsFor(fullAdmin)).map((t) => t.label)).toEqual(['Forms', 'Users'])
    expect(pinnedTools(pins, adminToolsFor(formsOnly)).map((t) => t.label)).toEqual(['Forms'])
  })
})
