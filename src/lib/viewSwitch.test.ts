import { describe, it, expect } from 'vitest'
import { canSwitchViews, otherViewFor, viewLabelFor, landingPathFor, switchFlashFor, type ViewUser } from './viewSwitch'

const teacherOnly: ViewUser = { role: 'TEACHER', baseRole: 'TEACHER', roles: ['TEACHER'] }
const teacherParent: ViewUser = { role: 'TEACHER', baseRole: 'TEACHER', roles: ['TEACHER', 'PARENT'] }
const inParentView: ViewUser = { role: 'PARENT', baseRole: 'TEACHER', roles: ['TEACHER', 'PARENT'] }
const adminParent: ViewUser = { role: 'ADMIN', baseRole: 'ADMIN', roles: ['ADMIN', 'PARENT'] }
const adminInParentView: ViewUser = { role: 'PARENT', baseRole: 'ADMIN', roles: ['ADMIN', 'PARENT'] }
const plainParent: ViewUser = { role: 'PARENT', baseRole: 'PARENT', roles: ['PARENT'] }
// A persisted user from before the claims existed carries neither field.
const legacy: ViewUser = { role: 'TEACHER' }

describe('canSwitchViews', () => {
  it('is true only when the account holds more than one view', () => {
    expect(canSwitchViews(teacherParent)).toBe(true)
    expect(canSwitchViews(inParentView)).toBe(true)
    expect(canSwitchViews(adminParent)).toBe(true)
    expect(canSwitchViews(teacherOnly)).toBe(false)
    expect(canSwitchViews(plainParent)).toBe(false)
    expect(canSwitchViews(legacy)).toBe(false)
  })
})

describe('otherViewFor', () => {
  it('names the view the user is not in', () => {
    expect(otherViewFor(teacherParent)).toBe('PARENT')
    expect(otherViewFor(inParentView)).toBe('TEACHER')
    expect(otherViewFor(adminInParentView)).toBe('ADMIN')
  })
  it('is null when there is nothing to switch to', () => {
    expect(otherViewFor(teacherOnly)).toBeNull()
    expect(otherViewFor(legacy)).toBeNull()
  })
})

describe('viewLabelFor', () => {
  it('reads as the portal the user is looking at', () => {
    expect(viewLabelFor('TEACHER')).toBe('Teacher view')
    expect(viewLabelFor('PARENT')).toBe('Parent view')
    expect(viewLabelFor('ADMIN')).toBe('Administrator')
  })
  it('falls back to the raw role for anything unknown', () => {
    expect(viewLabelFor('STAFF')).toBe('STAFF')
    expect(viewLabelFor(null)).toBe('')
  })
})

describe('landingPathFor', () => {
  it('sends the parent view to the parent portal and every staff view to the dashboard', () => {
    expect(landingPathFor('PARENT')).toBe('/parent/dashboard')
    expect(landingPathFor('TEACHER')).toBe('/dashboard')
    expect(landingPathFor('ADMIN')).toBe('/dashboard')
  })
})

describe('switchFlashFor', () => {
  it('tells the user which view they landed in, naming the staff role they came from', () => {
    expect(switchFlashFor('PARENT', 'TEACHER')).toBe("You're now in Parent view")
    expect(switchFlashFor('TEACHER', 'TEACHER')).toBe("You're back in Teacher view")
    expect(switchFlashFor('ADMIN', 'ADMIN')).toBe("You're back in Administrator view")
  })
})
