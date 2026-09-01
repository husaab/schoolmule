import { AssessmentScore } from '@/services/types/parentPortal'

/**
 * Nesting and status derivation for the parent-facing grade breakdown.
 *
 * Deliberately contains no grade math: a category's percentage arrives from
 * the API as `rollupPct`, computed by the same null-skip helper the report
 * cards and the gradebook use. Re-deriving it here would be a fourth copy
 * of that formula and a guaranteed source of drift.
 */

export type AssessmentStatus = 'excluded' | 'missing' | 'awaiting' | null

export interface AssessmentGroup {
  kind: 'standalone' | 'category'
  /** The category row, or the standalone assessment itself. */
  parent: AssessmentScore
  /** Empty for a standalone. */
  children: AssessmentScore[]
  /** Percentage to show against the group header, or null when ungraded. */
  pct: number | null
}

/** score/max as a percentage, or null when either is missing. */
export const pctOf = (score: number | null, maxScore: number | null): number | null =>
  score != null && maxScore ? Math.round((score / maxScore) * 1000) / 10 : null

/**
 * Nest children under their category, preserving the API's ordering (rows
 * arrive sorted by the teacher's sort_order).
 */
export function groupAssessmentScores(scores: AssessmentScore[]): AssessmentGroup[] {
  const childrenByParent = new Map<string, AssessmentScore[]>()
  for (const s of scores) {
    if (!s.parentAssessmentId) continue
    const existing = childrenByParent.get(s.parentAssessmentId)
    if (existing) existing.push(s)
    else childrenByParent.set(s.parentAssessmentId, [s])
  }

  return scores
    .filter((s) => !s.parentAssessmentId)
    .map<AssessmentGroup>((s) =>
      s.isParent
        ? {
            kind: 'category',
            parent: s,
            children: childrenByParent.get(s.assessmentId) ?? [],
            pct: s.rollupPct,
          }
        : {
            kind: 'standalone',
            parent: s,
            children: [],
            pct: pctOf(s.score, s.maxScore),
          },
    )
}

/** Status for a standalone assessment or a child inside a category. */
export function leafStatus(score: AssessmentScore): AssessmentStatus {
  if (score.isExcluded) return 'excluded'
  if (score.score == null) return 'missing'
  return null // graded — the percentage speaks for itself
}

/**
 * Status for a category header.
 *
 * Cannot return 'missing', by construction. A category never has a score of
 * its own, so the old flat table tagged every category "Missing" even when
 * all of its children were graded — parents were seeing phantom missing
 * work. An ungraded category reads as the neutral "Awaiting scores".
 */
export function categoryStatus(group: AssessmentGroup): AssessmentStatus {
  if (group.pct != null) return null
  if (group.children.length > 0 && group.children.every((c) => c.isExcluded)) return 'excluded'
  return 'awaiting'
}
