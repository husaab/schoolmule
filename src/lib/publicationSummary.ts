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
 * Wording for a summary, in the spec's words (Publish / Published, never
 * "sent"). `short` fits a column header; `long` reads as a sentence in a
 * modal chip.
 */
export function publicationLabel(s: PublicationSummary, style: 'short' | 'long'): string {
  const long = style === 'long'
  switch (s.state) {
    case 'none':
      return long ? 'Not published yet' : 'Not published'
    case 'partial':
      return `${s.published} of ${s.total} published`
    case 'all':
      return long && s.isCategory ? `All ${s.total} published` : 'Published'
  }
}

/** Tooltip for a header badge. Published grades reach students as well as parents. */
export function publicationTitle(s: PublicationSummary): string {
  switch (s.state) {
    case 'none':
      return 'Students and parents can’t see these grades yet'
    case 'partial':
      return `${s.published} of ${s.total} assessments are published to students and parents. Click to manage.`
    case 'all':
      return 'Published to students and parents. Click to manage or unpublish.'
  }
}
