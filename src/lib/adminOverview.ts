// src/lib/adminOverview.ts
// Turns the admin overview's facts (GET /admin/overview) into words: each
// tool row's one-line status, and the "Needs your attention" list with where
// each item leads (adminOverview.test.ts). The only reader of the overview's
// shape, so a renamed field is a one-file fix.
//
// A block the user can't see is absent: its row shows the tool's
// description. A block whose query failed says so, and never reads as zero,
// so a broken query can't pass for "all clear". Pure; the app copies it.

import type { AdminOverview, OverviewBlock } from '@/services/types/adminOverview'

export type StatusTone = 'neutral' | 'good' | 'warn' | 'bad'
export type ToolStatus = { line: string; tone: StatusTone }

export const LOAD_FAILED_LINE = 'Couldn’t load the latest'

/** The block's facts, or null when it's absent or failed. */
export const blockOf = <T extends object>(block: OverviewBlock<T> | undefined): T | null =>
  block && !('error' in block) ? block : null

export const blockFailed = (block: OverviewBlock<object> | undefined): boolean => Boolean(block && 'error' in block)

// ---------------------------------------------------------------------------
// Words

export const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`

/** 'Jan 30' for a YYYY-MM-DD date (no time zone shift). */
export const monthDay = (date: string): string =>
  new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', month: 'short', day: 'numeric' })

/** 'Nov 24' for an instant, in Toronto. */
export const shortInstant = (iso: string): string =>
  new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/Toronto', month: 'short', day: 'numeric' })

/** 'Dec 21' or 'Dec 21 – Jan 1'. */
export const dateRange = (start: string, end: string): string =>
  start.slice(0, 10) === end.slice(0, 10) ? monthDay(start) : `${monthDay(start)} – ${monthDay(end)}`

/** 'just now', '5 min ago', '1 hour ago', '3 days ago'. */
export const relativeAge = (iso: string, now: Date): string => {
  const minutes = Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 60_000))
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${plural(hours, 'hour')} ago`
  return `${plural(Math.floor(hours / 24), 'day')} ago`
}

const STALE_SYNC_HOURS = 24

const hoursSince = (iso: string, now: Date) => (now.getTime() - new Date(iso).getTime()) / 3_600_000

// ---------------------------------------------------------------------------
// Where things lead. Every link carries an explicit filter, so a page's
// remembered filters (lib/filterMemory) never override what the item promised.

export const ADMIN_LINKS = {
  approvalsPending: () => '/admin-panel/approvals?tab=pending',
  studentRequestsPending: () => '/admin-panel/approvals?tab=pending&role=STUDENT',
  messagesWaiting: () => '/admin-panel/messages?status=waiting',
  messagesOpen: () => '/admin-panel/messages?status=open',
  formSubmissions: (slug?: string | null) =>
    slug ? `/admin-panel/forms/submissions/${encodeURIComponent(slug)}?status=new` : '/admin-panel/forms/submissions',
  studentAccountsNeedingAttention: () => '/admin-panel/student-accounts?status=needs_attention',
  tuition: () => '/finance/tuition',
  plannerSchedules: () => '/admin-panel/schedule-planner?tab=schedules',
  reportCards: () => '/report-cards',
  schoolSettings: () => '/admin-panel/school-settings',
  agendas: () => '/admin-panel/agendas',
} as const

// ---------------------------------------------------------------------------
// Row status

type Facts<K extends keyof AdminOverview> = Exclude<NonNullable<AdminOverview[K]>, { error: true }>

