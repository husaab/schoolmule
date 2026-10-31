// src/services/commentBankService.ts
//
// A class's standard progress comments (one sentence per Core Standards level
// and per Work Habits rating, and the mark cut-offs). A class with nothing
// saved gets data: null, and uses STARTER_COMMENT_BANK (src/lib/commentBank.ts).

import apiClient from './apiClient'
import type {
  CommentBank,
  CommentBankResponse,
  CommentBankSavedResponse,
  CommentBankSourcesResponse,
} from './types/commentBank'

const base = (classId: string) => `/comment-banks/class/${encodeURIComponent(classId)}`

export const getClassCommentBank = (classId: string) => apiClient<CommentBankResponse>(base(classId))

export const saveClassCommentBank = (classId: string, bank: CommentBank) =>
  apiClient<CommentBankSavedResponse, CommentBank>(base(classId), { method: 'PUT', body: bank })

/** Back to SchoolMule's starter set. */
export const resetClassCommentBank = (classId: string) =>
  apiClient<{ status: string; message?: string }>(base(classId), { method: 'DELETE' })

/** Your classes this school year that have saved standard comments (for "Copy from another class"). */
export const getCommentBankSources = () => apiClient<CommentBankSourcesResponse>('/comment-banks/mine')
