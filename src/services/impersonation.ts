// services/impersonation.ts
// Entering and leaving an admin "view as" preview. Both do a full page load on
// purpose: every in-memory store (schedules, analytics, planner…) is keyed to
// whoever was signed in, and a hard navigation is the one way to be sure none
// of it leaks from the admin to the previewed user or back.

import { removeToken, setToken } from './authService';
import type { ImpersonationStart } from './types/adminUser';
import { useUserStore } from '@/store/useUserStore';
import { useSchoolYearStore } from '@/store/useSchoolYearStore';
import { useSelectedChildStore } from '@/store/useSelectedChildStore';
import { useImpersonationStore } from '@/store/useImpersonationStore';

/** Where to send the admin when the preview ends. */
const IMPERSONATION_RETURN_PATH = '/admin-panel/users';

// Set once a preview is being torn down, so overlapping callers (several 401s
// arriving together) cannot restore and then clear the admin token in turn.
let ending = false;

// A one-shot message shown after the reload that ends a preview.
const FLASH_KEY = 'impersonation_flash';

const landingPathFor = (role: string) => (role === 'PARENT' ? '/parent/dashboard' : '/dashboard');

const clearIdentityStores = () => {
  useUserStore.getState().clearUser();
  useSchoolYearStore.getState().clearYears();
  useSelectedChildStore.getState().clearChildren();
};

/**
 * Swap the admin's session for the preview token the backend just issued and
 * land on the previewed user's home page.
 */
export const startImpersonation = (adminToken: string, preview: ImpersonationStart) => {
  clearIdentityStores();

  useImpersonationStore.getState().setSession({
    adminToken,
    admin: { userId: preview.impersonator.userId, fullName: preview.impersonator.fullName },
    target: { userId: preview.userId, fullName: preview.fullName, role: preview.role },
    startedAt: new Date().toISOString(),
  });

  setToken(preview.token);
  // Mirror the login flow so pages find a signed-in user on first render.
  useUserStore.getState().setUser({
    id: preview.userId,
    username: preview.username,
    email: preview.email,
    role: preview.role,
    baseRole: preview.baseRole ?? preview.role,
    roles: preview.roles ?? [preview.role],
    school: preview.school,
    isVerifiedEmail: preview.isVerified,
    isVerifiedSchool: preview.isVerifiedSchool,
    activeTerm: preview.activeTerm || null,
  });
  useSchoolYearStore.getState().setYears(preview.schoolYears ?? []);
  useSchoolYearStore.getState().selectYear(preview.activeSchoolYear?.schoolYearId ?? null);

  window.location.href = landingPathFor(preview.role);
};

/**
 * Restore the admin's own session and go back to the Users page.
 * Safe to call when no preview is active (it then just clears state).
 */
export const endImpersonation = (reason: 'manual' | 'expired' = 'manual') => {
  if (ending) return;
  ending = true;

  const { session, clearSession } = useImpersonationStore.getState();

  clearIdentityStores();
  clearSession();

  if (session?.adminToken) {
    setToken(session.adminToken);
  } else {
    removeToken();
  }

  try {
    sessionStorage.setItem(
      FLASH_KEY,
      reason === 'expired'
        ? `Your preview as ${session?.target.fullName ?? 'that user'} timed out. You're back in your own account.`
        : `Preview ended. You're back in your own account.`,
    );
  } catch {
    // sessionStorage can be unavailable (private mode); the message is a nicety.
  }

  window.location.href = session?.adminToken ? IMPERSONATION_RETURN_PATH : '/';
};

/** Read and clear the post-exit message, if one was left. */
export const takeImpersonationFlash = (): string | null => {
  try {
    const msg = sessionStorage.getItem(FLASH_KEY);
    if (msg) sessionStorage.removeItem(FLASH_KEY);
    return msg;
  } catch {
    return null;
  }
};