const STATUS: Record<string, { block: keyof AdminOverview; line: (o: AdminOverview, now: Date) => ToolStatus }> = {
  '/admin-panel/users': {
    block: 'users',
    line: (o) => {
      const u = o.users as Facts<'users'>
      const base = `${u.admins + u.teachers} staff, ${plural(u.parents, 'parent')}`
      return { line: u.invitedNotSignedIn > 0 ? `${base}, ${u.invitedNotSignedIn} not signed in yet` : base, tone: 'neutral' }
    },
  },
  '/admin-panel/roles': {
    block: 'roles',
    line: (o) => {
      const r = o.roles as Facts<'roles'>
      return { line: r.customRoles === 0 ? 'No custom roles yet' : plural(r.customRoles, 'custom role'), tone: 'neutral' }
    },
  },
  '/admin-panel/student-accounts': {
    block: 'studentAccounts',
    line: (o) => {
      const s = o.studentAccounts as Facts<'studentAccounts'>
      if (s.students === 0) return { line: 'No students this year', tone: 'neutral' }
      if (s.needsAttention > 0) return { line: `${s.needsAttention} need attention`, tone: 'warn' }
      return { line: `${s.active} active, ${s.invited} invited, ${s.notInvited} not invited`, tone: 'neutral' }
    },
  },
  '/admin-panel/approvals': {
    block: 'approvals',
    line: (o) => {
      const a = o.approvals as Facts<'approvals'>
      const waiting = a.pendingSignups + a.pendingStudentRequests
      if (waiting > 0) return { line: `${waiting} waiting for approval`, tone: 'warn' }
      if (a.unverifiedSignups > 0) return { line: `No one waiting, ${a.unverifiedSignups} still verifying their email`, tone: 'neutral' }
      return { line: 'No one waiting', tone: 'good' }
    },
  },
  '/admin-panel/relations': {
    block: 'relations',
    line: (o) => {
      const r = o.relations as Facts<'relations'>
      if (r.students === 0) return { line: 'No students this year', tone: 'neutral' }
      if (r.withoutGuardian > 0) return { line: `${plural(r.withoutGuardian, 'student')} with no parent linked`, tone: 'warn' }
      return { line: 'Every student has a parent linked', tone: 'neutral' }
    },
  },
  '/admin-panel/messages': {
    block: 'messages',
    line: (o) => {
      const m = o.messages as Facts<'messages'>
      if (m.failedEmailConversations > 0)
        return { line: `Emails didn’t send in ${plural(m.failedEmailConversations, 'conversation')}`, tone: 'bad' }
      if (m.waitingOverTwoDays > 0)
        return { line: `${m.awaitingReply} awaiting a reply, ${m.waitingOverTwoDays} for over 2 days`, tone: 'warn' }
      if (m.awaitingReply > 0) return { line: `${m.awaitingReply} awaiting a reply`, tone: 'neutral' }
      return { line: 'Nothing awaiting a reply', tone: 'good' }
    },
  },
  '/admin-panel/school-settings': {
    block: 'schoolSettings',
    line: (o) => {
      const s = o.schoolSettings as Facts<'schoolSettings'>
      if (!o.schoolYear) return { line: 'No school year set up', tone: 'bad' }
      if (!o.schoolYear.isActive) return { line: `${o.schoolYear.label}, a past year`, tone: 'neutral' }
      if (s.currentTerm) return { line: `${s.currentTerm.name} ends ${monthDay(s.currentTerm.endDate)}`, tone: 'neutral' }
      if (s.nextTerm) return { line: `Between terms. ${s.nextTerm.name} starts ${monthDay(s.nextTerm.startDate)}`, tone: 'neutral' }
      return { line: 'No term covers today', tone: 'warn' }
    },
  },
  '/admin-panel/school-calendar': {
    block: 'calendar',
    line: (o) => {
      const next = (o.calendar as Facts<'calendar'>).nextClosure
      return next
        ? { line: `Next closure: ${next.title}, ${dateRange(next.startDate, next.endDate)}`, tone: 'neutral' }
        : { line: 'No closures coming up', tone: 'neutral' }
    },
  },
  '/admin-panel/school-assets': {
    block: 'assets',
    line: (o) => {
      const a = o.assets as Facts<'assets'>
      const missing = [!a.logo && 'logo', !a.signature && 'signature', !a.stamp && 'stamp'].filter(Boolean) as string[]
      if (missing.length === 0) return { line: 'Logo, signature and stamp uploaded', tone: 'neutral' }
      const list = missing.length === 1 ? missing[0] : `${missing.slice(0, -1).join(', ')} or ${missing[missing.length - 1]}`
      return { line: `No ${list} yet`, tone: 'warn' }
    },
  },
  '/admin-panel/report-templates': {
    block: 'reportTemplates',
    line: (o) => {
      const t = o.reportTemplates as Facts<'reportTemplates'>
      if (t.total === 0) return { line: 'Using the built-in templates', tone: 'neutral' }
      if (t.withUnpublishedChanges > 0) return { line: `${t.withUnpublishedChanges} with unpublished changes`, tone: 'warn' }
      return { line: `${plural(t.total, 'template')}, all published`, tone: 'neutral' }
    },
  },
  '/admin-panel/schedule-planner': {
    block: 'planner',
    line: (o) => {
      const p = o.planner as Facts<'planner'>
      if (p.goLiveFailures.length > 0) return { line: `${p.goLiveFailures[0].name} didn’t go live`, tone: 'bad' }
      if (p.nextDraft) return { line: `${p.nextDraft.name} goes live ${monthDay(p.nextDraft.goLiveOn)}`, tone: 'neutral' }
      if (p.live) return { line: `${p.live.name} is live`, tone: 'neutral' }
      return { line: 'No timetable published yet', tone: 'neutral' }
    },
  },
  '/school-schedule': {
    block: 'planner',
    line: (o) => {
      const live = (o.planner as Facts<'planner'>).live
      if (!live) return { line: 'Nothing published yet', tone: 'neutral' }
      return { line: live.effectiveFrom ? `${live.name}, since ${monthDay(live.effectiveFrom)}` : live.name, tone: 'neutral' }
    },
  },
  '/admin-panel/agendas': {
    block: 'agendas',
    line: (o) => {
      const latest = (o.agendas as Facts<'agendas'>).latest
      if (!latest) return { line: 'No agenda yet', tone: 'neutral' }
      const state: Record<string, [string, StatusTone]> = {
        draft: ['draft', 'neutral'],
        generating: ['printing now', 'neutral'],
        generated: ['PDF ready', 'neutral'],
        failed: ['printing failed', 'bad'],
      }
      const [word, tone] = state[latest.status] ?? [latest.status, 'neutral']
      return { line: `${latest.title}: ${word}`, tone }
    },
  },
  '/admin-panel/parent-teacher-meetings': {
    block: 'meetings',
    line: (o) => {
      const e = (o.meetings as Facts<'meetings'>).event
      if (!e) return { line: 'No meetings planned', tone: 'neutral' }
      switch (e.phase) {
        case 'draft':
          return { line: `${e.title}: being set up`, tone: 'neutral' }
        case 'scheduled':
          return { line: e.opensAt ? `Booking opens ${shortInstant(e.opensAt)}` : 'Booking opens soon', tone: 'neutral' }
        case 'open':
          return { line: `Booking open, ${plural(e.bookings, 'booking')} so far`, tone: 'neutral' }
        case 'closed':
          return { line: `Booking closed, ${plural(e.bookings, 'booking')}`, tone: 'neutral' }
        default:
          return { line: e.lastDay ? `${e.title} finished ${monthDay(e.lastDay)}` : `${e.title} finished`, tone: 'neutral' }
      }
    },
  },
  '/admin-panel/forms': {
    block: 'forms',
    line: (o) => {
      const f = o.forms as Facts<'forms'>
      if (f.newSubmissions > 0) return { line: plural(f.newSubmissions, 'new submission'), tone: 'warn' }
      if (f.total === 0) return { line: 'No forms yet', tone: 'neutral' }
      return { line: plural(f.openForms, 'open form'), tone: 'neutral' }
    },
  },
  '/finance/tuition': {
    block: 'finance',
    line: (o, now) => {
      const f = o.finance as Facts<'finance'>
      if (!f.connected) return { line: 'QuickBooks not connected', tone: 'neutral' }
      if (f.needsReconnect) return { line: 'QuickBooks needs reconnecting', tone: 'bad' }
      if (f.syncing) return { line: 'Syncing with QuickBooks now', tone: 'neutral' }
      if (f.consecutiveFailures > 0) return { line: 'The last QuickBooks sync failed', tone: 'bad' }
      if (!f.lastSuccessAt) return { line: 'Not synced yet', tone: 'neutral' }
      const stale = hoursSince(f.lastSuccessAt, now) > STALE_SYNC_HOURS
      return { line: `Synced ${relativeAge(f.lastSuccessAt, now)}`, tone: stale ? 'warn' : 'neutral' }
    },
  },
  '/admin-panel/patch-notes': {
    block: 'patchNotes',
    line: (o) => {
      const p = o.patchNotes as Facts<'patchNotes'>
      if (p.scheduled > 0) return { line: `${p.scheduled} scheduled to publish`, tone: 'neutral' }
      if (p.lastPublishedAt) return { line: `Last published ${shortInstant(p.lastPublishedAt)}`, tone: 'neutral' }
      return { line: 'Nothing published yet', tone: 'neutral' }
    },
  },
}

