'use client';

import { useEffect } from 'react';
import { useFilterParams } from '@/hooks/useFilterParams';
import { useNotificationStore } from '@/store/useNotificationStore';

const MESSAGES: Record<string, [string, 'success' | 'error']> = {
  connected: ['Google account connected', 'success'],
  denied: ['Google access was declined', 'error'],
  invalid_state: ['That sign-in link expired — please try again', 'error'],
  missing_code: ['Google sign-in did not complete', 'error'],
  error: ['Could not connect Google — please try again', 'error'],
};

/**
 * Reports how the Google OAuth round-trip ended.
 *
 * The callback is a browser redirect back to the page the admin started on,
 * so the outcome arrives as a `?google=` query param rather than a response
 * we can await. Any page that offers "Connect Google" mounts this once.
 * Must render under a Suspense boundary (it reads the search params).
 */
export function useGoogleOAuthOutcome() {
  const { get, setParams } = useFilterParams();
  const showNotification = useNotificationStore((s) => s.showNotification);

  useEffect(() => {
    const outcome = get('google');
    if (!outcome) return;

    const [message, kind] = MESSAGES[outcome] || ['Could not connect Google', 'error'];
    showNotification(message, kind);

    // Clear it so a refresh doesn't replay the toast.
    setParams({ google: null });
  }, [get, setParams, showNotification]);
}
