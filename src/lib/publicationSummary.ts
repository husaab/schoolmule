// Publish state of one gradebook column, shared by the column header badge
// and the category modal chip so the two can never disagree.
//
// A category is judged by its children, not by its own flag: publishing a
// category publishes its graded children, and unpublishing the category does
// not cascade, so the children are the parent-facing truth.

import type { AssessmentPayload } from '@/services/types/assessment'

export type PublicationState = 'none' | 'partial' | 'all'

export interface PublicationSummary {
  published: number
  total: number
  state: PublicationState
  isCategory: boolean
}

type PublishedLookup = Record<string, { isPublished?: boolean } | undefined>
type AssessmentLike = Pick<AssessmentPayload, 'assessmentId' | 'isParent' | 'parentAssessmentId'>

export function summarizePublication(
  assessment: Pick<AssessmentPayload, 'assessmentId' | 'isParent'>,
  allAssessments: AssessmentLike[],
  publications: PublishedLookup
): PublicationSummary {
  const isPublished = (id: string) => publications[id]?.isPublished === true

  if (!assessment.isParent) {
    const published = isPublished(assessment.assessmentId) ? 1 : 0
    return { published, total: 1, state: published ? 'all' : 'none', isCategory: false }
  }

  const children = allAssessments.filter((c) => c.parentAssessmentId === assessment.assessmentId)
  const total = children.length
  const published = children.filter((c) => isPublished(c.assessmentId)).length
  const state: PublicationState =
    published === 0 ? 'none' : published === total ? 'all' : 'partial'
  return { published, total, state, isCategory: true }
}

/**
 * Wording for a summary. `short` fits a column header; `long` reads as a
 * sentence in a modal chip.
 */
export function publicationLabel(s: PublicationSummary, style: 'short' | 'long'): string {
  const long = style === 'long'
  switch (s.state) {
    case 'none':
      return long ? 'Not published to parents yet' : 'Not sent'
    case 'partial':
      return long ? `${s.published} of ${s.total} sent to parents` : `${s.published} of ${s.total} sent`
    case 'all':
      if (s.isCategory) return long ? `All ${s.total} live to parents` : `All ${s.total} sent`
      return long ? 'Live to parents' : '● Live'
  }
}

/** Tooltip for a header badge. */
export function publicationTitle(s: PublicationSummary): string {
  switch (s.state) {
    case 'none':
      return 'Not visible to parents yet'
    case 'partial':
      return `${s.published} of ${s.total} individual assessments are live to parents — click to manage`
    case 'all':
      return 'Live to parents — click to manage or unpublish'
  }
}
