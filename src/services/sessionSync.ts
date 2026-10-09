// services/sessionSync.ts
// Copies what the server says about the session (/auth/me) into the stores.
// Shared by AuthGuard and the onboarding pages so they all read the same
// fields the same way, and so a reissued token is never dropped (the old one
// 403s once the account's claims changed).

import { getToken, setToken, removeToken, type SessionValidationResponse } from './authService'
import { useUserStore } from '@/store/useUserStore'
import { useSchoolYearStore } from '@/store/useSchoolYearStore'
import { useSelectedChildStore } from '@/store/useSelectedChildStore'
import { useImpersonationStore } from '@/store/useImpersonationStore'

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
    baseRole: data.baseRole ?? data.role,
    roles: data.roles ?? [data.role],
    isVerifiedEmail: data.isVerified,
    isVerifiedSchool: data.isVerifiedSchool,
    activeTerm: data.activeTerm || null,
    isPlatformOwner: Boolean(data.isPlatformOwner),
  })
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
    baseRole: data.baseRole ?? data.role,
    roles: data.roles ?? [data.role],
    isVerifiedEmail: data.isVerified,
    isVerifiedSchool: data.isVerifiedSchool,
    isPlatformOwner: Boolean(data.isPlatformOwner),
  }
  const changed =
    next.role !== current.role ||
    next.baseRole !== current.baseRole ||
    next.roles.join() !== (current.roles ?? []).join() ||
    next.isVerifiedEmail !== current.isVerifiedEmail ||
    next.isVerifiedSchool !== current.isVerifiedSchool ||
    next.isPlatformOwner !== current.isPlatformOwner
  if (changed) useUserStore.getState().setUser(next)
  return changed
}

// Signs this browser out: token, user and every per-user store. Ends an
// admin "view as" preview too, or "Exit preview" on /login would hand the
// parked admin token back to a browser that looks signed out. Every sign-out
// path uses this so none of them can forget a piece.
export const signOutLocally = (): void => {
  removeToken()
  useUserStore.getState().clearUser()
  useSchoolYearStore.getState().clearYears()
  useSelectedChildStore.getState().clearChildren()
  useImpersonationStore.getState().clearSession()
}
