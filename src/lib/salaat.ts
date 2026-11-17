// Salaat on the grades 1-8 progress report: the homeroom teacher's Work
// Habits, Behaviour and comment per student (services/progressSalaatService).
// Pure helpers shared by the web's Salaat window and the app's sheet.
import type { SalaatRating, SalaatStudent } from '@/services/progressSalaatService'

export const SALAAT_RATINGS: { value: Exclude<SalaatRating, ''>; label: string; title: string }[] = [
  { value: 'E', label: 'E', title: 'E - Excellent' },
  { value: 'G', label: 'G', title: 'G - Good' },
  { value: 'S', label: 'S', title: 'S - Satisfactory' },
  { value: 'N', label: 'N', title: 'N - Needs Improvement' },
]

/** Done = both ratings picked (a comment is optional, as on the subject boxes). */
export const isSalaatDone = (s: Pick<SalaatStudent, 'workHabit' | 'behavior'>): boolean => !!s.workHabit && !!s.behavior

/** "12 of 23 done" for the button and the window. */
export function salaatProgress(students: Pick<SalaatStudent, 'workHabit' | 'behavior'>[]): { done: number; total: number } {
  return { done: students.filter(isSalaatDone).length, total: students.length }
}

/** The students by grade, in list order: [{ grade: '4', students: [...] }]. */
export function salaatByGrade<T extends Pick<SalaatStudent, 'grade'>>(students: T[]): { grade: string; students: T[] }[] {
  const groups: { grade: string; students: T[] }[] = []
  for (const s of students) {
    const last = groups[groups.length - 1]
    if (last && last.grade === s.grade) last.students.push(s)
    else groups.push({ grade: s.grade, students: [s] })
  }
  return groups
}

/** The comment's longest allowed length (the API refuses more). */
export const SALAAT_COMMENT_MAX = 2000
