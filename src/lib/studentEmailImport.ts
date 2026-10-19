// src/lib/studentEmailImport.ts
// Pure rules behind Student accounts → Import emails: reading a pasted list,
// guessing which column is which from its header, reading grades loosely,
// turning rows into { name, email, grade } lines for the server's matching,
// and the CSV of rows that weren't saved. Unit-tested (studentEmailImport.test.ts).

import type { GradeCode } from '@/services/types/studentAccount'

export type ColumnRole = 'full_name' | 'first_name' | 'last_name' | 'email' | 'grade' | 'ignore'

export const COLUMN_ROLE_LABELS: Record<ColumnRole, string> = {
  full_name: 'Full name',
  first_name: 'First name',
  last_name: 'Last name',
  email: 'Student email',
  grade: 'Grade',
  ignore: "Don't use",
}

export const COLUMN_ROLES: readonly ColumnRole[] = ['full_name', 'first_name', 'last_name', 'email', 'grade', 'ignore']

/** A first guess from a column's header ("Email Address" → email, "Org Unit Path" → grade). */
export const guessRole = (header: string): ColumnRole => {
  const h = header.trim().toLowerCase()
  if (/e-?mail/.test(h)) return 'email'
  if (/first|given/.test(h)) return 'first_name'
  if (/last|family|surname/.test(h)) return 'last_name'
  if (/grade|org ?unit/.test(h)) return 'grade'
  if (/name|student/.test(h)) return 'full_name'
  return 'ignore'
}

/** Guesses for every header, each role used at most once (the first column wins). */
export const guessRoles = (headers: string[]): ColumnRole[] => {
  const used = new Set<ColumnRole>()
  return headers.map((h) => {
    const role = guessRole(h)
    if (role === 'ignore' || used.has(role)) return 'ignore'
    used.add(role)
    return role
  })
}

/**
 * A grade as the school writes it: "5", "Grade 5", "Gr. 5", "/Students/Grade 5",
 * "JK", "Junior Kindergarten". null when it can't tell (plain "Kindergarten",
 * Grade 9+, anything else).
 */
export const parseGrade = (raw: string): GradeCode | null => {
  const text = raw.trim().toLowerCase()
  if (!text) return null
  if (/\bjk\b|junior\s*k/.test(text)) return 'JK'
  if (/\bsk\b|senior\s*k/.test(text)) return 'SK'
  const tail = text.split('/').filter(Boolean).pop() ?? text
  const m = /^(?:grade|gr|g)?\.?\s*(\d{1,2})$/.exec(tail.trim())
  if (!m) return null
  const n = Number(m[1])
  return n >= 1 && n <= 8 ? (String(n) as GradeCode) : null
}

/** One CSV-ish line into cells, honouring double quotes. */
const splitLine = (line: string, sep: string): string[] => {
  const cells: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') { cell += '"'; i += 1 } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === sep) { cells.push(cell.trim()); cell = '' } else cell += ch
  }
  cells.push(cell.trim())
  return cells
}

/**
 * A pasted list into rows. Each line splits on tabs (a paste from a
 * spreadsheet), else commas, else semicolons; blank lines are dropped.
 */
export const parsePasted = (text: string): string[][] =>
  text
    .split(/\r?\n/)
    .filter((line) => line.trim() !== '')
    .map((line) => splitLine(line, line.includes('\t') ? '\t' : line.includes(',') ? ',' : ';'))

/** A first row is a header when none of its cells is an address. */
export const looksLikeHeader = (row: string[]): boolean => !row.some((cell) => cell.includes('@'))

export interface ImportLine {
  /** The row's position in the file (0-based, header included). */
  index: number
  name: string
  email: string
  grade: GradeCode | null
  /** The grade column had something in it that isn't a grade. */
  gradeUnread: boolean
}

/** Rows into lines, using the chosen column roles. Rows with neither a name nor an address are dropped. */
export const applyMapping = (rows: string[][], roles: ColumnRole[], hasHeader: boolean): ImportLine[] => {
  const col = (role: ColumnRole) => roles.indexOf(role)
  const [full, first, last, email, grade] = (['full_name', 'first_name', 'last_name', 'email', 'grade'] as const).map(col)
  const cell = (row: string[], i: number) => (i >= 0 ? (row[i] ?? '').trim() : '')
  const out: ImportLine[] = []
  rows.forEach((row, index) => {
    if (hasHeader && index === 0) return
    const name = cell(row, full) || [cell(row, first), cell(row, last)].filter(Boolean).join(' ')
    const address = cell(row, email).toLowerCase()
    if (!name && !address) return
    const rawGrade = cell(row, grade)
    const parsed = rawGrade ? parseGrade(rawGrade) : null
    out.push({ index, name: name.replace(/\s+/g, ' '), email: address, grade: parsed, gradeUnread: Boolean(rawGrade) && parsed === null })
  })
  return out
}

/** What stops the column choices from being used, in the order to fix them. */
export const mappingProblems = (roles: ColumnRole[]): string[] => {
  const problems: string[] = []
  if (!roles.includes('email')) problems.push('Choose the Student email column')
  if (!roles.includes('full_name') && !(roles.includes('first_name') && roles.includes('last_name'))) {
    problems.push('Choose Full name, or First name and Last name')
  }
  for (const role of COLUMN_ROLES) {
    if (role !== 'ignore' && roles.filter((r) => r === role).length > 1) problems.push(`Two columns are set to ${COLUMN_ROLE_LABELS[role]}`)
  }
  return problems
}

const csvCell = (value: string) => (/[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value)

/** The rows that weren't saved, with why, as a CSV the office can fix and import again. */
export const unsavedCsv = (rows: { name: string; email: string; why: string }[]): string =>
  ['Name,Email,Why', ...rows.map((r) => [r.name, r.email, r.why].map(csvCell).join(','))].join('\r\n') + '\r\n'
