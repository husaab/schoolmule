// The student profile modal lives in the URL of whatever page it is open
// over: ?profile=<studentId>, plus profileTab / profileTerm / profileClass
// for the view inside it. (Not ?student=: the JK/SK report-card tabs and
// the Student Summary report already use that for their own picker.)
// Opening pushes a history entry so Back closes the modal and leaves the
// page exactly as it was; switching tab or term replaces it. All four keys
// are transient in filter memory (lib/filterMemory), so no page ever
// "remembers" an open profile. Pure functions only; the React side is
// hooks/useStudentProfile.

export const STUDENT_PROFILE_PARAMS = {
  id: 'profile',
  tab: 'profileTab',
  term: 'profileTerm',
  classId: 'profileClass',
} as const

export interface StudentProfileView {
  tab?: string | null
  term?: string | null
  classId?: string | null
}

export interface OpenStudentProfile extends Required<StudentProfileView> {
  studentId: string
}

const VIEW_KEYS: [keyof StudentProfileView, string][] = [
  ['tab', STUDENT_PROFILE_PARAMS.tab],
  ['term', STUDENT_PROFILE_PARAMS.term],
  ['classId', STUDENT_PROFILE_PARAMS.classId],
]

const setOrDelete = (params: URLSearchParams, key: string, value: string | null | undefined) => {
  if (value) params.set(key, value)
  else params.delete(key)
}

/** Merge view changes into a search string; null or '' removes that key. */
export function withStudentView(search: string, patch: StudentProfileView): string {
  const params = new URLSearchParams(search)
  for (const [field, key] of VIEW_KEYS) {
    if (field in patch) setOrDelete(params, key, patch[field])
  }
  return params.toString()
}

/** The search string with this student's profile open; every page param is kept. */
export function withStudentProfile(search: string, studentId: string, view: StudentProfileView = {}): string {
  const params = new URLSearchParams(withoutStudentProfile(search))
  params.set(STUDENT_PROFILE_PARAMS.id, studentId)
  return withStudentView(params.toString(), view)
}

/** The search string with the profile closed. */
export function withoutStudentProfile(search: string): string {
  const params = new URLSearchParams(search)
  for (const key of Object.values(STUDENT_PROFILE_PARAMS)) params.delete(key)
  return params.toString()
}

/** The open profile described by a page's search params, or null when none is open. */
export function readStudentProfile(params: Pick<URLSearchParams, 'get'>): OpenStudentProfile | null {
  const studentId = params.get(STUDENT_PROFILE_PARAMS.id)
  if (!studentId) return null
  return {
    studentId,
    tab: params.get(STUDENT_PROFILE_PARAMS.tab),
    term: params.get(STUDENT_PROFILE_PARAMS.term),
    classId: params.get(STUDENT_PROFILE_PARAMS.classId),
  }
}

/** pathname + '?' + query, without a dangling '?'. */
export const hrefWithQuery = (pathname: string, qs: string): string => (qs ? `${pathname}?${qs}` : pathname)
