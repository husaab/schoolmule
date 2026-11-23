import { describe, it, expect } from 'vitest'
import {
  ADMIN_LINKS,
  LOAD_FAILED_LINE,
  attentionCountFor,
  attentionItems,
  attentionSentence,
  attentionState,
  dateRange,
  overviewHealth,
  relativeAge,
  monthDay,
  toolStatus,
} from './adminOverview'
import { isStatusFilter } from './studentAccounts'
import type { AdminOverview } from '@/services/types/adminOverview'

const NOW = new Date('2026-11-23T15:00:00Z')
const hoursAgo = (h: number) => new Date(NOW.getTime() - h * 3_600_000).toISOString()

const base: AdminOverview = {
  generatedAt: NOW.toISOString(),
  today: '2026-11-23',
  schoolYear: { schoolYearId: 'y1', label: '2026–27', isActive: true },
}

/** Everything healthy: nothing should need attention. */
const calm: AdminOverview = {
  ...base,
  approvals: { pendingSignups: 0, unverifiedSignups: 0, pendingStudentRequests: 0 },
  users: { admins: 2, teachers: 12, parents: 210, invitedNotSignedIn: 0 },
  studentAccounts: { students: 180, notInvited: 30, invited: 10, active: 140, needsAttention: 0 },
  relations: { students: 180, withoutGuardian: 0 },
  messages: { awaitingReply: 0, waitingOverTwoDays: 0, failedEmailConversations: 0 },
  schoolSettings: { currentTerm: { termId: 't2', name: 'Term 2', startDate: '2026-11-02', endDate: '2027-01-29' }, nextTerm: null },
  calendar: { nextClosure: { eventId: 'e1', title: 'Winter break', startDate: '2026-12-21', endDate: '2027-01-01' } },
  assets: { logo: true, signature: true, stamp: true },
  reportTemplates: { total: 2, withUnpublishedChanges: 0 },
  reportRuns: { running: 0, failedItems: 0 },
  forms: { newSubmissions: 0, formsWithNew: 0, topForm: null, openForms: 3, total: 5 },
  planner: { live: { scheduleId: 's1', name: 'Fall timetable', effectiveFrom: '2026-09-08' }, nextDraft: null, goLiveFailures: [] },
  agendas: { latest: { agendaId: 'a1', title: '2026–27 agenda', academicYear: '2026-2027', status: 'generated' } },
  meetings: { event: null },
  finance: { connected: true, needsReconnect: false, syncing: false, lastSuccessAt: hoursAgo(2), lastError: null, consecutiveFailures: 0 },
  roles: { customRoles: 3 },
  patchNotes: { lastPublishedAt: '2026-11-20T14:00:00Z', scheduled: 0 },
}

const openAll = () => true
const status = (href: string, o: AdminOverview = calm) => toolStatus(href, o, NOW)
const sentences = (o: AdminOverview, canOpen: (p: string) => boolean = openAll) =>
  attentionItems(o, canOpen, NOW).map(attentionSentence)

describe('words', () => {
  it('formats dates without shifting them a day', () => {
    expect(monthDay('2027-01-29')).toBe('Jan 29')
    expect(monthDay('2026-12-01T00:00:00Z')).toBe('Dec 1')
    expect(dateRange('2026-12-21', '2026-12-21')).toBe('Dec 21')
    expect(dateRange('2026-12-21', '2027-01-01')).toBe('Dec 21 – Jan 1')
  })

  it('says how long ago', () => {
    expect(relativeAge(NOW.toISOString(), NOW)).toBe('just now')
    expect(relativeAge(hoursAgo(0.25), NOW)).toBe('15 min ago')
    expect(relativeAge(hoursAgo(1), NOW)).toBe('1 hour ago')
    expect(relativeAge(hoursAgo(5), NOW)).toBe('5 hours ago')
    expect(relativeAge(hoursAgo(72), NOW)).toBe('3 days ago')
  })
})

