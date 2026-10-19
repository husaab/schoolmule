// src/lib/classroomRoutes.ts
// Where a class lives in the staff app: /classes/[classId] with one tab in
// the query string (?tab=…, Stream is the bare URL), plus the old
// /classes/[id]/edit links redirected onto those tabs. Build every class link
// with these so the default tab and empty params never leak into URLs.

export type ClassTab = 'stream' | 'classwork' | 'grades' | 'people' | 'settings'

/** The Grades tab's sub-tabs (?sub=…, Scores is the default). */
export type GradesSub = 'scores' | 'setup' | 'report-comments' | 'progress-comments'

/** The Grades sub-tabs in bar order; Scores is the default (omitted from URLs). */
export const GRADES_SUB_IDS: readonly GradesSub[] = ['scores', 'setup', 'report-comments', 'progress-comments']

export const isGradesSub = (value: string | null | undefined): value is GradesSub =>
  !!value && (GRADES_SUB_IDS as readonly string[]).includes(value)

/** The sub-tab a ?sub= value names; anything else is Scores. */
export const parseGradesSub = (value: string | null | undefined): GradesSub => (isGradesSub(value) ? value : 'scores')

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

/**
 * Where an old /gradebook URL lands now that the gradebook is the class's
 * Grades tab: the list goes to the Classes home with its filters, a class
 * (JK and SK included) to its Grades tab, the old Assessments view
 * (?view=assessments) to the setup sub-tab, and the two comment pages to
 * their sub-tabs. `search` may come with or without its '?'.
 */
export function legacyGradebookRedirect(pathname: string, search: string): string {
  const qs = (search ?? '').replace(/^\?/, '')
  const parts = (pathname ?? '').split('/').filter(Boolean)
  if (parts[0] !== 'gradebook') return '/classes'
  const id = (segment: string) => {
    try {
      return decodeURIComponent(segment)
    } catch {
      return segment
    }
  }

  if (parts.length === 1) return `/classes${qs ? `?${qs}` : ''}`

  if (parts[1] === 'jk' || parts[1] === 'sk') {
    return parts.length === 3 ? classHref(id(parts[2]), 'grades') : '/classes'
  }

  const classId = id(parts[1])
  if (parts.length === 2) {
    const params: ClassHrefParams = {}
    for (const [key, value] of new URLSearchParams(qs)) {
      if (key === 'tab' || key === 'sub' || key === 'view') continue
      params[key] = value
    }
    const view = new URLSearchParams(qs).get('view')
    return classHref(classId, 'grades', view === 'assessments' ? { sub: 'setup', ...params } : params)
  }
  if (parts.length === 3 && parts[2] === 'feedback') return classHref(classId, 'grades', { sub: 'report-comments' })
  if (parts.length === 3 && parts[2] === 'progress') return classHref(classId, 'grades', { sub: 'progress-comments' })
  return '/classes'
}

/**
 * A classwork item's page (the grading view), its edit form, or a quiz's
 * questions (the quiz builder). `from=grades` (a link from Grades) sends the
 * page's Back / Close to Grades; `from=grading` sends the builder's Close back
 * to the grading view.
 */
export const classItemHref = (
  classId: string,
  itemId: string,
  page?: 'edit' | 'quiz',
  params: { from?: 'grades' | 'grading' | null } = {},
): string =>
  `/classes/${encodeURIComponent(classId)}/items/${encodeURIComponent(itemId)}${page ? `/${page}` : ''}${params.from ? `?from=${params.from}` : ''}`

export type ItemFormKind = 'assessment' | 'assignment' | 'quiz' | 'material'

/**
 * The new-item form: `/classes/{id}/items/new?kind=…&topic=…&from=…`. `topic`
 * preselects a topic; `from=grades` sends Cancel and Save back to Grades.
 */
export function newItemHref(
  classId: string,
  kind: ItemFormKind,
  params: { topic?: string | null; from?: 'grades' | null } = {},
): string {
  const query = new URLSearchParams({ kind })
  if (params.topic) query.set('topic', params.topic)
  if (params.from) query.set('from', params.from)
  return `/classes/${encodeURIComponent(classId)}/items/new?${query.toString()}`
}

/**
 * Where a teacher's link to a classwork item goes: an assignment or quiz to
 * its grading view, a plain assessment to its column in Grades, a material
 * (and anything not live yet: a draft, a scheduled post) to its edit page; a
 * quiz not live yet to its questions.
 */
export function teacherItemHref(
  classId: string,
  item: { itemId: string; kind: ItemFormKind; assessmentId?: string | null; live?: boolean },
): string {
  if (item.live === false) return classItemHref(classId, item.itemId, item.kind === 'quiz' ? 'quiz' : 'edit')
  if (item.kind === 'assignment' || item.kind === 'quiz') return classItemHref(classId, item.itemId)
  if (item.kind === 'assessment' && item.assessmentId) return classHref(classId, 'grades', { focus: item.assessmentId })
  return classItemHref(classId, item.itemId, 'edit')
}
