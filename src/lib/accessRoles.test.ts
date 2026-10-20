import { describe, it, expect } from 'vitest'
import {
  groupPermissions,
  holdersLabel,
  orderedSelection,
  permissionCountLabel,
  permissionLabels,
  roleNameProblem,
} from './accessRoles'

const groups = [
  { id: 'academics', label: 'Academics' },
  { id: 'people', label: 'People' },
  { id: 'empty', label: 'Nothing here' },
]
const permissions = [
  { key: 'classes.all', group: 'academics', label: 'All classes', description: '' },
  { key: 'students', group: 'people', label: 'Students', description: '' },
  { key: 'analytics', group: 'academics', label: 'Analytics', description: '' },
  { key: 'future.key', group: 'later', label: 'Something new', description: '' },
]

describe('groupPermissions', () => {
  it("keeps the server's group order, drops empty groups, and still shows an unknown group", () => {
    const sections = groupPermissions(groups, permissions)
    expect(sections.map((s) => s.id)).toEqual(['academics', 'people', 'later'])
    expect(sections[0].items.map((p) => p.key)).toEqual(['classes.all', 'analytics'])
    expect(sections[2].label).toBe('later')
  })
})

describe('orderedSelection', () => {
  it('returns the catalog order and only keys the catalog knows', () => {
    expect(orderedSelection(permissions, new Set(['analytics', 'nope', 'classes.all']))).toEqual(['classes.all', 'analytics'])
  })
})

describe('labels', () => {
  it('names keys in catalog order and keeps unknown ones visible', () => {
    expect(permissionLabels(permissions, ['students', 'classes.all', 'mystery'])).toEqual(['All classes', 'Students', 'mystery'])
  })
  it('counts permissions and holders in words', () => {
    expect(permissionCountLabel(0)).toBe('No permissions')
    expect(permissionCountLabel(1)).toBe('1 permission')
    expect(permissionCountLabel(11)).toBe('11 permissions')
    expect(holdersLabel(0)).toBe('Nobody')
    expect(holdersLabel(1)).toBe('1 person')
    expect(holdersLabel(3)).toBe('3 people')
  })
})

describe('roleNameProblem', () => {
  it('needs a name, refuses the built-in names and duplicates (any case)', () => {
    expect(roleNameProblem('  ', [])).toMatch(/name/)
    expect(roleNameProblem('Teacher', [])).toMatch(/built-in/)
    expect(roleNameProblem('ADMINISTRATOR', [])).toMatch(/built-in/)
    expect(roleNameProblem('office staff', ['Office Staff'])).toMatch(/already/)
    expect(roleNameProblem('x'.repeat(61), [])).toMatch(/60/)
    expect(roleNameProblem('Office Staff', ['Registrar'])).toBeNull()
  })
})
