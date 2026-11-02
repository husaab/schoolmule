// Report card comment details: what a teacher can tell the AI about a student
// in one subject, beyond the Work Habits and Behaviour letters. The list is a
// teacher's (Maryam, Al Haadi, 2026-11-02), the same in every subject. Every
// detail is optional, none of it prints on the report card, and it is only
// sent to the AI that writes the comment (/api/ai/generate-comment).
//
// Saved picks are stable keys; the wording lives here. In the page a
// student's details are one string (serializeDetails), so they autosave like
// the other comment fields; reportCardService converts that string to and
// from the object the server stores (toWireDetails, fromWireDetails). A key
// this list no longer knows is ignored wherever details are read.

export type DetailGroup = 'subject' | 'skills'

export interface DetailOption {
  key: string
  label: string
}

export interface DetailItem {
  key: string
  group: DetailGroup
  label: string
  options: readonly DetailOption[]
}

export interface CommentDetails {
  /** Item key → option key. */
  picks: Record<string, string>
  note: string
}

const item = (key: string, group: DetailGroup, label: string, options: [string, string][]): DetailItem => ({
  key,
  group,
  label,
  options: options.map(([k, l]) => ({ key: k, label: l })),
})

export const REPORT_CARD_DETAILS: readonly DetailItem[] = [
  item('achievement', 'subject', 'Overall achievement', [
    ['excellent', 'Excellent'],
    ['veryGood', 'Very good'],
    ['good', 'Good'],
    ['satisfactory', 'Satisfactory'],
    ['developing', 'Developing'],
    ['needsSignificantSupport', 'Needs significant support'],
  ]),
  item('understanding', 'subject', 'Understanding of concepts', [
    ['strong', 'Demonstrates strong understanding'],
    ['most', 'Understands most concepts'],
    ['basic', 'Understands basic concepts'],
    ['difficulty', 'Has difficulty understanding new concepts'],
  ]),
  item('application', 'subject', 'Application of skills', [
    ['independent', 'Applies skills independently'],
    ['occasionalHelp', 'Applies skills with occasional assistance'],
    ['needsGuidance', 'Requires guidance'],
    ['struggles', 'Struggles to apply learned skills'],
  ]),
  item('completion', 'subject', 'Completion of work', [
    ['consistent', 'Consistently completes work'],
    ['usual', 'Usually completes work'],
    ['sometimesIncomplete', 'Sometimes leaves work incomplete'],
    ['needsMoreTime', 'Frequently requires additional time'],
  ]),
  item('participation', 'subject', 'Participation', [
    ['active', 'Actively participates'],
    ['regular', 'Participates regularly'],
    ['whenEncouraged', 'Participates when encouraged'],
    ['rarely', 'Rarely participates'],
  ]),
  item('progress', 'subject', 'Progress', [
    ['significant', 'Significant improvement'],
    ['steady', 'Steady progress'],
    ['some', 'Some progress'],
    ['limited', 'Limited progress'],
    ['inconsistent', 'Inconsistent progress'],
  ]),
  item('responsibility', 'skills', 'Responsibility', [
    ['excellent', 'Excellent'],
    ['veryGood', 'Very good'],
    ['good', 'Good'],
    ['developing', 'Developing'],
    ['needsImprovement', 'Needs improvement'],
  ]),
  item('organization', 'skills', 'Organization', [
    ['very', 'Very organized'],
    ['usually', 'Usually organized'],
    ['sometimesDisorganized', 'Sometimes disorganized'],
    ['needsSupport', 'Needs support'],
  ]),
  item('independentWork', 'skills', 'Independent work', [
    ['independent', 'Works independently'],
    ['usually', 'Usually works independently'],
    ['needsReminders', 'Occasionally needs reminders'],
    ['needsFrequentHelp', 'Requires frequent assistance'],
  ]),
  item('collaboration', 'skills', 'Collaboration', [
    ['exceptional', 'Works exceptionally well with others'],
    ['cooperates', 'Cooperates well'],
    ['withEncouragement', 'Participates with some encouragement'],
    ['struggles', 'Struggles with group work'],
  ]),
  item('initiative', 'skills', 'Initiative', [
    ['takes', 'Takes initiative'],
    ['whenEncouraged', 'Shows initiative when encouraged'],
    ['rarely', 'Rarely takes initiative'],
  ]),
  item('selfRegulation', 'skills', 'Self-regulation', [
    ['consistent', 'Consistently manages behaviour and emotions'],
    ['usually', 'Usually self-regulates'],
    ['needsReminders', 'Sometimes needs reminders'],
    ['needsFrequentSupport', 'Requires frequent support'],
  ]),
  item('focus', 'skills', 'Focus', [
    ['consistent', 'Consistently focused'],
    ['usually', 'Usually focused'],
    ['occasionallyDistracted', 'Occasionally distracted'],
    ['frequentlyDistracted', 'Frequently distracted'],
  ]),
  item('effort', 'skills', 'Effort', [
    ['best', 'Consistently gives best effort'],
    ['good', 'Usually puts in good effort'],
    ['varies', 'Effort varies'],
    ['needsEncouragement', 'Needs encouragement to complete tasks'],
  ]),
]

