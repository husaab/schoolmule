// Salaat on the grades 1-8 progress report (schools.progress_salaat): the
// homeroom teacher's Work Habits, Behaviour and comment per student per term,
// printed as a "Salaat" box after the subject cards.
import apiClient from './apiClient'

/** '' = not rated. */
export type SalaatRating = '' | 'E' | 'G' | 'S' | 'N'

export interface SalaatEntry {
  workHabit: SalaatRating
  behavior: SalaatRating
  comment: string
  updatedAt: string | null
}

export interface SalaatStudent extends SalaatEntry {
  studentId: string
  name: string
  /** '1'…'8' */
  grade: string
  homeroomTeacherId: string | null
  homeroomTeacher: string
}

export interface SalaatRoster {
  /** The school prints Salaat on its progress reports. */
  enabled: boolean
  /** Fills in anyone's (classes.all); otherwise only the caller's homeroom students are listed. */
  canEditAll: boolean
  students: SalaatStudent[]
}

/** The students the caller may fill in Salaat for, with their entry for `term`. */
export async function getSalaat(term: string): Promise<SalaatRoster> {
  const res = await apiClient<{ status: string; data: SalaatRoster }>(`/progress-reports/salaat?term=${encodeURIComponent(term)}`)
  return res.data
}

/** Saves one student's entry; every rating and the comment empty removes it. */
export async function saveSalaat(studentId: string, entry: { term: string; workHabit: SalaatRating; behavior: SalaatRating; comment: string }): Promise<SalaatEntry> {
  const res = await apiClient<{ status: string; data: SalaatEntry }>(`/progress-reports/salaat/${encodeURIComponent(studentId)}`, {
    method: 'PUT',
    body: entry,
  })
  return res.data
}
