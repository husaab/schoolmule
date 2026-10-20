// src/lib/classGradeSections.ts
// How the Classes home separates grades: the order of grades (JK, SK, then
// Grades 1 to 8), when cards sit under grade sections and when they stay one
// grid, the Archived section, the Grade row's options, which cards need their
// teacher or term to tell twins apart, and the remembered collapsed grades.
// Teachers keep one grid (their classes are few, often one per grade);
// admins, and the List view, get sections once two or more grades show.

const TZ = 'America/Toronto'

/** School order; anything else sorts after Grade 8, and no grade last. */
const GRADE_ORDER = ['JK', 'SK', '1', '2', '3', '4', '5', '6', '7', '8']
const NONE = 'none'
export const ARCHIVED_KEY = 'archived'

export interface LayoutCard {
  classId: string
  grade: string | number | null | undefined
  subject: string
  termName: string | null
  teacherId: string | null
  teacherName: string | null
  archivedAt: string | null
  toReviewCount: number
}

/** A grade as a section key: '5', 'JK', or 'none' for a class with no grade. */
export const gradeKey = (grade: string | number | null | undefined): string => {
  const g = grade == null ? '' : String(grade).trim()
  return g === '' ? NONE : g
}

export const gradeRank = (key: string): number => {
  if (key === NONE) return GRADE_ORDER.length + 1
  const i = GRADE_ORDER.indexOf(key)
  return i < 0 ? GRADE_ORDER.length : i
}

const byGrade = <T extends LayoutCard>(cards: T[]): T[] =>
  [...cards].sort((a, b) => gradeRank(gradeKey(a.grade)) - gradeRank(gradeKey(b.grade)))

/** "Junior Kindergarten", "Grade 5", "No grade". */
export const sectionLabel = (key: string): string => {
  if (key === 'JK') return 'Junior Kindergarten'
  if (key === 'SK') return 'Senior Kindergarten'
  if (key === NONE) return 'No grade'
  return `Grade ${key}`
}

/** The section header's grade token: "5", "JK", or a dash for no grade. */
export const sectionToken = (key: string): string => (key === NONE ? '–' : key)

/** The card's grade chip: "Grade 5", "JK"; a class with no grade has none. */
export const gradeChip = (grade: string | number | null | undefined): string | null => {
  const key = gradeKey(grade)
  if (key === NONE) return null
  return key === 'JK' || key === 'SK' ? key : `Grade ${key}`
}

// ---------------------------------------------------------------------------
// Sections

export interface GradeSection<T> {
  key: string
  label: string
  token: string
  cards: T[]
  /** Work waiting to be graded across the section (archived classes count none). */
  reviewCount: number
}

export interface ClassesLayout<T> {
  /** Cards under grade sections; otherwise `flat` holds them as one grid. */
  sectioned: boolean
  sections: GradeSection<T>[]
  flat: T[]
  /** Archived classes, all in one section after every grade (Show archived). */
  archived: GradeSection<T> | null
}

/**
 * The Classes home layout. Archived cards always go to the Archived section.
 * The rest stay one grid in grade order for a teacher's cards, and go under
 * grade sections for an admin, or in the List, once two or more grades show.
 */
export function layoutClasses<T extends LayoutCard>(
  cards: T[],
  opts: { isAdmin: boolean; view: 'cards' | 'list' },
): ClassesLayout<T> {
  const active = byGrade(cards.filter((c) => !c.archivedAt))
  const old = byGrade(cards.filter((c) => c.archivedAt))
  const archived: GradeSection<T> | null = old.length
    ? { key: ARCHIVED_KEY, label: 'Archived', token: '', cards: old, reviewCount: 0 }
    : null

  const grades = new Set(active.map((c) => gradeKey(c.grade)))
  const sectioned = grades.size > 1 && (opts.isAdmin || opts.view === 'list')
  if (!sectioned) return { sectioned, sections: [], flat: active, archived }

  const sections: GradeSection<T>[] = []
  for (const card of active) {
    const key = gradeKey(card.grade)
    let section = sections[sections.length - 1]
    if (section?.key !== key) {
      section = { key, label: sectionLabel(key), token: sectionToken(key), cards: [], reviewCount: 0 }
      sections.push(section)
    }
    section.cards.push(card)
    section.reviewCount += card.toReviewCount || 0
  }
  return { sectioned, sections, flat: [], archived }
}