describe('toolStatus', () => {
  it('says nothing before the overview arrives or for a block the user can’t see', () => {
    expect(toolStatus('/admin-panel/users', null, NOW)).toBeNull()
    expect(status('/admin-panel/users', base)).toBeNull()
  })

  it('says a block failed to load instead of showing zero', () => {
    expect(status('/admin-panel/approvals', { ...calm, approvals: { error: true } })).toEqual({ line: LOAD_FAILED_LINE, tone: 'neutral' })
  })

  it('describes each area in a line', () => {
    expect(status('/admin-panel/users')?.line).toBe('14 staff, 210 parents')
    expect(status('/admin-panel/roles')?.line).toBe('3 custom roles')
    expect(status('/admin-panel/student-accounts')?.line).toBe('140 active, 10 invited, 30 not invited')
    expect(status('/admin-panel/approvals')).toEqual({ line: 'No one waiting', tone: 'good' })
    expect(status('/admin-panel/relations')?.line).toBe('Every student has a parent linked')
    expect(status('/admin-panel/messages')).toEqual({ line: 'Nothing awaiting a reply', tone: 'good' })
    expect(status('/admin-panel/school-settings')?.line).toBe('Term 2 ends Jan 29')
    expect(status('/admin-panel/school-calendar')?.line).toBe('Next closure: Winter break, Dec 21 – Jan 1')
    expect(status('/admin-panel/school-assets')?.line).toBe('Logo, signature and stamp uploaded')
    expect(status('/admin-panel/report-templates')?.line).toBe('2 templates, all published')
    expect(status('/admin-panel/schedule-planner')?.line).toBe('Fall timetable is live')
    expect(status('/school-schedule')?.line).toBe('Fall timetable, since Sep 8')
    expect(status('/admin-panel/agendas')?.line).toBe('2026–27 agenda: PDF ready')
    expect(status('/admin-panel/parent-teacher-meetings')?.line).toBe('No meetings planned')
    expect(status('/admin-panel/forms')?.line).toBe('3 open forms')
    expect(status('/finance/tuition')).toEqual({ line: 'Synced 2 hours ago', tone: 'neutral' })
    expect(status('/admin-panel/patch-notes')?.line).toBe('Last published Nov 20')
  })

  it('colours lines that need someone', () => {
    const busy: AdminOverview = {
      ...calm,
      approvals: { pendingSignups: 2, unverifiedSignups: 1, pendingStudentRequests: 1 },
      messages: { awaitingReply: 6, waitingOverTwoDays: 2, failedEmailConversations: 0 },
      assets: { logo: true, signature: false, stamp: false },
      finance: { ...(calm.finance as object), lastSuccessAt: hoursAgo(50) } as AdminOverview['finance'],
    }
    expect(status('/admin-panel/approvals', busy)).toEqual({ line: '3 waiting for approval', tone: 'warn' })
    expect(status('/admin-panel/messages', busy)).toEqual({ line: '6 awaiting a reply, 2 for over 2 days', tone: 'warn' })
    expect(status('/admin-panel/school-assets', busy)).toEqual({ line: 'No signature or stamp yet', tone: 'warn' })
    expect(status('/finance/tuition', busy)).toEqual({ line: 'Synced 2 days ago', tone: 'warn' })
  })

  it('reads the school year before the term', () => {
    expect(status('/admin-panel/school-settings', { ...calm, schoolYear: null })).toEqual({ line: 'No school year set up', tone: 'bad' })
    expect(status('/admin-panel/school-settings', { ...calm, schoolYear: { schoolYearId: 'y0', label: '2025–26', isActive: false } })?.line).toBe(
      '2025–26, a past year',
    )
    expect(
      status('/admin-panel/school-settings', { ...calm, schoolSettings: { currentTerm: null, nextTerm: { termId: 't3', name: 'Term 3', startDate: '2027-02-01' } } })?.line,
    ).toBe('Between terms. Term 3 starts Feb 1')
  })

  it('follows a meeting event through its phases', () => {
    const event = { eventId: 'm1', title: 'Fall meetings', opensAt: '2026-11-24T23:00:00Z', lastCallAt: null, firstDay: '2026-11-27', lastDay: '2026-11-28', bookings: 42, studentsBooked: 40 }
    const at = (phase: string) => status('/admin-panel/parent-teacher-meetings', { ...calm, meetings: { event: { ...event, phase } } })?.line
    expect(at('draft')).toBe('Fall meetings: being set up')
    expect(at('scheduled')).toBe('Booking opens Nov 24')
    expect(at('open')).toBe('Booking open, 42 bookings so far')
    expect(at('closed')).toBe('Booking closed, 42 bookings')
    expect(at('finished')).toBe('Fall meetings finished Nov 28')
  })

  it('names QuickBooks problems', () => {
    const finance = (f: object) => status('/finance/tuition', { ...calm, finance: { ...(calm.finance as object), ...f } as AdminOverview['finance'] })
    expect(finance({ connected: false })?.line).toBe('QuickBooks not connected')
    expect(finance({ needsReconnect: true })).toEqual({ line: 'QuickBooks needs reconnecting', tone: 'bad' })
    expect(finance({ syncing: true })?.line).toBe('Syncing with QuickBooks now')
    expect(finance({ consecutiveFailures: 2 })).toEqual({ line: 'The last QuickBooks sync failed', tone: 'bad' })
  })
})

