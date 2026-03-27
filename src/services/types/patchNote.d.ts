// src/services/types/patchNote.d.ts

export type PatchNoteCategory = 'new_feature' | 'bug_fix' | 'improvement' | 'announcement' | 'coming_soon' | 'heads_up'

export interface PatchNote {
  patchNoteId: string
  title: string
  body: string
  version: string
  category: PatchNoteCategory
  targetRoles: string[]
  imageUrl: string | null
  publishedAt: string
  autoDismissAt: string
  createdBy?: string
  createdAt?: string
  updatedAt?: string
}

export interface PatchNotesResponse {
  status: string
  data: PatchNote[]
}

export interface UnreadPatchNotesResponse {
  status: string
  data: {
    hasUnread: boolean
    notes: PatchNote[]
  }
}

export interface PatchNoteResponse {
  status: string
  data: PatchNote
}

export interface DismissResponse {
  status: string
  message: string
}

export interface ImageUploadResponse {
  status: string
  data: {
    imageUrl: string
  }
}

export interface CreatePatchNotePayload {
  title: string
  body: string
  version: string
  category: PatchNoteCategory
  targetRoles: string[]
  publishedAt?: string
  imageUrl?: string
}
