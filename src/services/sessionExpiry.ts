// services/sessionExpiry.ts
// One place that decides what a dead session means for the signed-in user.
//
// 401: the token is dead, so sign out and send the user to the front page.
// 403 ACCOUNT_NOT_VERIFIED while the app believes the user is approved: the
// token was minted before the school approved the account, and only a fresh
// sign-in mints one with the new claims, so sign out and say so on the login
// page. During an admin "view as" preview only the preview token died, so
// hand the admin their own session back instead.
//
// Idempotent on purpose: several requests are usually in flight when a token
// dies, and only the first may act. The rest see that `auth_token` is no
// longer the token they were sent with and do nothing.

import { useUserStore } from '@/store/useUserStore';
import { useSchoolYearStore } from '@/store/useSchoolYearStore';
import { useSelectedChildStore } from '@/store/useSelectedChildStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useImpersonationStore } from '@/store/useImpersonationStore';
import { LOGIN_NOTICE_PARAM, LOGIN_NOTICE_APPROVED } from '@/lib/loginNotice';

// True when the token this request was sent with is still the live session.
const sessionUnchangedSince = (sentToken: string | null): boolean => {
  const current = localStorage.getItem('auth_token');
  return Boolean(current) && (!sentToken || current === sentToken);
};

// Ends the session (or just the preview, if one is active) and then runs
// `leave`, which decides where the user lands and what they are told.
const endSession = async (sentToken: string | null, leave: () => void): Promise<void> => {
  if (typeof window === 'undefined') return;
  if (!sessionUnchangedSince(sentToken)) return;

  if (useImpersonationStore.getState().session) {
    const { endImpersonation } = await import('./impersonation');
    endImpersonation('expired');
    return;
  }

  localStorage.removeItem('auth_token');
  useUserStore.getState().clearUser();
  useSchoolYearStore.getState().clearYears();
  useSelectedChildStore.getState().clearChildren();
  leave();
};

export const handleUnauthorized = (sentToken: string | null): Promise<void> =>
  endSession(sentToken, () => {
    useNotificationStore.getState().showNotification('Your login session has expired, please login again', 'error');
    window.location.href = '/';
  });

export const handleAccountNotVerified = async (sentToken: string | null): Promise<void> => {
  // A user the app still shows as pending (parked on /school-approval) gets
  // this 403 legitimately; only a mismatch means the token is stale.
  const { user } = useUserStore.getState();
  if (!user.isVerifiedEmail || !user.isVerifiedSchool) return;

  await endSession(sentToken, () => {
    // A hard navigation drops in-memory toasts, so the reason travels in the URL.
    window.location.href = `/login?${LOGIN_NOTICE_PARAM}=${LOGIN_NOTICE_APPROVED}`;
  });
};
