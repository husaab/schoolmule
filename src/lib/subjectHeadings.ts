// src/lib/subjectHeadings.ts
// Report templates → Subject headings: the school's headings on grades 1-8
// progress reports, in print order, each with its subjects. A subject prints
// under its own name and covers the classes whose subject is in its class
// names (its own name when it lists none); matching ignores case and extra
// spaces. Classes no subject covers print last under "Other Subjects". The
// API (services/reportEngine/subjectLayout.js) has the same rules.
//
// The editor works on a draft where each subject's class names are the text
// typed ("Quran, Quran Teaching"), and sends the list form.

export interface LayoutSubject {
  name: string
  classes: string[]
}

export interface LayoutSection {
  heading: string
  subjects: LayoutSubject[]
}

export interface SubjectLayoutResponse {
  sections: LayoutSection[]
  updatedAt: string | null
  /** The subjects of the school's grades 1-8 classes this school year. */
  classSubjects?: string[]
}

export interface DraftSubject {
  /** Stable key for React lists. */
  key: string
  name: string
  /** The class names as typed, comma-separated. */
  classes: string
}

export interface DraftSection {
  key: string
  heading: string
  subjects: DraftSubject[]
}

export const OTHER_HEADING = 'Other Subjects'

const tidy = (s: string) => s.replace(/\s+/g, ' ').trim()
const matchKey = (s: string) => tidy(s).toLowerCase()

let nextKey = 0
const newKey = () => `k${++nextKey}`

/** The class names typed for a subject, tidied, without blanks or repeats. */
export function parseClassNames(text: string): string[] {
  const out: string[] = []
  for (const part of text.split(',')) {
    const name = tidy(part)
    if (name && !out.some((x) => matchKey(x) === matchKey(name))) out.push(name)
  }
  return out
}

export const toDraft = (sections: LayoutSection[]): DraftSection[] =>
  sections.map((s) => ({
    key: newKey(),
    heading: s.heading,
    subjects: s.subjects.map((sub) => ({ key: newKey(), name: sub.name, classes: sub.classes.join(', ') })),
  }))

export const fromDraft = (draft: DraftSection[]): LayoutSection[] =>
  draft.map((s) => ({
    heading: tidy(s.heading),
    subjects: s.subjects.map((sub) => ({ name: tidy(sub.name), classes: parseClassNames(sub.classes) })),
  }))

export const emptySubject = (): DraftSubject => ({ key: newKey(), name: '', classes: '' })
export const emptySection = (): DraftSection => ({ key: newKey(), heading: '', subjects: [emptySubject()] })

/** The list with the item at `from` moved one place up (-1) or down (+1); unchanged at an end. */
export function moveItem<T>(list: T[], from: number, by: -1 | 1): T[] {
  const to = from + by
  if (from < 0 || from >= list.length || to < 0 || to >= list.length) return list
  const next = [...list]
  ;[next[from], next[to]] = [next[to], next[from]]
  return next
}

/** The class names a subject covers (its own name when it lists none). */
const covered = (subject: LayoutSubject) => (subject.classes.length > 0 ? subject.classes : [subject.name])

/** Where a class subject prints: its heading and printed name, or null (under "Other Subjects"). */
export function placeOf(sections: LayoutSection[], classSubject: string): { heading: string; name: string } | null {
  const key = matchKey(classSubject)
  for (const section of sections) {
    for (const subject of section.subjects) {
      if (covered(subject).some((c) => matchKey(c) === key)) return { heading: section.heading, name: subject.name }
    }
  }
  return null
}

/** The school's class subjects no heading covers (they print under "Other Subjects"). */
export const uncoveredSubjects = (sections: LayoutSection[], classSubjects: string[]): string[] =>
  sections.length === 0 ? [] : classSubjects.filter((c) => placeOf(sections, c) === null)

/** What stops the draft saving, in the API's words, or null. */
export function layoutProblem(sections: LayoutSection[]): string | null {
  if (sections.length === 0) return 'Add at least one heading'
  const headings = new Set<string>()
  const claimed = new Map<string, string>()
  for (const section of sections) {
    if (!section.heading) return 'Every heading needs a name'
    if (headings.has(section.heading.toLowerCase())) return `"${section.heading}" is in the list twice`
    headings.add(section.heading.toLowerCase())
    if (section.subjects.length === 0) return `Add a subject under "${section.heading}"`
    for (const subject of section.subjects) {
      if (!subject.name) return `Every subject under "${section.heading}" needs a name`
      for (const c of covered(subject)) {
        const other = claimed.get(matchKey(c))
        if (other) return `Classes named "${c}" are under both "${other}" and "${subject.name}". Keep them under one.`
        claimed.set(matchKey(c), subject.name)
      }
    }
  }
  return null
}

export const sameLayout = (a: LayoutSection[], b: LayoutSection[]) => JSON.stringify(a) === JSON.stringify(b)