/** Every key Collapse all acts on: the grade sections, then Archived. */
export const layoutKeys = (layout: ClassesLayout<unknown>): string[] => [
  ...layout.sections.map((s) => s.key),
  ...(layout.archived ? [layout.archived.key] : []),
]

// ---------------------------------------------------------------------------
// The Grade row

export interface GradeFilterOption {
  /** The `grade` URL value: '5', 'JK', 'none'. */
  value: string
  /** "Gr 5", "JK", "No grade". */
  label: string
  count: number
}

/** The grades the cards span, in school order, with how many classes each. */
export function gradeFilterOptions(cards: LayoutCard[]): GradeFilterOption[] {
  const counts = new Map<string, number>()
  for (const c of cards) {
    const key = gradeKey(c.grade)
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  return [...counts.keys()]
    .sort((a, b) => gradeRank(a) - gradeRank(b))
    .map((key) => ({
      value: key,
      label: key === NONE ? 'No grade' : key === 'JK' || key === 'SK' ? key : `Gr ${key}`,
      count: counts.get(key) ?? 0,
    }))
}

/** The cards of one grade ('' keeps them all). */
export const filterByGrade = <T extends LayoutCard>(cards: T[], grade: string): T[] =>
  grade ? cards.filter((c) => gradeKey(c.grade) === grade) : cards

// ---------------------------------------------------------------------------
// Twins

export interface CardLabel {
  /** Show the lead teacher on the card (admins always; teachers for twins with different leads). */
  showTeacher: boolean
  /** The term, as a second chip, when the same class shows for several terms. */
  termChip: string | null
  /** What the rails add to "Grade 7 Quran" for a twin: its teacher, else its term. */
  railSuffix: string | null
}

const twinKey = (c: LayoutCard) => `${gradeKey(c.grade)}|${(c.subject ?? '').trim().toLowerCase()}`

/**
 * What each card needs to be told apart. Two classes are twins when they
 * share a grade and a subject; twins with different lead teachers show the
 * teacher, and twins from different terms show the term.
 */
export function cardLabels(cards: LayoutCard[], opts: { isAdmin: boolean }): Map<string, CardLabel> {
  const twins = new Map<string, LayoutCard[]>()
  for (const c of cards) {
    const key = twinKey(c)
    twins.set(key, [...(twins.get(key) ?? []), c])
  }
  const labels = new Map<string, CardLabel>()
  for (const c of cards) {
    const group = twins.get(twinKey(c)) ?? []
    const byLead = new Set(group.map((t) => t.teacherId)).size > 1
    const byTerm = new Set(group.map((t) => t.termName)).size > 1
    labels.set(c.classId, {
      showTeacher: opts.isAdmin || byLead,
      termChip: byTerm ? c.termName : null,
      railSuffix: byLead ? c.teacherName : byTerm ? c.termName : null,
    })
  }
  return labels
}

/** "Sep 30": the day a class was archived, on the school's calendar. */
export const archivedOn = (iso: string): string =>
  new Intl.DateTimeFormat('en-US', { timeZone: TZ, month: 'short', day: 'numeric' }).format(new Date(iso))

// ---------------------------------------------------------------------------
// Collapsed grades, remembered per person on this browser

export const collapsedKey = (school: string, userId: string): string => `classes-collapsed:${school}:${userId}`

/** The remembered collapsed keys; anything unreadable means none. */
export function readCollapsed(raw: string | null): Set<string> {
  if (!raw) return new Set()
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? new Set(parsed.filter((k): k is string => typeof k === 'string')) : new Set()
  } catch {
    return new Set()
  }
}

/** True when there are sections and every one is collapsed (Collapse all then reads Expand all). */
export const allCollapsed = (keys: string[], collapsed: Set<string>): boolean =>
  keys.length > 0 && keys.every((k) => collapsed.has(k))
