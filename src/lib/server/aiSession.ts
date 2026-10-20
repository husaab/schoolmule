// src/lib/server/aiSession.ts
// Server only (route handlers under src/app/api/ai). The AI routes spend the
// school's OpenAI key, so each one first proves the caller is a signed-in
// staff member: the browser sends its School Mule Bearer token, and the
// backend's GET /auth/me says whose it is (and refuses a dead, archived or
// revoked session). Nothing here trusts the token on its own: Next has no
// JWT secret, and the backend is the one place that decides.
//
// One extra request per AI call is nothing next to the model's latency.

import { NextResponse } from 'next/server'
import { accessInfo, type Permission } from '@/lib/permissions'

const BACKEND_URL = process.env.NEXT_PUBLIC_BASE_URL

export type AiSession = {
  userId: string
  role: string
  school: string | null
}

export type AiSessionCheck = { ok: true; session: AiSession } | { ok: false; response: NextResponse }

const refuse = (status: number, error: string): AiSessionCheck => ({ ok: false, response: NextResponse.json({ error }, { status }) })

const bearerOf = (request: Request): string | null => {
  const match = /^Bearer\s+(\S+)$/i.exec(request.headers.get('authorization') ?? '')
  return match ? match[1] : null
}

/**
 * The caller's session when it is a staff view (ADMIN or TEACHER) holding
 * `permission` (if one is given), or the response to send back instead:
 * 401 without a live session, 403 for a parent, a student or a missing
 * permission, 503 when the backend can't be asked.
 */
export async function requireStaffSession(
  request: Request,
  { permission }: { permission?: Permission } = {},
): Promise<AiSessionCheck> {
  const token = bearerOf(request)
  if (!token) return refuse(401, 'Sign in to use this feature')
  if (!BACKEND_URL) {
    console.error('AI route: NEXT_PUBLIC_BASE_URL is not set, so sessions cannot be checked')
    return refuse(503, 'Could not check your session')
  }

  let data: { userId?: string; role?: string; school?: string; permissions?: string[]; isFullAdmin?: boolean } | undefined
  try {
    const res = await fetch(`${BACKEND_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    })
    if (res.status === 401) return refuse(401, 'Your session has ended. Sign in again.')
    if (res.status === 403) return refuse(403, "You don't have access to this")
    if (!res.ok) return refuse(503, 'Could not check your session')
    data = (await res.json())?.data
  } catch (err) {
    console.error('AI route: session check failed', err)
    return refuse(503, 'Could not check your session')
  }

  if (!data?.userId || !data.role) return refuse(401, 'Sign in to use this feature')
  const access = accessInfo({ role: data.role, permissions: data.permissions, isFullAdmin: data.isFullAdmin })
  if (!access.staff) return refuse(403, 'AI features are for school staff')
  if (permission && !access.permissions.has(permission)) return refuse(403, "You don't have permission to do that")
  return { ok: true, session: { userId: data.userId, role: data.role, school: data.school ?? null } }
}
