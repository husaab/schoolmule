// src/lib/muley/visibility.ts
// Whether the Muley button shows on this page for this person. The server
// has the last word (GET /assistant/settings says whether the school and the
// person's view have Muley switched on); this keeps it off the pages where it
// has no place, and out of an admin's "view as" preview, where the server
// refuses it anyway.

import { isPublicFormPath, isPublicSchedulePath, isStudentPath, onboardingStep, type RouteUser } from '@/lib/authRouting'

export type MuleyConfig =
  | { status: 'unknown' }
  | { status: 'ready'; enabled: boolean; maxMessageLength?: number }

const NO_MULEY = [
  '/observe', '/login', '/signup', '/forgot-password', '/reset-password', '/verify-email', '/verify-email-token',
  '/school-approval', '/student-invite', '/email-login', '/qr', '/forbidden',
]
const under = (path: string, prefix: string) => path === prefix || path.startsWith(`${prefix}/`)

export type MuleyVisibilityInput = {
  pathname: string
  user: RouteUser & { id?: string | null }
  previewing: boolean
  config: MuleyConfig
}

export function muleyVisible({ pathname, user, previewing, config }: MuleyVisibilityInput): boolean {
  if (!user || !user.id || !user.role) return false
  if (user.role === 'STUDENT' || isStudentPath(pathname)) return false
  if (onboardingStep(user)) return false
  if (previewing) return false
  if (NO_MULEY.some((prefix) => under(pathname, prefix))) return false
  if (isPublicFormPath(pathname) || isPublicSchedulePath(pathname)) return false
  return config.status === 'ready' && config.enabled
}
