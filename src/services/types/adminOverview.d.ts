// GET /admin/overview: facts for the admin panel's live rows and its
// "Needs your attention" list. The server leaves a block out when the caller
// lacks its permission, and sends { error: true } when that block's query
// failed, so one broken area never blanks the page. lib/adminOverview turns
// these facts into words.

export type OverviewBlock<T> = T | { error: true }

export interface OverviewTermFacts {
  termId: string
  name: string
  startDate: string
  endDate: string
}

export interface AdminOverview {
  generatedAt: string
  /** YYYY-MM-DD in Toronto. */
  today: string
  schoolYear: { schoolYearId: string; label: string; isActive: boolean } | null

  approvals?: OverviewBlock<{ pendingSignups: number; unverifiedSignups: number; pendingStudentRequests: number }>
  users?: OverviewBlock<{ admins: number; teachers: number; parents: number; invitedNotSignedIn: number }>
  studentAccounts?: OverviewBlock<{ students: number; notInvited: number; invited: number; active: number; needsAttention: number }>
  relations?: OverviewBlock<{ students: number; withoutGuardian: number }>
  messages?: OverviewBlock<{ awaitingReply: number; waitingOverTwoDays: number; failedEmailConversations: number }>
  schoolSettings?: OverviewBlock<{
    currentTerm: OverviewTermFacts | null
    nextTerm: { termId: string; name: string; startDate: string } | null
  }>
  calendar?: OverviewBlock<{ nextClosure: { eventId: string; title: string; startDate: string; endDate: string } | null }>
  assets?: OverviewBlock<{ logo: boolean; signature: boolean; stamp: boolean }>
  reportTemplates?: OverviewBlock<{ total: number; withUnpublishedChanges: number }>
  reportRuns?: OverviewBlock<{ running: number; failedItems: number }>
  forms?: OverviewBlock<{
    newSubmissions: number
    formsWithNew: number
    topForm: { slug: string; name: string; newSubmissions: number } | null
    openForms: number
    total: number
  }>
  planner?: OverviewBlock<{
    live: { scheduleId: string; name: string; effectiveFrom: string | null } | null
    nextDraft: { scheduleId: string; name: string; goLiveOn: string } | null
    goLiveFailures: { scheduleId: string; name: string }[]
  }>
  agendas?: OverviewBlock<{
    latest: { agendaId: string; title: string; academicYear: string; status: string } | null
  }>
  meetings?: OverviewBlock<{
    event: {
      eventId: string
      title: string
      phase: 'draft' | 'scheduled' | 'open' | 'closed' | 'finished' | string
      opensAt: string | null
      lastCallAt: string | null
      firstDay: string | null
      lastDay: string | null
      bookings: number
      studentsBooked: number
    } | null
  }>
  finance?: OverviewBlock<{
    connected: boolean
    needsReconnect: boolean
    syncing: boolean
    lastSuccessAt: string | null
    lastError: string | null
    consecutiveFailures: number
  }>
  roles?: OverviewBlock<{ customRoles: number }>
  patchNotes?: OverviewBlock<{ lastPublishedAt: string | null; scheduled: number }>
}

export interface AdminOverviewResponse {
  status: string
  data: AdminOverview
}
