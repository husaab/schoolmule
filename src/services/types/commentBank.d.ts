// A class's standard progress comments (/comment-banks). A class with nothing
// saved uses STARTER_COMMENT_BANK from src/lib/commentBank.ts.

export type CoreStandardsKey = 'exceeding' | 'meeting' | 'workingTowards' | 'notMeeting'
export type WorkHabitKey = 'E' | 'G' | 'S' | 'N'

/** The lowest mark (%) that suggests each level; below workingTowards suggests Not meeting. */
export interface CommentBankCutoffs {
  exceeding: number
  meeting: number
  workingTowards: number
}

export interface CommentBank {
  coreStandards: Record<CoreStandardsKey, string>
  workHabits: Record<WorkHabitKey, string>
  cutoffs: CommentBankCutoffs
}

export interface CommentBankResponse {
  status: string
  message?: string
  data: CommentBank | null
}

export interface CommentBankSavedResponse {
  status: string
  message?: string
  data: CommentBank
}

/** One of the caller's classes (this school year) that has saved standard comments. */
export interface CommentBankSource {
  classId: string
  grade: string
  subject: string
  termName: string | null
}

export interface CommentBankSourcesResponse {
  status: string
  message?: string
  data: CommentBankSource[]
}