export const DETAIL_NOTE_MAX = 300

export const EMPTY_DETAILS: CommentDetails = { picks: {}, note: '' }

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

/** The details with only items and options this list knows, in list order; the note as a string. */
export function cleanDetails(value: unknown): CommentDetails {
  if (!isRecord(value)) return { picks: {}, note: '' }
  const raw = isRecord(value.picks) ? value.picks : {}
  const picks: Record<string, string> = {}
  for (const it of REPORT_CARD_DETAILS) {
    const v = raw[it.key]
    if (typeof v === 'string' && it.options.some((o) => o.key === v)) picks[it.key] = v
  }
  return { picks, note: typeof value.note === 'string' ? value.note : '' }
}

/** A student's saved details (the page's string form); anything unreadable is no details. */
export function parseDetails(text: string | null | undefined): CommentDetails {
  if (!text) return { picks: {}, note: '' }
  try {
    return cleanDetails(JSON.parse(text))
  } catch {
    return { picks: {}, note: '' }
  }
}

/** The page's string form: '' when nothing is picked and the note is empty. */
export function serializeDetails(d: CommentDetails): string {
  const clean = cleanDetails(d)
  if (Object.keys(clean.picks).length === 0 && clean.note === '') return ''
  return JSON.stringify({ picks: clean.picks, note: clean.note })
}

export function countDetails(d: CommentDetails): number {
  return Object.keys(cleanDetails(d).picks).length
}

/** Overall achievement from the mark (option key), or null with no mark. */
export function suggestAchievement(pct: number | null | undefined): string | null {
  if (typeof pct !== 'number' || !Number.isFinite(pct)) return null
  if (pct >= 90) return 'excellent'
  if (pct >= 80) return 'veryGood'
  if (pct >= 70) return 'good'
  if (pct >= 60) return 'satisfactory'
  if (pct >= 50) return 'developing'
  return 'needsSignificantSupport'
}

/**
 * Completion of work from the share of marked work that is missing (option
 * key): `assessed` is graded plus missing, so work not marked yet and excused
 * work don't count. Null with nothing marked: no evidence, no suggestion.
 */
export function suggestCompletion(coverage: { missing: number; assessed: number } | null | undefined): string | null {
  if (!coverage || !(coverage.assessed > 0)) return null
  if (!(coverage.missing > 0)) return 'consistent'
  return coverage.missing / coverage.assessed <= 0.1 ? 'usual' : 'sometimesIncomplete'
}

/** The two details SchoolMule can suggest from the data. Never saved until the teacher taps them. */
export function detailSuggestions(
  pct: number | null | undefined,
  coverage: { missing: number; assessed: number } | null | undefined,
): Partial<Record<string, string>> {
  const out: Partial<Record<string, string>> = {}
  const achievement = suggestAchievement(pct)
  if (achievement) out.achievement = achievement
  const completion = suggestCompletion(coverage)
  if (completion) out.completion = completion
  return out
}

/** What the server stores: undefined (not sent, keep what is saved), null (clear) or the details. */
export function toWireDetails(text: string | undefined): CommentDetails | null | undefined {
  if (text === undefined) return undefined
  if (text === '') return null
  return parseDetails(text)
}

/** The page's string form of what the server sent, or null for none. */
export function fromWireDetails(wire: unknown): string | null {
  return serializeDetails(cleanDetails(wire)) || null
}

/** The AI request's details: only what was picked, and the note when there is one. */
export function aiDetailsPayload(d: CommentDetails): { details?: Record<string, string>; note?: string } {
  const clean = cleanDetails(d)
  const out: { details?: Record<string, string>; note?: string } = {}
  if (Object.keys(clean.picks).length > 0) out.details = clean.picks
  const note = clean.note.trim()
  if (note) out.note = note
  return out
}

const pickLines = (d: CommentDetails, group: DetailGroup): string[] =>
  REPORT_CARD_DETAILS.filter((it) => it.group === group && d.picks[it.key]).map(
    (it) => `- ${it.label}: ${it.options.find((o) => o.key === d.picks[it.key])!.label}`,
  )

/** The prompt's account of what the teacher observed; '' when they picked nothing and wrote no note. */
export function detailsPromptSection(d: CommentDetails, subject: string): string {
  const clean = cleanDetails(d)
  const lines: string[] = []
  const subjectLines = pickLines(clean, 'subject')
  if (subjectLines.length) lines.push(`What the teacher observed in ${subject}:`, ...subjectLines)
  const skillLines = pickLines(clean, 'skills')
  if (skillLines.length) lines.push('Learning skills and work habits:', ...skillLines)
  const note = clean.note.trim()
  if (note) lines.push(`Teacher's note: ${note}`)
  return lines.join('\n')
}

/** An AI draft asks first unless the comment is empty or still the AI's own last draft, untouched. */
export function shouldConfirmAiReplace(comment: string | null | undefined, lastDraft: string | null | undefined): boolean {
  const current = comment ?? ''
  if (current.trim() === '') return false
  return current !== lastDraft
}
