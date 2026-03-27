// src/services/patchNoteService.ts

import apiClient from './apiClient'
import type {
  PatchNotesResponse,
  UnreadPatchNotesResponse,
  PatchNoteResponse,
  DismissResponse,
  CreatePatchNotePayload,
} from './types/patchNote'

export const getPatchNotes = async (): Promise<PatchNotesResponse> => {
  return apiClient<PatchNotesResponse>('/patch-notes')
}

export const getUnreadPatchNotes = async (): Promise<UnreadPatchNotesResponse> => {
  return apiClient<UnreadPatchNotesResponse>('/patch-notes/unread')
}

export const dismissPatchNotes = async (lastSeenPatchNoteId: string): Promise<DismissResponse> => {
  return apiClient<DismissResponse>('/patch-notes/dismiss', {
    method: 'POST',
    body: { lastSeenPatchNoteId },
  })
}

export const getAllPatchNotesAdmin = async (): Promise<PatchNotesResponse> => {
  return apiClient<PatchNotesResponse>('/patch-notes/all')
}

export const createPatchNote = async (data: CreatePatchNotePayload): Promise<PatchNoteResponse> => {
  return apiClient<PatchNoteResponse>('/patch-notes/create', {
    method: 'POST',
    body: data,
  })
}

export const updatePatchNote = async (
  id: string,
  data: Partial<CreatePatchNotePayload>
): Promise<PatchNoteResponse> => {
  return apiClient<PatchNoteResponse>(`/patch-notes/${id}`, {
    method: 'PATCH',
    body: data,
  })
}

export const deletePatchNote = async (id: string): Promise<DismissResponse> => {
  return apiClient<DismissResponse>(`/patch-notes/${id}`, {
    method: 'DELETE',
  })
}

export const uploadPatchNoteImage = async (
  id: string,
  file: File
): Promise<{ status: string; data: { imageUrl: string } }> => {
  const formData = new FormData()
  formData.append('image', file)

  const token = localStorage.getItem('auth_token')
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ''

  const response = await fetch(`${baseUrl}/patch-notes/${id}/image`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || 'Failed to upload image')
  }

  return response.json()
}
