'use client';

import { useEffect } from 'react';
import { useFilterParams } from '@/hooks/useFilterParams';
import { useNotificationStore } from '@/store/useNotificationStore';

export type OAuthOutcomeMessages = Record<string, [string, 'success' | 'error']>;

/**
 * Reports how an OAuth round-trip ended.
 *
 * The provider's callback is a browser redirect back to the page the admin
 * started on, so the outcome arrives as a query param (`?google=connected`,
 * `?qbo=denied`, …) rather than a response we can await. Any page that offers
 * a "Connect …" button mounts this once with its own param and messages.
 * Must render under a Suspense boundary (it reads the search params).
 *
 * `onOutcome` runs after the toast, e.g. to refetch connection state.
 */
export function useOAuthOutcome(
  paramName: string,
  messages: OAuthOutcomeMessages,
  fallback: string,
  onOutcome?: (outcome: string) => void,
) {
  const { get, setParams } = useFilterParams();
  const showNotification = useNotificationStore((s) => s.showNotification);

  useEffect(() => {
    const outcome = get(paramName);
    if (!outcome) return;

    const [message, kind] = messages[outcome] || [fallback, 'error'];
    showNotification(message, kind);
    onOutcome?.(outcome);

    // Clear it so a refresh doesn't replay the toast.
    setParams({ [paramName]: null });
    // `messages`/`onOutcome` are usually inline; the param value is what matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [get, setParams, showNotification, paramName]);
}
