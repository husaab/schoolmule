// src/lib/countsToward.ts
// The words the classwork item form uses for how graded work counts, so a
// teacher never has to guess which number is which:
//   - "Worth" is a share of the final grade: a category's whole share, or the
//     share of a column that counts on its own. The class is 100 points, so a
//     point reads as a percent.
//   - "Marked out of" is only the scale scores are entered on (24/30 is 80%).
// Also the checks of the "New category" window. Pure, so it is unit-tested
// (countsToward.test.ts).

import type { CategoryOption } from '@/services/types/classwork'
import { MAX_WEIGHT_POINTS, parseWeight, weightPointsError, type GradebookMode } from './itemForm'

/** The "Counts toward" choices that are not a category. */
export const ON_ITS_OWN = '__own__'
export const NEW_CATEGORY = '__new__'

export const CATEGORY_NAME_MAX = 200
export const CATEGORIES_PLACE = 'Grades → Assessments & categories'

const round2 = (n: number) => Math.round(n * 100) / 100
const num = (n: number) => String(round2(n))

function ordinal(n: number): string {
  const tens = n % 100
  if (tens >= 11 && tens <= 13) return `${n}th`
  return `${n}${['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
}

/** "24/30 is 80%": what a good score on that scale comes to; null when `max` is not a scale. */
export function scoreExample(max: number): string | null {
  // A scale that rounds to nothing (0.004) has no example worth printing.
  if (!Number.isFinite(max) || round2(max) <= 0) return null
  const score = max >= 5 ? Math.round(max * 0.8) : max
  return `${num(score)}/${num(max)} is ${Math.round((score / max) * 100)}%`
}

export interface CountsSummaryInput {
  mode: GradebookMode
  /** The category picked (mode 'category'). */
  category: Pick<CategoryOption, 'assessmentId' | 'name' | 'weightPoints' | 'childCount'> | null
  /** "Marked out of" and "Worth", as typed. */
  maxScore: string
  weightPoints: string
  /** The column the item fills as saved (an edit): its category and its own share. */
  current?: { categoryId: string | null; weightPoints: number | null } | null
  /** The item sets its own "Out of" (a quiz is out of its questions' points): say nothing about it. */
  ownMax?: boolean
}

/**
 * What the form's gradebook choices come to, one sentence each: the scale
 * scores are entered on, then how much of the final grade rides on it. A new
 * column under a category takes an equal share of the category's points and
 * the columns already there shrink to make room (the server's
 * rescaleForInsert), so the category's own share never changes.
 */
export function countsSummary({ mode, category, maxScore, weightPoints, current = null, ownMax = false }: CountsSummaryInput): string[] {
  if (mode !== 'category' && mode !== 'standalone') return []
  const lines: string[] = []
  const example = ownMax || maxScore.trim() === '' ? null : scoreExample(Number(maxScore))
  if (example) lines.push(`Scores are entered out of ${num(Number(maxScore))}, so ${example}.`)

  if (mode === 'standalone') {
    if (!weightPointsError(weightPoints)) {
      lines.push(`It counts on its own, for ${num(parseWeight(weightPoints))}% of the final grade.`)
    }
    return lines
  }
  if (!category) return lines

  const share = num(category.weightPoints)
  if (category.weightPoints <= 0) {
    lines.push(`${category.name} has no share of the final grade yet, so nothing in it counts. Give it one in ${CATEGORIES_PLACE}.`)
    return lines
  }
  const worth = `${category.name} is worth ${share}% of the final grade`
  if (current && current.categoryId === category.assessmentId) {
    const count = Math.max(category.childCount, 1)
    const own = current.weightPoints != null ? ` This one carries ${num(current.weightPoints)}%.` : ''
    const split = count > 1 ? ` Change the split in ${CATEGORIES_PLACE}.` : ''
    lines.push(`${worth}${count > 1 ? `, shared by its ${count} assessments` : ''}.${own}${split}`)
    return lines
  }
  const place = category.childCount + 1
  if (place === 1) {
    lines.push(`${worth}. This will be its first assessment, so it carries all ${share}%.`)
  } else {
    lines.push(
      `${worth}. This will be its ${ordinal(place)} assessment, so it carries about ${num(category.weightPoints / place)}% and the others shrink to make room. Change the split in ${CATEGORIES_PLACE}.`,
    )
  }
  return lines
}

export interface WeightNote {
  text: string
  /** The class would add up to more than 100%. */
  over: boolean
}

/**
 * Under a "Worth" box: where the class's 100% stands. `otherPoints` is what
 * everything else in the class already adds up to; `typed` is the box.
 * Going over 100 is said, not refused (Grades says the same in its banner).
 */
export function weightNote(otherPoints: number, typed: string): WeightNote {
  const other = round2(otherPoints)
  if (!weightPointsError(typed)) {
    const total = round2(other + parseWeight(typed))
    if (total > MAX_WEIGHT_POINTS) {
      return { text: `With this the class adds up to ${num(total)}%. It should add up to 100%: rebalance in ${CATEGORIES_PLACE}.`, over: true }
    }
    if (total === MAX_WEIGHT_POINTS) return { text: 'That brings the class to exactly 100%.', over: false }
    return { text: `Leaves ${num(MAX_WEIGHT_POINTS - total)}% of the final grade unassigned.`, over: false }
  }
  if (other > MAX_WEIGHT_POINTS) return { text: `The class already adds up to ${num(other)}%, over 100%.`, over: true }
  if (other === MAX_WEIGHT_POINTS) return { text: 'The class already adds up to 100%.', over: false }
  if (other === 0) return { text: "Nothing is assigned yet. Everything in the class should add up to 100%.", over: false }
  return { text: `${num(MAX_WEIGHT_POINTS - other)}% of the final grade isn't assigned yet.`, over: false }
}

/** What a "Worth" box starts with: what is left of the class's 100%, when part of it is taken and part is free. */
export function suggestedWeight(otherPoints: number): string {
  const left = round2(MAX_WEIGHT_POINTS - otherPoints)
  return left > 0 && left < MAX_WEIGHT_POINTS ? num(left) : ''
}

export interface CategoryFormErrors {
  name?: string
  weightPoints?: string
}

/** The "New category" window's checks (the server's createCategory applies the same). */
export function validateCategoryForm(values: { name: string; weightPoints: string }): CategoryFormErrors {
  const errors: CategoryFormErrors = {}
  const name = values.name.trim()
  if (!name) errors.name = 'Give the category a name'
  else if (name.length > CATEGORY_NAME_MAX) errors.name = `Keep the name to ${CATEGORY_NAME_MAX} characters`
  const weight = weightPointsError(values.weightPoints)
  if (weight) errors.weightPoints = weight
  return errors
}
