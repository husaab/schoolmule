// Where an assessment counts in the gradebook: on its own, or inside a
// category (a "multiple assessment" that holds several). Used by the
// assessment edit form's "Counts toward" picker, its "Make this a multiple
// assessment" box and the line that says what a move will do. A moved
// assessment keeps its points; the category it joins grows by them and the
// one it leaves shrinks by them (removed when emptied), so the class stays at
// 100 (backend: services/classroom/assessmentStructure.js).

import type { AssessmentPayload } from '@/services/types/assessment'

/** The picker's value for "counts on its own". */
export const ON_ITS_OWN = ''

export interface CountsTowardOption {
  value: string
  label: string
}

// The API sends points as text ("90.00"); drop the trailing zeros.
const pointsOf = (a: AssessmentPayload): number => Number(a.weightPoints || 0)
const pts = (n: number): string => String(Math.round(n * 100) / 100)

const byListOrder = (x: AssessmentPayload, y: AssessmentPayload) => (x.sortOrder || 0) - (y.sortOrder || 0)

/** "On its own", then every category with its points, in list order. */
export function countsTowardOptions(all: AssessmentPayload[]): CountsTowardOption[] {
  const categories = all.filter((a) => a.isParent).sort(byListOrder)
  return [
    { value: ON_ITS_OWN, label: 'On its own' },
    ...categories.map((c) => ({ value: c.assessmentId, label: `${c.name} (${pts(pointsOf(c))} pts)` })),
  ]
}

/** Only an assessment that counts on its own can become a multiple assessment. */
export const canBecomeCategory = (a: AssessmentPayload): boolean => !a.isParent && !a.parentAssessmentId

/** What moving `a` to `target` (a category id, or ON_ITS_OWN) will do, in a sentence or two; null when it stays put. */
export function moveSummary(all: AssessmentPayload[], a: AssessmentPayload, target: string): string | null {
  const from = a.parentAssessmentId || ON_ITS_OWN
  if (from === target) return null
  const points = pointsOf(a)
  const find = (id: string) => all.find((x) => x.assessmentId === id)
  const parts: string[] = []
  const to = target ? find(target) : undefined
  if (to) {
    const before = pointsOf(to)
    parts.push(`${a.name} keeps its ${pts(points)} points inside ${to.name}, which goes from ${pts(before)} to ${pts(before + points)} points.`)
  } else {
    parts.push(`${a.name} counts on its own with its ${pts(points)} points.`)
  }
  const source = from ? find(from) : undefined
  if (source) {
    const others = all.filter((x) => x.parentAssessmentId === source.assessmentId && x.assessmentId !== a.assessmentId)
    const before = pointsOf(source)
    parts.push(
      others.length === 0
        ? `${source.name} has nothing else in it, so it is removed.`
        : `${source.name} goes from ${pts(before)} to ${pts(Math.max(0, before - points))} points.`,
    )
  }
  return parts.join(' ')
}
