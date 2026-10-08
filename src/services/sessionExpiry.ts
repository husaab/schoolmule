// services/sessionExpiry.ts
// One place that decides what a 401 means for the signed-in session.
//
// Normally: the token is dead, so sign out and send the user to the front
// page. During an admin "view as" preview: only the short-lived preview token
// died, so hand the admin their own session back instead.
//
// Idempotent on purpose. A page often has several requests in flight when a
// token expires, and every one of them comes back 401. Only the first may act;
// the rest see that `auth_token` is no longer the token they were sent with
// and do nothing, so a later 401 can never wipe a session that was just
// restored.

import { useUserStore } from '@/store/useUserStore';
import { useSchoolYearStore } from '@/store/useSchoolYearStore';
import { useSelectedChildStore } from '@/store/useSelectedChildStore';
import { useNotificationStore } from '@/store/useNotificationStore';
import { useImpersonationStore } from '@/store/useImpersonationStore';

export const handleUnauthorized = async (sentToken: string | null): Promise<void> => {
  if (typeof window === 'undefined') return;

  const current = localStorage.getItem('auth_token');
  // The session already changed since this request went out (a preview just
  // ended, or another 401 already signed us out). Nothing left to do.
  if (!current || (sentToken && current !== sentToken)) return;

  if (useImpersonationStore.getState().session) {
    const { endImpersonation } = await import('./impersonation');
    endImpersonation('expired');
    return;
  }

  localStorage.removeItem('auth_token');
  useUserStore.getState().clearUser();
  useSchoolYearStore.getState().clearYears();
  useSelectedChildStore.getState().clearChildren();
  useNotificationStore.getState().showNotification('Your login session has expired, please login again', 'error');
  window.location.href = '/';
};
