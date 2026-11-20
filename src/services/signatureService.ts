// src/services/signatureService.ts
// The signed-in staff member's own signature (/api/profile/signature). It
// prints on the JK/SK progress reports and report cards where they are the
// teacher or the teacher assistant. Drawn signatures go as strokes (the
// server draws them); an uploaded photo or scan is cleaned up by the server.

import apiClient from './apiClient'
import apiUpload from './apiUpload'
import type { SignatureDrawing } from '@/lib/signatureStrokes'
import type { ProfileEnvelope, ProfileSignatureResult } from './types/profile'

/** GET /profile/signature: a fresh signed URL, or null when none is saved. */
export const getSignature = () => apiClient<ProfileEnvelope<ProfileSignatureResult>>('/profile/signature')

/** PUT /profile/signature: a drawn signature (replaces any saved one). */
export const saveDrawnSignature = (drawing: SignatureDrawing) =>
  apiClient<ProfileEnvelope<ProfileSignatureResult>, SignatureDrawing>('/profile/signature', {
    method: 'PUT',
    body: drawing,
  })

/** POST /profile/signature (multipart "signature"; JPEG, PNG or WebP, 8 MB at most). */
export const uploadSignature = (image: Blob, fileName = 'signature.jpg') => {
  const form = new FormData()
  form.append('signature', image, fileName)
  return apiUpload<ProfileEnvelope<ProfileSignatureResult>>('/profile/signature', form)
}

/** DELETE /profile/signature */
export const deleteSignature = () =>
  apiClient<ProfileEnvelope<ProfileSignatureResult>>('/profile/signature', { method: 'DELETE' })
