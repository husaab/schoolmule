import { AssessmentScore } from '@/services/types/parentPortal'

/**
 * Nesting and status derivation for the parent-facing grade breakdown.
 *
 * Deliberately contains no grade math: a category's percentage arrives from
 * the API as `rollupPct`, computed by the same graded-only engine the
 * gradebook and the report cards use. Re-deriving it here would be another
 * copy of that formula and a guaranteed source of drift.
 *
 * Likewise a leaf's status comes straight from the API's `status` — the UI
 * never infers "missing" from `score == null`. A blank cell is "not yet
 * graded" and carries no weight; only a cell the teacher flagged counts as
 * missing (0); an excused cell never counts.
 */

export type AssessmentStatus = 'excused' | 'missing' | 'not_graded' | 'awaiting' | null

export interface AssessmentGroup {
  kind: 'standalone' | 'category'
  /** The category row, or the standalone assessment itself. */
  parent: AssessmentScore
  /** Empty for a standalone. */
  children: AssessmentScore[]
  /** Percentage to show against the group header, or null when nothing counts yet. */
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
            // A flagged-missing leaf has no score; its 0 shows as the badge.
            pct: s.status === 'graded' ? pctOf(s.score, s.maxScore) : null,
          },
    )
}

/**
 * Status for a standalone assessment or a child inside a category, straight
 * from the API's resolved cell state. Returns null for a graded leaf — the
 * percentage speaks for itself.
 */
export function leafStatus(score: AssessmentScore): AssessmentStatus {
  switch (score.status) {
    case 'excused':
      return 'excused'
    case 'missing':
      return 'missing'
    case 'blank':
      return 'not_graded'
    case 'graded':
      return null
    default:
      // Older payload without `status`: only the excused flag is trustworthy;
      // a null score is "not yet graded", never "missing".
      if (score.isExcluded) return 'excused'
      return score.score == null ? 'not_graded' : null
  }
}

/**
 * Status for a category header.
 *
 * Cannot return 'missing' or 'not_graded', by construction. A category never
 * has a score of its own, so the old flat table tagged every category
 * "Missing" even when all of its children were graded — parents were seeing
 * phantom missing work. A category with nothing counted yet reads as the
 * neutral "Awaiting scores"; one whose every child is excused reads "Excused".
 */
export function categoryStatus(group: AssessmentGroup): AssessmentStatus {
  if (group.pct != null) return null
  if (group.children.length > 0 && group.children.every((c) => leafStatus(c) === 'excused')) {
    return 'excused'
  }
  return 'awaiting'
}
