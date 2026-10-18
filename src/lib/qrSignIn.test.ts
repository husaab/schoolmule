import { describe, expect, it } from 'vitest'
import { QR_NO_CONNECTION, QR_SERVER_TROUBLE, qrSignInMessage } from './qrSignIn'

const apiError = (status: number, message: string, code: string | null = null) =>
  Object.assign(new Error(message), { name: 'ApiError', status, code })

describe('qrSignInMessage', () => {
  it("reads out the server's own explanation for a card it refused", () => {
    expect(qrSignInMessage(apiError(401, "This card doesn't work any more. Ask your teacher for a new one.", 'QR_INVALID'))).toBe(
      "This card doesn't work any more. Ask your teacher for a new one.",
    )
    expect(qrSignInMessage(apiError(403, 'Classrooms are turned off.', 'CLASSROOM_DISABLED'))).toBe('Classrooms are turned off.')
    expect(qrSignInMessage(apiError(429, 'Too many login attempts. Please try again later.'))).toBe(
      'Too many login attempts. Please try again later.',
    )
  })

  it('keeps a server message that carries a code even on a 5xx', () => {
    expect(qrSignInMessage(apiError(503, 'Sign-in is paused for a minute.', 'MAINTENANCE'))).toBe('Sign-in is paused for a minute.')
  })

  it('says a plain line when the connection dropped', () => {
    expect(qrSignInMessage(new TypeError('Failed to fetch'))).toBe(QR_NO_CONNECTION)
    expect(qrSignInMessage(new TypeError('Load failed'))).toBe(QR_NO_CONNECTION)
    expect(qrSignInMessage(new Error('NetworkError when attempting to fetch resource.'))).toBe(QR_NO_CONNECTION)
    expect(qrSignInMessage(null)).toBe(QR_NO_CONNECTION)
    expect(qrSignInMessage('boom')).toBe(QR_NO_CONNECTION)
    expect(QR_NO_CONNECTION).not.toMatch(/failed to fetch|load failed/i)
  })

  it('says a plain line for a proxy or server error with no code', () => {
    expect(qrSignInMessage(apiError(502, 'Bad Gateway'))).toBe(QR_SERVER_TROUBLE)
    expect(qrSignInMessage(apiError(500, 'Internal Server Error'))).toBe(QR_SERVER_TROUBLE)
    expect(qrSignInMessage(apiError(504, ''))).toBe(QR_SERVER_TROUBLE)
  })

  it('falls back to the plain line when the server said nothing', () => {
    expect(qrSignInMessage(apiError(400, '   '))).toBe(QR_SERVER_TROUBLE)
  })
})
