// src/lib/qrSignIn.ts
// What the QR sign-in page tells a child when the card did not sign them in.
// The server's own words are for the cases it explains (a voided card, a
// student whose classroom is off, too many tries): those are an ApiError with
// a code or a 4xx status. A dropped connection ("Failed to fetch", "Load
// failed") or a proxy error ("Bad Gateway") is not something to read out on a
// classroom device, so those get a plain line. Pure, so it is unit-tested.

export const QR_NO_CONNECTION = "We couldn't reach SchoolMule. Check the internet connection and scan your card again."
export const QR_SERVER_TROUBLE = 'SchoolMule had a problem signing you in. Wait a moment and scan your card again.'

const field = (err: unknown, key: string): unknown =>
  typeof err === 'object' && err !== null ? (err as Record<string, unknown>)[key] : undefined

export function qrSignInMessage(err: unknown): string {
  const status = field(err, 'status')
  const message = field(err, 'message')
  const code = field(err, 'code')
  // Not an answer from our server at all: the request never got one (offline, blocked, timed out).
  if (field(err, 'name') !== 'ApiError' || typeof status !== 'number') return QR_NO_CONNECTION
  const said = typeof message === 'string' ? message.trim() : ''
  if (said && (typeof code === 'string' && code !== '' ? true : status >= 400 && status < 500)) return said
  return QR_SERVER_TROUBLE
}
