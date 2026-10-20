// Who a class may be given to, mirroring the API (RBAC): giving a class to
// another teacher is classes.manage (or classes.all). Without it you create
// and copy classes that you lead yourself, and an edit keeps the current lead.

type TeacherOption = { userId: string }

export type TeacherChoiceRule = {
  managesClasses: boolean
  selfId: string | null
  /** On edit: the class's current lead, which an edit may always keep. */
  currentLeadId?: string | null
}

export const pickableTeachers = <T extends TeacherOption>(teachers: T[], rule: TeacherChoiceRule): T[] => {
  if (rule.managesClasses) return teachers
  const keep = rule.currentLeadId ?? rule.selfId
  return teachers.filter((t) => t.userId === keep)
}

/** The lead to preselect: the requested one when allowed, else the only choice. */
export const defaultLead = <T extends TeacherOption>(choices: T[], preferred: string | null | undefined): string =>
  choices.some((t) => t.userId === preferred) ? (preferred as string) : choices.length === 1 ? choices[0].userId : ''
