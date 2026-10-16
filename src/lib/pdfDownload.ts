// src/lib/pdfDownload.ts
// POST a JSON body to an endpoint that answers with a PDF, and save the PDF.
// apiClient only speaks JSON, so this is the one raw-fetch path for generated
// documents. It sends the same headers apiClient does (token, school year),
// signs the user out on a dead session like every other caller, and hands
// back the response headers so callers can read extras such as
// X-Skipped-Count.

import { ApiError, handleSessionFailure } from '@/services/apiClient'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'

/** Save a blob as a download with the given file name. */
export const saveBlob = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoke on the next tick: some browsers start the download asynchronously.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

/**
 * POST `body` to `endpoint` (relative to the API base, e.g.
 * '/admin/student-accounts/cards.pdf') and save the PDF as `filename`.
 * Throws an ApiError carrying the server's message, code and full body
 * when the request fails. Resolves to the response headers.
 */
export async function postForPdf(endpoint: string, body: unknown, filename: string): Promise<Headers> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null
  const selectedYearId = typeof window === 'undefined' ? null : useSchoolYearStore.getState().selectedYearId

  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(selectedYearId && { 'X-School-Year': selectedYearId }),
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    let errorBody: { code?: string | null; message?: string } & Record<string, unknown> = {}
    try {
      errorBody = await response.json()
    } catch {
      errorBody = { message: response.statusText || `Request failed (${response.status})` }
    }
    if (response.status === 401 || response.status === 403) {
      await handleSessionFailure(response.status, errorBody, token)
    }
    throw new ApiError(errorBody.message || 'Something went wrong', {
      status: response.status,
      code: errorBody.code ?? null,
      data: errorBody,
    })
  }

  saveBlob(await response.blob(), filename)
  return response.headers
}
