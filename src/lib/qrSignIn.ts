// src/lib/qrSignIn.ts
// The QR card sign-in, as far as it is pure (unit-tested in qrSignIn.test.ts):
// reading what the camera saw, and what the page tells a child when the
// camera or the card did not sign them in.
//
// A card carries the plain text "SCHOOLMULE-QR:<token>" — not a link — and is
// read only by the in-app scanner (Scan my card on /login and /qr), so the
// card's long-lived secret never becomes a URL in a shared device's history.
// The first cards printed carried a /qr?t=<token> link; the scanner still
// reads those, but opening such a link no longer signs anyone in.
//
// What the QR sign-in page tells a child when the card did not sign them in.
// The server's own words are for the cases it explains (a voided card, a
// student whose classroom is off, too many tries): those are an ApiError with
// a code or a 4xx status. A dropped connection ("Failed to fetch", "Load
// failed") or a proxy error ("Bad Gateway") is not something to read out on a
// classroom device, so those get a plain line. Pure, so it is unit-tested.

export const QR_NO_CONNECTION = "We couldn't reach SchoolMule. Check the internet connection and scan your card again."
export const QR_SERVER_TROUBLE = 'SchoolMule had a problem signing you in. Wait a moment and scan your card again.'
export const QR_RATE_LIMITED = 'Too many tries for now. Wait a few minutes, then scan your card again, or ask your teacher.'
export const QR_NOT_A_CARD = "That code isn't a SchoolMule sign-in card. Hold up the code on your card."

/** What a card's QR code says before its token. */
export const QR_PAYLOAD_PREFIX = 'SCHOOLMULE-QR:'

// A card token is "<userId>.<secret>": letters, digits and a few URL-safe marks, nothing else.
const TOKEN_PATTERN = /^[A-Za-z0-9._~-]{8,512}$/

/**
 * The sign-in token in what the camera read, or null when it isn't a
 * SchoolMule card: "SCHOOLMULE-QR:<token>", or an early card's
 * ".../qr?t=<token>" link.
 */
export function parseCardPayload(text: string | null | undefined): string | null {
  const raw = (text ?? '').trim()
  if (!raw) return null
  if (raw.toUpperCase().startsWith(QR_PAYLOAD_PREFIX)) {
    const token = raw.slice(QR_PAYLOAD_PREFIX.length).trim()
    return TOKEN_PATTERN.test(token) ? token : null
  }
  try {
    const url = new URL(raw)
    if ((url.protocol === 'https:' || url.protocol === 'http:') && /\/qr\/?$/.test(url.pathname)) {
      const token = url.searchParams.get('t') ?? ''
      return TOKEN_PATTERN.test(token) ? token : null
    }
  } catch {
    // Not a link either.
  }
  return null
}

/** What to say when the camera can't be opened (a getUserMedia failure, or no camera API at all). */
export function cameraProblem(err: unknown): string {
  const name = typeof err === 'object' && err !== null ? (err as { name?: unknown }).name : undefined
  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
    case 'SecurityError':
      return 'SchoolMule needs the camera to read your card. Allow the camera for this site (in the address bar or the settings), then try again.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
    case 'OverconstrainedError':
      return "This device has no camera SchoolMule can use. Sign in with your email instead, or use a device with a camera."
    case 'NotReadableError':
    case 'TrackStartError':
    case 'AbortError':
      return 'The camera is busy in another app or tab. Close it, then try again.'
    case 'NoCameraApi':
      return "This browser can't open the camera here. Open SchoolMule in Safari or Chrome, or sign in with your email."
    default:
      return "The camera didn't start. Try again, or sign in with your email."
  }
}

const field = (err: unknown, key: string): unknown =>
  typeof err === 'object' && err !== null ? (err as Record<string, unknown>)[key] : undefined

export function qrSignInMessage(err: unknown): string {
  const status = field(err, 'status')
  const message = field(err, 'message')
  const code = field(err, 'code')
  // Not an answer from our server at all: the request never got one (offline, blocked, timed out).
  if (field(err, 'name') !== 'ApiError' || typeof status !== 'number') return QR_NO_CONNECTION
  if (status === 429) return QR_RATE_LIMITED
  const said = typeof message === 'string' ? message.trim() : ''
  if (said && (typeof code === 'string' && code !== '' ? true : status >= 400 && status < 500)) return said
  return QR_SERVER_TROUBLE
}
