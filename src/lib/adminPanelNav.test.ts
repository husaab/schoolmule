import { describe, it, expect } from 'vitest'
import { ADMIN_PANEL_GROUPS, adminPanelNavFor } from './adminPanelNav'
import { PERMISSIONS, TEACHER_DEFAULT, canOpenPath, type AccessUser } from './permissions'

const OFFICE_STAFF = [
  'students', 'report_cards', 'attendance.daily', 'attendance.classes', 'staff_attendance', 'users',
  'messages.all', 'announcements.school', 'school_setup', 'scheduling', 'forms',
]

const fullAdmin: AccessUser = { role: 'ADMIN', isFullAdmin: true, permissions: [...PERMISSIONS], accessRole: null, teachesClasses: false }
const officeStaffTestUser: AccessUser = { role: 'ADMIN', isFullAdmin: false, permissions: OFFICE_STAFF, accessRole: { id: 'r1', name: 'Office Staff' }, teachesClasses: false }
const teacher: AccessUser = { role: 'TEACHER', isFullAdmin: false, permissions: [...TEACHER_DEFAULT], accessRole: null, teachesClasses: true }
const restricted = (permissions: string[]): AccessUser => ({ role: 'ADMIN', isFullAdmin: false, permissions, accessRole: { id: 'r', name: 'Custom' }, teachesClasses: false })

const labels = (user: AccessUser) => adminPanelNavFor(user).groups.map((g) => [g.label, g.items.map((i) => i.label)])

describe('adminPanelNavFor', () => {
  it('gives a full admin everything, Roles included', () => {
    const nav = adminPanelNavFor(fullAdmin)
    expect(nav.show).toBe(true)
    expect(nav.overview).toBe(true)
    expect(nav.groups.flatMap((g) => g.items.map((i) => i.href))).toContain('/admin-panel/roles')
    expect(nav.groups).toHaveLength(ADMIN_PANEL_GROUPS.length)
  })

  it('gives the Office Staff test user her section 7 tools and no Roles', () => {
    const nav = adminPanelNavFor(officeStaffTestUser)
    expect(nav.show).toBe(true)
    expect(nav.overview).toBe(true)
    expect(labels(officeStaffTestUser)).toEqual([
      ['People', ['Users', 'Student accounts', 'User Approvals', 'Parent Relations', 'All Messages']],
      ['School setup', ['School Settings', 'School Calendar', 'School Assets']],
      ['Planning', ['Schedule Planner', 'School Schedule', 'Agenda Editor']],
    ])
  })

  it('drops a group heading with nothing left under it', () => {
    expect(labels(restricted(['messages.all']))).toEqual([
      ['People', ['All Messages']],
      ['Planning', ['School Schedule']],
    ])
  })

  it('has no dropdown for teachers or a forms-only role (School Schedule alone is not a reason)', () => {
    expect(adminPanelNavFor(teacher).show).toBe(false)
    expect(adminPanelNavFor(restricted(['forms'])).show).toBe(false)
    expect(adminPanelNavFor({ role: 'PARENT', isFullAdmin: true, permissions: [...PERMISSIONS] }).show).toBe(false)
  })

  it('every item it can show is a page the router lets the user stay on', () => {
    for (const user of [fullAdmin, officeStaffTestUser, teacher, restricted(['users']), restricted(['scheduling'])]) {
      for (const g of adminPanelNavFor(user).groups) for (const i of g.items) expect(canOpenPath(i.href, user), i.href).toBe(true)
    }
  })
})