describe('attentionItems', () => {
  it('is empty when everything is calm', () => {
    expect(attentionItems(calm, openAll, NOW)).toEqual([])
    expect(attentionItems(null, openAll, NOW)).toEqual([])
  })

  it('lists what needs someone, worst first', () => {
    const busy: AdminOverview = {
      ...calm,
      approvals: { pendingSignups: 3, unverifiedSignups: 0, pendingStudentRequests: 1 },
      messages: { awaitingReply: 8, waitingOverTwoDays: 5, failedEmailConversations: 2 },
      forms: { ...(calm.forms as object), newSubmissions: 4, formsWithNew: 2 } as AdminOverview['forms'],
      planner: { ...(calm.planner as object), goLiveFailures: [{ scheduleId: 's2', name: 'Winter timetable' }] } as AdminOverview['planner'],
    }
    expect(sentences(busy)).toEqual([
      '2 conversations where an email didn’t send',
      '1 timetable didn’t go live',
      '3 people waiting for approval',
      '1 student asked for an account',
      '5 family messages unanswered for over 2 days',
      '4 new form submissions',
    ])
  })

  it('reviews signups and student requests right here, and links to the filtered page', () => {
    const items = attentionItems({ ...calm, approvals: { pendingSignups: 1, unverifiedSignups: 0, pendingStudentRequests: 2 } }, openAll, NOW)
    expect(items.map((i) => [i.href, i.action])).toEqual([
      ['/admin-panel/approvals?tab=pending', { kind: 'review', queue: 'signups', label: 'Review' }],
      ['/admin-panel/approvals?tab=pending&role=STUDENT', { kind: 'review', queue: 'studentRequests', label: 'Review' }],
    ])
    expect(attentionCountFor(items, '/admin-panel/approvals')).toBe(3)
    expect(attentionCountFor(items, '/admin-panel/forms')).toBe(0)
  })

  it('links new submissions to their form when only one form has them', () => {
    const forms = (formsWithNew: number) =>
      attentionItems(
        { ...calm, forms: { newSubmissions: 3, formsWithNew, topForm: { slug: 'fall-trip', name: 'Fall trip', newSubmissions: 2 }, openForms: 3, total: 5 } },
        openAll,
        NOW,
      )[0].href
    expect(forms(1)).toBe('/admin-panel/forms/submissions/fall-trip?status=new')
    expect(forms(2)).toBe('/admin-panel/forms/submissions')
  })

  it('offers Sync now for a failing or stale QuickBooks sync, and sends a reconnect to the page', () => {
    const finance = (f: object) =>
      attentionItems({ ...calm, finance: { ...(calm.finance as object), ...f } as AdminOverview['finance'] }, openAll, NOW).map((i) => [
        attentionSentence(i),
        i.action?.kind ?? null,
      ])
    expect(finance({ lastSuccessAt: hoursAgo(30) })).toEqual([['QuickBooks last synced 1 day ago', 'syncNow']])
    expect(finance({ consecutiveFailures: 1 })).toEqual([['The last QuickBooks sync failed', 'syncNow']])
    expect(finance({ needsReconnect: true })).toEqual([['QuickBooks needs reconnecting', null]])
    expect(finance({ lastSuccessAt: hoursAgo(30), syncing: true })).toEqual([])
    expect(finance({ connected: false, needsReconnect: true })).toEqual([])
  })

  it('flags a missing term only in the current year', () => {
    const noTerms = { ...calm, schoolSettings: { currentTerm: null, nextTerm: null } }
    expect(sentences(noTerms)).toEqual(['No term covers today. Check the term dates'])
    expect(sentences({ ...noTerms, schoolYear: { schoolYearId: 'y0', label: '2025–26', isActive: false } })).toEqual([])
    expect(sentences({ ...noTerms, schoolYear: null })).toEqual(['No school year is set up'])
  })

  it('leaves out failed blocks and tools the user can’t open', () => {
    expect(attentionItems({ ...calm, approvals: { error: true } }, openAll, NOW)).toEqual([])
    const reports = { ...calm, reportRuns: { running: 0, failedItems: 2 } }
    expect(sentences(reports)).toEqual(['2 reports failed to print'])
    expect(sentences(reports, (p) => p !== '/report-cards')).toEqual([])
  })
})

describe('deep links', () => {
  it('use filters the target pages accept', () => {
    expect(isStatusFilter(new URL(ADMIN_LINKS.studentAccountsNeedingAttention(), 'https://x.test').searchParams.get('status') ?? '')).toBe(true)
    expect(ADMIN_LINKS.formSubmissions('a b')).toBe('/admin-panel/forms/submissions/a%20b?status=new')
  })
})

describe('overviewHealth', () => {
  it('counts what arrived and what failed', () => {
    expect(overviewHealth(null)).toEqual({ loaded: 0, failed: 0 })
    expect(overviewHealth({ ...base, users: calm.users, approvals: { error: true } })).toEqual({ loaded: 1, failed: 1 })
  })
})

describe('attentionState', () => {
  const state = (overview: AdminOverview | null, opts: { loading?: boolean; requestFailed?: boolean } = {}) =>
    attentionState({ overview, items: attentionItems(overview, openAll, NOW), loading: false, requestFailed: false, ...opts })

  it('waits, then lists or clears', () => {
    expect(state(null, { loading: true })).toBe('loading')
    expect(state(calm)).toBe('clear')
    expect(state({ ...calm, approvals: { pendingSignups: 2, unverifiedSignups: 0, pendingStudentRequests: 0 } })).toBe('items')
  })

  it('never claims all clear when something didn’t answer', () => {
    expect(state({ ...calm, approvals: { error: true } })).toBe('unsure')
    expect(state({ ...base, approvals: { error: true }, messages: { error: true } })).toBe('failed')
    expect(state(null, { requestFailed: true })).toBe('failed')
  })

  it('still lists what it found when another area failed', () => {
    expect(state({ ...calm, messages: { error: true }, forms: { newSubmissions: 2, formsWithNew: 1, topForm: null, openForms: 1, total: 1 } })).toBe('items')
  })
})
