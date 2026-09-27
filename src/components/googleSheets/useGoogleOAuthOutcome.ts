'use client';

import { useOAuthOutcome, type OAuthOutcomeMessages } from '@/hooks/useOAuthOutcome';

const MESSAGES: OAuthOutcomeMessages = {
  connected: ['Google account connected', 'success'],
  denied: ['Google access was declined', 'error'],
  invalid_state: ['That sign-in link expired — please try again', 'error'],
  missing_code: ['Google sign-in did not complete', 'error'],
  error: ['Could not connect Google — please try again', 'error'],
};

/**
 * Reports how the Google OAuth round-trip ended (`?google=` on return).
 * Any page that offers "Connect Google" mounts this once.
 * Must render under a Suspense boundary (it reads the search params).
 */
export function useGoogleOAuthOutcome() {
  useOAuthOutcome('google', MESSAGES, 'Could not connect Google');
}
