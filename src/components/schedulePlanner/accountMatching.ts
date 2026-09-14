// Suggests which SchoolMule account a planner teacher belongs to, so admins can
// link with one click. Planner names are informal ("Sr. Afsheen", "Sayed Ali")
// while accounts carry legal names ("Afsheen Khan"), so this matches on name
// tokens after dropping titles. It only ever suggests; the admin confirms.

import type { TeacherPayload } from '@/services/types/teacher'

const TITLES = new Set([
  'sr', 'sis', 'sister', 'br', 'bro', 'brother', 'mr', 'mrs', 'ms', 'miss', 'mx', 'dr',
  'sir', 'madam', 'teacher', 'sayed', 'sayyed', 'syed', 'sayyid', 'sheikh', 'shaykh',
  'imam', 'ustadh', 'ustadha', 'ustaz', 'ustaza', 'moulana', 'maulana',
])

/** Lowercased, accent-free name tokens with titles removed. */
const nameTokens = (name: string): string[] =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .split(/[^a-z]+/)
    .filter((t) => t.length >= 3 && !TITLES.has(t))

const editDistance = (a: string, b: string): number => {
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i)
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0]
    prev[0] = i
    for (let j = 1; j <= b.length; j++) {
      const above = prev[j]
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1))
      diag = above
    }
  }
  return prev[b.length]
}

/** 2 for an exact token, 1 for a near miss ("Jannatte" ~ "Jannat"), else 0. */
const tokenScore = (a: string, b: string): number => {
  if (a === b) return 2
  if (Math.min(a.length, b.length) >= 5 && (a.startsWith(b) || b.startsWith(a))) return 1
  if (Math.min(a.length, b.length) >= 5 && editDistance(a, b) <= 1) return 1
  return 0
}

/**
 * The single best account for a planner display name, or null when nothing
 * matches or two accounts match equally well (an ambiguous guess is worse
 * than no guess).
 */
export const suggestAccount = (
  displayName: string,
  accounts: TeacherPayload[]
): TeacherPayload | null => {
  const wanted = nameTokens(displayName)
  if (wanted.length === 0) return null

  let best: TeacherPayload | null = null
  let bestScore = 0
  let tied = false
  for (const account of accounts) {
    const have = nameTokens(account.fullName)
    const score = wanted.reduce(
      (sum, w) => sum + Math.max(0, ...have.map((h) => tokenScore(w, h))),
      0
    )
    if (score > bestScore) {
      best = account
      bestScore = score
      tied = false
    } else if (score > 0 && score === bestScore) {
      tied = true
    }
  }
  return tied ? null : best
}
