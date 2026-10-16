// src/lib/classroomRoutes.ts
// Where a class lives in the staff app: /classes/[classId] with one tab in
// the query string (?tab=…, Stream is the bare URL), plus the old
// /classes/[id]/edit links redirected onto those tabs. Build every class link
// with these so the default tab and empty params never leak into URLs.

export type ClassTab = 'stream' | 'classwork' | 'grades' | 'people' | 'settings'

/** The Grades tab's sub-tabs (?sub=…, Scores is the default). */
export type GradesSub = 'scores' | 'setup' | 'report-comments' | 'progress-comments'

/** The tabs in page order. */
export const CLASS_TAB_IDS: readonly ClassTab[] = ['stream', 'classwork', 'grades', 'people', 'settings']

export const DEFAULT_CLASS_TAB: ClassTab = 'stream'

export const isClassTab = (value: string | null | undefined): value is ClassTab =>
  !!value && (CLASS_TAB_IDS as readonly string[]).includes(value)

/** The tab a ?tab= value names; anything else (missing, an old value) is the Stream. */
export const parseClassTab = (value: string | null | undefined): ClassTab =>
  isClassTab(value) ? value : DEFAULT_CLASS_TAB

export type ClassHrefParams = Record<string, string | null | undefined>

/**
 * `/classes/{id}?tab={tab}&{params}#{hash}`. The Stream tab is omitted (it is
 * the bare URL), empty params are dropped, and a hash may come with or
 * without its '#'.
 */
export function classHref(
  classId: string,
  tab: ClassTab = DEFAULT_CLASS_TAB,
  params: ClassHrefParams = {},
  hash?: string,
): string {
  const query = new URLSearchParams()
  if (tab !== DEFAULT_CLASS_TAB) query.set('tab', tab)
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== '') query.set(key, value)
  }
  const qs = query.toString()
  const fragment = (hash ?? '').replace(/^#/, '')
  return `/classes/${encodeURIComponent(classId)}${qs ? `?${qs}` : ''}${fragment ? `#${fragment}` : ''}`
}

/**
 * Where an old /classes/{id}/edit link lands: #assessments (the grading setup)
 * moved to Grades → Assessments & categories; any other section hash stays a
 * section of Settings; no hash opens Settings.
 */
export function legacyEditRedirect(classId: string, hash: string): string {
  const section = (hash ?? '').replace(/^#/, '')
  if (section === 'assessments') return classHref(classId, 'grades', { sub: 'setup' })
  if (section) return classHref(classId, 'settings', {}, `#${section}`)
  return classHref(classId, 'settings')
}

/** A classwork item's page (the grading view), or its edit form. */
export const classItemHref = (classId: string, itemId: string, page?: 'edit'): string =>
  `/classes/${encodeURIComponent(classId)}/items/${encodeURIComponent(itemId)}${page ? `/${page}` : ''}`
