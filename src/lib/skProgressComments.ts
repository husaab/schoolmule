// src/lib/skProgressComments.ts
// The SK progress report's "Strengths/Next Steps for Improvement" rows, as on
// Al Haadi's paper template. They are saved as SK progress-report comments
// keyed by `key` (sk_progress_report_comments.section_type), and the PDF
// prints them in this order: schoolmule-backend's
// templates/alHaadiProgressReportSKTemplate.js keeps the same list.

/** Which rated standards a row's AI comment is written from. */
interface RowSource {
  /** Lowercase text the subject's name contains. */
  subject: string
  /** Only the subject's standards whose name matches (all when absent). */
  standard?: RegExp
}

export interface SKProgressCommentRow {
  key: string
  label: string
  caption?: string
  sources: RowSource[]
}

export const SK_PROGRESS_COMMENT_ROWS: readonly SKProgressCommentRow[] = [
  {
    key: 'language_arts',
    label: 'Language Arts',
    caption: 'Reading, Writing, Oral communication, Media Literacy',
    sources: [{ subject: 'language' }, { subject: 'literacy' }],
  },
  { key: 'mathematics', label: 'Mathematics', sources: [{ subject: 'math' }] },
  { key: 'science', label: 'Science', sources: [{ subject: 'science' }] },
  { key: 'social_studies', label: 'Social Studies', sources: [{ subject: 'social' }] },
  { key: 'quran', label: 'Quran', sources: [{ subject: 'quran', standard: /surah|quran|participation/i }] },
  { key: 'arabic', label: 'Arabic', sources: [{ subject: 'arabic', standard: /arabic|participation/i }] },
  { key: 'islamic_studies', label: 'Islamic Studies', sources: [{ subject: 'islamic' }] },
  { key: 'creativity', label: 'Creativity', sources: [{ subject: 'creativ' }] },
  { key: 'french', label: 'French', sources: [{ subject: 'french' }] },
]

interface SubjectLike {
  name: string
  standards: { standardId: string; name: string; description?: string | null }[]
}

export interface RatedStandard {
  name: string
  rating: string
  description?: string
}

/**
 * The rated standards behind one row (what its AI comment is written from),
 * each standard once, in subject order. Empty when nothing it covers is rated.
 */
export function ratedStandardsForRow(
  row: SKProgressCommentRow,
  subjects: readonly SubjectLike[],
  ratings: Record<string, string>,
): RatedStandard[] {
  const seen = new Set<string>()
  const out: RatedStandard[] = []
  for (const subject of subjects) {
    const name = subject.name.toLowerCase()
    const matching = row.sources.filter((src) => name.includes(src.subject))
    if (matching.length === 0) continue
    for (const standard of subject.standards) {
      const rating = ratings[standard.standardId]
      if (!rating || seen.has(standard.standardId)) continue
      if (!matching.some((src) => !src.standard || src.standard.test(standard.name))) continue
      seen.add(standard.standardId)
      out.push({ name: standard.name, rating, description: standard.description || undefined })
    }
  }
  return out
}
