// services/sessionSync.ts
// Copies what the server says about the session (/auth/me) into the stores.
// Shared by AuthGuard and the onboarding pages so they all read the same
// fields the same way, and so a reissued token is never dropped (the old one
// 403s once the account's claims changed).

import { getToken, setToken, type SessionValidationResponse } from './authService'
import { useUserStore } from '@/store/useUserStore'

export type SessionData = NonNullable<SessionValidationResponse['data']>

// Both helpers take the token the /auth/me request was sent with. A reply
// that arrives after the session changed (signed out, "view as" started or
// ended) is dropped whole, token included, or it would put the previous
// user's token back.
const sessionChangedSince = (sentToken: string | null) => !sentToken || getToken() !== sentToken

// A full sign-in from /auth/me: user, token and school years.
export const applySession = async (data: SessionData, sentToken: string | null): Promise<boolean> => {
  if (sessionChangedSince(sentToken)) return false
  if (data.token) setToken(data.token)
  useUserStore.getState().setUser({
    id: data.userId,
    username: data.username,
    email: data.email,
    school: data.school,
    role: data.role,
    isVerifiedEmail: data.isVerified,
    isVerifiedSchool: data.isVerifiedSchool,
    activeTerm: data.activeTerm || null,
    isPlatformOwner: Boolean(data.isPlatformOwner),
  })
  const { useSchoolYearStore } = await import('@/store/useSchoolYearStore')
  useSchoolYearStore.getState().setYears(data.schoolYears ?? [])
  useSchoolYearStore.getState().selectYear(data.activeSchoolYear?.schoolYearId ?? null)
  return true
}

// Brings a persisted user's access flags up to date without touching the
// rest of the session (e.g. the school year they picked). Returns true when
// anything changed. Ignores a reply for a different user.
export const refreshAccessFlags = (data: SessionData, sentToken: string | null): boolean => {
  const current = useUserStore.getState().user
  if (sessionChangedSince(sentToken) || current.id !== data.userId) return false
  if (data.token) setToken(data.token)
  const next = {
    ...current,
    role: data.role,
    isVerifiedEmail: data.isVerified,
    isVerifiedSchool: data.isVerifiedSchool,
    isPlatformOwner: Boolean(data.isPlatformOwner),
  }
  const changed =
    next.role !== current.role ||
    next.isVerifiedEmail !== current.isVerifiedEmail ||
    next.isVerifiedSchool !== current.isVerifiedSchool ||
    next.isPlatformOwner !== current.isPlatformOwner
  if (changed) useUserStore.getState().setUser(next)
  return changed
}
