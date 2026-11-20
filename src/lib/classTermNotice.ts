// src/lib/classTermNotice.ts
// The JK/SK gradebook saves every rating and comment to the term the class is
// set to. A school can keep one class per term (Al Haadi has a Term 1 and a
// Term 2 copy of each class), so a teacher working in the copy for a term
// that isn't the current one fills the wrong report without noticing. This
// says when that's the case, and what to show.

interface TermLike {
  termId: string
  name: string
  /** YYYY-MM-DD, or the API's timestamp of that day ("2027-02-01T05:00:00.000Z"). */
  startDate: string
  endDate: string
  academicYear: string
  isActive: boolean
}

export interface ClassTermNotice {
  classTerm: string
  currentTerm: string
  /** The class's term starts after today (YYYY-MM-DD), else null. */
  startsOn: string | null
  /** The class's term ended before today (YYYY-MM-DD), else null. */
  endedOn: string | null
}

/** The calendar day of a term date, however the API wrote it. */
const day = (value: string) => String(value ?? '').slice(0, 10)

/**
 * A notice when the class's term isn't the school's current term in the same
 * school year; null otherwise (no term, no current term, or a class from
 * another year, which a teacher opens on purpose).
 */
export function classTermNotice(
  classTermId: string | null | undefined,
  terms: readonly TermLike[],
  today: string,
): ClassTermNotice | null {
  if (!classTermId) return null
  const own = terms.find((t) => t.termId === classTermId)
  const current = terms.find((t) => t.isActive)
  if (!own || !current || own.termId === current.termId) return null
  if (own.academicYear !== current.academicYear) return null
  return {
    classTerm: own.name,
    currentTerm: current.name,
    startsOn: day(own.startDate) > today ? day(own.startDate) : null,
    endedOn: day(own.endDate) < today ? day(own.endDate) : null,
  }
}

const longDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-CA', { timeZone: 'UTC', month: 'long', day: 'numeric', year: 'numeric' })

/** The notice's sentences: a short title and the explanation. */
export function classTermNoticeText(n: ClassTermNotice): { title: string; body: string } {
  const when = n.startsOn ? ` (starts ${longDate(n.startsOn)})` : n.endedOn ? ` (ended ${longDate(n.endedOn)})` : ''
  return {
    title: `This class is set to ${n.classTerm}${when}`,
    body: `What you enter here saves to ${n.classTerm} and prints on ${n.classTerm} reports. For ${n.currentTerm}, the current term, use this grade's ${n.currentTerm} class.`,
  }
}