/**
 * The live line under a tool's name, or null when there is nothing to say
 * yet (no overview, or the user can't see that block): the row then shows
 * what the tool is for.
 */
export const toolStatus = (href: string, overview: AdminOverview | null, now: Date): ToolStatus | null => {
  const rule = STATUS[href]
  if (!overview || !rule) return null
  const block = overview[rule.block] as OverviewBlock<object> | undefined
  if (!block) return null
  if (blockFailed(block)) return { line: LOAD_FAILED_LINE, tone: 'neutral' }
  return rule.line(overview, now)
}

// ---------------------------------------------------------------------------
// Needs your attention

export type AttentionAction =
  | { kind: 'review'; queue: 'signups' | 'studentRequests'; label: 'Review' }
  | { kind: 'syncNow'; label: 'Sync now' }

export type AttentionItem = {
  id: string
  tone: 'warn' | 'bad'
  /** Shown large beside the words; null when the item isn't a count. */
  count: number | null
  /** The words after the count (or the whole sentence when there's no count). */
  text: string
  /** The tool the item belongs to: its row carries the count, and the user must be able to open it. */
  toolHref: string
  /** Where Open goes, with that page's filters already set. */
  href: string
  /** Done right here instead of opening the page. */
  action?: AttentionAction
}

/** The item as one sentence, e.g. "3 people waiting for approval". */
export const attentionSentence = (item: AttentionItem): string =>
  item.count === null ? item.text : `${item.count} ${item.text}`

