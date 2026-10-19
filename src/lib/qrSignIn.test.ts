import { describe, expect, it } from 'vitest'
import {
  QR_NO_CONNECTION,
  QR_PAYLOAD_PREFIX,
  QR_RATE_LIMITED,
  QR_SERVER_TROUBLE,
  cameraProblem,
  parseCardPayload,
  qrSignInMessage,
} from './qrSignIn'

const apiError = (status: number, message: string, code: string | null = null) =>
  Object.assign(new Error(message), { name: 'ApiError', status, code })

describe('qrSignInMessage', () => {
  it("reads out the server's own explanation for a card it refused", () => {
    expect(qrSignInMessage(apiError(401, "This card doesn't work any more. Ask your teacher for a new one.", 'QR_INVALID'))).toBe(
      "This card doesn't work any more. Ask your teacher for a new one.",
    )
    expect(qrSignInMessage(apiError(403, 'Classrooms are turned off.', 'CLASSROOM_DISABLED'))).toBe('Classrooms are turned off.')
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

describe('rate limited', () => {
  it('says to wait in words a child understands', () => {
    expect(qrSignInMessage(apiError(429, 'Too many login attempts. Please try again later.'))).toBe(QR_RATE_LIMITED)
    expect(QR_RATE_LIMITED).toMatch(/wait a few minutes/i)
  })
})

const TOKEN = '3f1c2b9e-0d4a-4c1e-9b7a-2a6f5c8d9e01.Zk3_xY-9aBcDeFgHiJ'

describe('parseCardPayload', () => {
  it('reads the token from a card', () => {
    expect(QR_PAYLOAD_PREFIX).toBe('SCHOOLMULE-QR:')
    expect(parseCardPayload(`SCHOOLMULE-QR:${TOKEN}`)).toBe(TOKEN)
    expect(parseCardPayload(`  schoolmule-qr:${TOKEN}\n`)).toBe(TOKEN)
  })

  it("still reads an early card's /qr?t= link (the link itself no longer signs in)", () => {
    expect(parseCardPayload(`https://schoolmule.ca/qr?t=${encodeURIComponent(TOKEN)}`)).toBe(TOKEN)
    expect(parseCardPayload(`http://localhost:3100/qr/?t=${TOKEN}`)).toBe(TOKEN)
  })

  it('refuses anything else', () => {
    expect(parseCardPayload('')).toBeNull()
    expect(parseCardPayload(null)).toBeNull()
    expect(parseCardPayload('https://example.com/menu')).toBeNull()
    expect(parseCardPayload('https://schoolmule.ca/login?t=abc')).toBeNull()
    expect(parseCardPayload('SCHOOLMULE-QR:')).toBeNull()
    expect(parseCardPayload('SCHOOLMULE-QR:has spaces in it')).toBeNull()
    expect(parseCardPayload('SCHOOLMULE-QR:<script>')).toBeNull()
    expect(parseCardPayload('javascript:alert(1)')).toBeNull()
    expect(parseCardPayload(TOKEN)).toBeNull()
  })
})

describe('cameraProblem', () => {
  const named = (name: string) => Object.assign(new Error(name), { name })

  it('asks for the camera when permission was refused', () => {
    expect(cameraProblem(named('NotAllowedError'))).toMatch(/allow the camera/i)
    expect(cameraProblem(named('SecurityError'))).toMatch(/allow the camera/i)
  })

  it('says when there is no camera, or it is busy', () => {
    expect(cameraProblem(named('NotFoundError'))).toMatch(/no camera/i)
    expect(cameraProblem(named('NotReadableError'))).toMatch(/busy/i)
  })

  it('says when this browser has no camera at all', () => {
    expect(cameraProblem({ name: 'NoCameraApi' })).toMatch(/can't open the camera/i)
  })

  it('has a plain fallback, never the raw error', () => {
    expect(cameraProblem(new Error('getUserMedia exploded'))).toBe("The camera didn't start. Try again, or sign in with your email.")
    expect(cameraProblem(undefined)).not.toMatch(/undefined/)
  })
})
