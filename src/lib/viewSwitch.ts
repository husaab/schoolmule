// src/lib/viewSwitch.ts
// Pure helpers for the dual-role view switch (staff who are also parents).
// The session token's `role` is the view the user is acting in; `baseRole`
// is their database role and `roles` every view they may switch to. These
// helpers read those three fields and nothing else, so the switcher UI, the
// post-switch toast and the landing page all agree.

export type ViewUser = {
  role: string | null
  baseRole?: string | null
  roles?: string[]
}

const LABELS: Record<string, string> = {
  TEACHER: 'Teacher view',
  PARENT: 'Parent view',
  ADMIN: 'Administrator',
}

/** True when the account holds more than one view. */
export const canSwitchViews = (user: ViewUser): boolean => (user.roles?.length ?? 0) > 1

/** The view the user is not currently in, or null when there is only one. */
export const otherViewFor = (user: ViewUser): string | null => {
  if (!canSwitchViews(user)) return null
  return user.roles!.find((r) => r !== user.role) ?? null
}

/** What the portal label under the school name says for a view. */
export const viewLabelFor = (view: string | null | undefined): string => {
  if (!view) return ''
  return LABELS[view] ?? view
}

/** Where a view opens. Every staff view shares the staff dashboard. */
export const landingPathFor = (view: string): string => (view === 'PARENT' ? '/parent/dashboard' : '/dashboard')

/** The one-shot toast shown after the reload that completes a switch. */
export const switchFlashFor = (view: string, baseRole: string): string =>
  view === 'PARENT' ? "You're now in Parent view" : `You're back in ${baseRole === 'ADMIN' ? 'Administrator' : 'Teacher'} view`
