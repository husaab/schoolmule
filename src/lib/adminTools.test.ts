import { describe, it, expect } from 'vitest'
import { ADMIN_TOOL_GROUPS, ADMIN_TOOL_ICONS, adminToolsFor, searchTools, toolScore, toolsMissingMeta } from './adminTools'
import { ADMIN_PANEL_GROUPS } from './adminPanelNav'
import { PERMISSIONS, TEACHER_DEFAULT, canOpenPath, type AccessUser } from './permissions'

const OFFICE_STAFF = [
  'students', 'report_cards', 'attendance.daily', 'attendance.classes', 'staff_attendance', 'users',
  'messages.all', 'announcements.school', 'school_setup', 'scheduling', 'forms',
]

const fullAdmin: AccessUser = { role: 'ADMIN', isFullAdmin: true, permissions: [...PERMISSIONS], accessRole: null, teachesClasses: false }
const officeStaff: AccessUser = { role: 'ADMIN', isFullAdmin: false, permissions: OFFICE_STAFF, accessRole: { id: 'r1', name: 'Office Staff' }, teachesClasses: false }
const teacher: AccessUser = { role: 'TEACHER', isFullAdmin: false, permissions: [...TEACHER_DEFAULT], accessRole: null, teachesClasses: true }
const restricted = (permissions: string[]): AccessUser => ({ role: 'ADMIN', isFullAdmin: false, permissions, accessRole: { id: 'r', name: 'Custom' }, teachesClasses: false })

const labels = (user: AccessUser) => adminToolsFor(user).map((g) => [g.label, g.tools.map((t) => t.label)])
const allTools = ADMIN_TOOL_GROUPS.flatMap((g) => g.tools)

describe('the admin tool registry', () => {
  it('describes every tool in the sidebar dropdown, under the sidebar’s own name', () => {
    expect(toolsMissingMeta()).toEqual([])
    for (const navGroup of ADMIN_PANEL_GROUPS) {
      const group = ADMIN_TOOL_GROUPS.find((g) => g.label === navGroup.label)
      expect(group?.tools.map((t) => [t.href, t.label])).toEqual(navGroup.items.map((i) => [i.href, i.label]))
    }
  })

  it('adds the admin tools that live elsewhere in the sidebar', () => {
    expect(ADMIN_TOOL_GROUPS.map((g) => g.label)).toEqual(['People', 'School setup', 'Planning', 'Forms & finance', 'Product'])
    expect(allTools.map((t) => t.href)).toEqual(expect.arrayContaining(['/admin-panel/forms', '/finance/tuition', '/admin-panel/patch-notes']))
  })

  it('has one row per page, each with a description and a known icon', () => {
    const hrefs = allTools.map((t) => t.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    for (const tool of allTools) {
      expect(tool.description.length).toBeGreaterThan(10)
      expect(ADMIN_TOOL_ICONS).toContain(tool.icon)
    }
  })

  it('gives each group its own hue', () => {
    const tones = ADMIN_TOOL_GROUPS.map((g) => g.tone)
    expect(new Set(tones).size).toBe(tones.length)
  })
})

describe('adminToolsFor', () => {
  it('gives a full admin every tool', () => {
    expect(adminToolsFor(fullAdmin).flatMap((g) => g.tools)).toHaveLength(allTools.length)
  })

  it('gives Office Staff their tools without Roles, Tuition or Patch Notes', () => {
    expect(labels(officeStaff)).toEqual([
      ['People', ['Users', 'Student accounts', 'User Approvals', 'Parent Relations', 'All Messages']],
      ['School setup', ['School Settings', 'School Calendar', 'School Assets', 'Report Templates']],
      ['Planning', ['Schedule Planner', 'School Schedule', 'Agenda Editor', 'Parent–Teacher Meetings']],
      ['Forms & finance', ['Forms']],
    ])
  })

  it('drops groups with nothing left in them', () => {
    expect(labels(restricted(['forms']))).toEqual([
      ['Planning', ['School Schedule']],
      ['Forms & finance', ['Forms']],
    ])
    expect(labels(restricted(['finance']))).toEqual([
      ['Planning', ['School Schedule']],
      ['Forms & finance', ['Tuition', 'Payments']],
    ])
  })

  it('keeps Roles and Patch Notes for full admins', () => {
    const hrefs = adminToolsFor(officeStaff).flatMap((g) => g.tools.map((t) => t.href))
    expect(hrefs).not.toContain('/admin-panel/roles')
    expect(hrefs).not.toContain('/admin-panel/patch-notes')
  })

  it('never lists a page the user can’t open', () => {
    for (const user of [fullAdmin, officeStaff, teacher, restricted(['scheduling']), restricted(['messages.all'])]) {
      for (const tool of adminToolsFor(user).flatMap((g) => g.tools)) expect(canOpenPath(tool.href, user)).toBe(true)
    }
  })
})

describe('searchTools', () => {
  const groups = adminToolsFor(fullAdmin)
  const found = (query: string) => searchTools(groups, query).map((t) => t.label)

  it('matches nothing for an empty search', () => {
    expect(found('')).toEqual([])
    expect(found('   ')).toEqual([])
  })

  it('puts a name match first', () => {
    expect(found('user')[0]).toBe('Users')
    expect(found('USER')[0]).toBe('Users')
    expect(found('sched')).toEqual(['Schedule Planner', 'School Schedule'])
  })

  it('finds tools by their older names and other words', () => {
    expect(found('permissions')).toEqual(['Roles'])
    expect(found('approve')).toEqual(['User Approvals'])
    expect(found('quickbooks')).toEqual(['Tuition'])
    expect(found('ptm')).toEqual(['Parent–Teacher Meetings'])
    expect(found('holidays')).toEqual(['School Calendar'])
  })

  it('needs every word to match', () => {
    expect(found('school cal')).toEqual(['School Calendar'])
    expect(found('school zebra')).toEqual([])
  })

  it('scores a name above a keyword above a description', () => {
    const users = groups[0].tools[0]
    expect(toolScore(users, 'users')).toBeGreaterThan(toolScore(users, 'staff'))
    expect(toolScore(users, 'staff')).toBeGreaterThan(toolScore(users, 'edit'))
    expect(toolScore(users, 'zebra')).toBe(0)
  })
})