const words = (n: number, one: string, many: string) => (n === 1 ? one : many)

/** What needs someone now, worst first. Only items whose tool the user can open. */
export const attentionItems = (
  overview: AdminOverview | null,
  canOpen: (path: string) => boolean,
  now: Date,
): AttentionItem[] => {
  if (!overview) return []
  const items: AttentionItem[] = []
  const add = (item: AttentionItem) => {
    if (canOpen(item.toolHref)) items.push(item)
  }

  const approvals = blockOf(overview.approvals)
  if (approvals && approvals.pendingSignups > 0)
    add({
      id: 'signups',
      tone: 'warn',
      count: approvals.pendingSignups,
      text: `${words(approvals.pendingSignups, 'person', 'people')} waiting for approval`,
      toolHref: '/admin-panel/approvals',
      href: ADMIN_LINKS.approvalsPending(),
      action: { kind: 'review', queue: 'signups', label: 'Review' },
    })
  if (approvals && approvals.pendingStudentRequests > 0)
    add({
      id: 'studentRequests',
      tone: 'warn',
      count: approvals.pendingStudentRequests,
      text: `${words(approvals.pendingStudentRequests, 'student', 'students')} asked for an account`,
      toolHref: '/admin-panel/approvals',
      href: ADMIN_LINKS.studentRequestsPending(),
      action: { kind: 'review', queue: 'studentRequests', label: 'Review' },
    })

  const messages = blockOf(overview.messages)
  if (messages && messages.failedEmailConversations > 0)
    add({
      id: 'emailsFailed',
      tone: 'bad',
      count: messages.failedEmailConversations,
      text: `${words(messages.failedEmailConversations, 'conversation', 'conversations')} where an email didn’t send`,
      toolHref: '/admin-panel/messages',
      href: ADMIN_LINKS.messagesOpen(),
    })
  if (messages && messages.waitingOverTwoDays > 0)
    add({
      id: 'messagesWaiting',
      tone: 'warn',
      count: messages.waitingOverTwoDays,
      text: `family ${words(messages.waitingOverTwoDays, 'message', 'messages')} unanswered for over 2 days`,
      toolHref: '/admin-panel/messages',
      href: ADMIN_LINKS.messagesWaiting(),
    })

  const forms = blockOf(overview.forms)
  if (forms && forms.newSubmissions > 0)
    add({
      id: 'forms',
      tone: 'warn',
      count: forms.newSubmissions,
      text: `new form ${words(forms.newSubmissions, 'submission', 'submissions')}`,
      toolHref: '/admin-panel/forms',
      href: ADMIN_LINKS.formSubmissions(forms.formsWithNew === 1 ? forms.topForm?.slug : null),
    })

  const accounts = blockOf(overview.studentAccounts)
  if (accounts && accounts.needsAttention > 0)
    add({
      id: 'studentAccounts',
      tone: 'warn',
      count: accounts.needsAttention,
      text: `student ${words(accounts.needsAttention, 'account needs', 'accounts need')} attention`,
      toolHref: '/admin-panel/student-accounts',
      href: ADMIN_LINKS.studentAccountsNeedingAttention(),
    })

  const finance = blockOf(overview.finance)
  if (finance?.connected) {
    if (finance.needsReconnect)
      add({ id: 'financeReconnect', tone: 'bad', count: null, text: 'QuickBooks needs reconnecting', toolHref: '/finance/tuition', href: ADMIN_LINKS.tuition() })
    else if (!finance.syncing && finance.consecutiveFailures > 0)
      add({
        id: 'financeFailing',
        tone: 'bad',
        count: null,
        text: 'The last QuickBooks sync failed',
        toolHref: '/finance/tuition',
        href: ADMIN_LINKS.tuition(),
        action: { kind: 'syncNow', label: 'Sync now' },
      })
    else if (!finance.syncing && finance.lastSuccessAt && hoursSince(finance.lastSuccessAt, now) > STALE_SYNC_HOURS)
      add({
        id: 'financeStale',
        tone: 'warn',
        count: null,
        text: `QuickBooks last synced ${relativeAge(finance.lastSuccessAt, now)}`,
        toolHref: '/finance/tuition',
        href: ADMIN_LINKS.tuition(),
        action: { kind: 'syncNow', label: 'Sync now' },
      })
  }

  const planner = blockOf(overview.planner)
  if (planner && planner.goLiveFailures.length > 0)
    add({
      id: 'goLive',
      tone: 'bad',
      count: planner.goLiveFailures.length,
      text: `${words(planner.goLiveFailures.length, 'timetable', 'timetables')} didn’t go live`,
      toolHref: '/admin-panel/schedule-planner',
      href: ADMIN_LINKS.plannerSchedules(),
    })

  const runs = blockOf(overview.reportRuns)
  if (runs && runs.failedItems > 0)
    add({
      id: 'reportsFailed',
      tone: 'bad',
      count: runs.failedItems,
      text: `${words(runs.failedItems, 'report', 'reports')} failed to print`,
      toolHref: '/report-cards',
      href: ADMIN_LINKS.reportCards(),
    })

  const settings = blockOf(overview.schoolSettings)
  if (settings && !overview.schoolYear)
    add({ id: 'noYear', tone: 'bad', count: null, text: 'No school year is set up', toolHref: '/admin-panel/school-settings', href: ADMIN_LINKS.schoolSettings() })
  else if (settings && overview.schoolYear?.isActive && !settings.currentTerm && !settings.nextTerm)
    add({
      id: 'noTerm',
      tone: 'warn',
      count: null,
      text: 'No term covers today. Check the term dates',
      toolHref: '/admin-panel/school-settings',
      href: ADMIN_LINKS.schoolSettings(),
    })

  const agenda = blockOf(overview.agendas)?.latest
  if (agenda?.status === 'failed')
    add({ id: 'agendaFailed', tone: 'bad', count: null, text: `${agenda.title} didn’t print`, toolHref: '/admin-panel/agendas', href: ADMIN_LINKS.agendas() })

  // Worst first; sort is stable, so the order above breaks ties.
  return items.sort((a, b) => (a.tone === b.tone ? 0 : a.tone === 'bad' ? -1 : 1))
}

