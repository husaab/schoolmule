// The teacher and teacher assistant a JK/SK document names
// (/api/jk|sk/teacher-assistant; backend services/kindergartenStaff.js).

export interface KindergartenPerson {
  userId: string | null
  name: string
}

/** 'default' (the class's only co-teacher), 'none', or a picked co-teacher. */
export type TeacherAssistantSelection = 'default' | 'none' | { userId: string }

export interface TeacherAssistantInfo {
  /** Who the document names as the teacher (homeroom, else the Kindergarten class teacher). */
  teacher: KindergartenPerson | null
  /** The student's Kindergarten class this year; null when there is none. */
  classId: string | null
  /** The class's co-teachers (never the named teacher): the assistants to choose from. */
  choices: { userId: string; name: string }[]
  /** The class's only co-teacher, who is the assistant unless a teacher chose otherwise. */
  defaultUserId: string | null
  selection: TeacherAssistantSelection
  /** Who prints as the assistant now. */
  effective: { userId: string; name: string } | null
  /** May the caller add co-teachers (Class → Settings → Teachers)? */
  canManageClass: boolean
}

export interface TeacherAssistantResponse {
  status: string
  data: TeacherAssistantInfo
  message?: string
}

export interface TeacherAssistantPayload {
  studentId: string
  term: string
  mode: 'default' | 'none' | 'user'
  assistantUserId: string | null
}