/** The count a tool's row carries: the sum of its counted attention items. */
export const attentionCountFor = (items: readonly AttentionItem[], href: string): number =>
  items.reduce((sum, item) => (item.toolHref === href && item.count !== null ? sum + item.count : sum), 0)

// ---------------------------------------------------------------------------
// How much of the overview arrived, and what the attention card may claim

const BLOCK_KEYS = [
  'approvals', 'users', 'studentAccounts', 'relations', 'messages', 'schoolSettings', 'calendar', 'assets',
  'reportTemplates', 'reportRuns', 'forms', 'planner', 'agendas', 'meetings', 'finance', 'roles', 'patchNotes',
] as const satisfies readonly (keyof AdminOverview)[]

/** Blocks that arrived with facts, and blocks whose query failed. */
export const overviewHealth = (overview: AdminOverview | null): { loaded: number; failed: number } => {
  let loaded = 0
  let failed = 0
  for (const key of BLOCK_KEYS) {
    const block = overview?.[key] as OverviewBlock<object> | undefined
    if (!block) continue
    if (blockFailed(block)) failed += 1
    else loaded += 1
  }
  return { loaded, failed }
}

export type AttentionState = 'loading' | 'failed' | 'items' | 'unsure' | 'clear'

/**
 * What the attention card shows. "Nothing needs you" is a claim, so it's made
 * only when every area the user can see answered: if some failed it says so
 * instead, and if none answered (the request failed, or every query did) the
 * list is "failed", never empty.
 */
export const attentionState = ({
  overview,
  items,
  loading,
  requestFailed,
}: {
  overview: AdminOverview | null
  items: readonly AttentionItem[]
  /** The first answer hasn't arrived yet. */
  loading: boolean
  /** The request itself failed and nothing is on screen. */
  requestFailed: boolean
}): AttentionState => {
  if (loading) return 'loading'
  const health = overviewHealth(overview)
  if (requestFailed || (health.loaded === 0 && health.failed > 0)) return 'failed'
  if (items.length > 0) return 'items'
  return health.failed > 0 ? 'unsure' : 'clear'
}
