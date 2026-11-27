'use client';

// Stripe's payment form inside our own page (embedded Checkout), on the
// school's own Stripe account. Card details go straight to Stripe in its
// iframe; once paid, Stripe sends the family to their /pay/<token> link,
// which confirms the payment as it always has.

import { useEffect, useRef, useState } from 'react';
import { loadStripe, type StripeEmbeddedCheckout } from '@stripe/stripe-js';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { startPublicPayment } from '@/services/registrationPublicService';
import { stripePublishableKey } from '@/lib/stripeEmbedded';

interface Props {
  /** The charge's public token (the family's link). */
  token: string;
  /** It turned out to be paid already: show it as such. */
  onPaid: () => void;
  /** Stripe's form couldn't load here: offer Stripe's own page instead. */
  onUnavailable: (message: string) => void;
}

export default function EmbeddedStripePayment({ token, onPaid, onUnavailable }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  // The latest callbacks, so the effect runs once per token.
  const callbacks = useRef({ onPaid, onUnavailable });
  useEffect(() => { callbacks.current = { onPaid, onUnavailable }; });

  useEffect(() => {
    let checkout: StripeEmbeddedCheckout | null = null;
    let cancelled = false;
    (async () => {
      try {
        const started = await startPublicPayment(token, 'embedded');
        if (cancelled) return;
        if (started.paid || !started.clientSecret || !started.stripeAccountId) {
          callbacks.current.onPaid();
          return;
        }
        // Direct charges: Stripe.js works on the school's account, like the server.
        const stripe = await loadStripe(stripePublishableKey(), { stripeAccount: started.stripeAccountId });
        if (!stripe) throw new Error('Stripe could not load');
        if (cancelled) return;
        const created = await stripe.createEmbeddedCheckoutPage({ clientSecret: started.clientSecret });
        if (cancelled || !box.current) {
          created.destroy();
          return;
        }
        checkout = created;
        created.mount(box.current);
        setReady(true);
      } catch (err) {
        if (!cancelled) callbacks.current.onUnavailable(err instanceof Error ? err.message : 'Stripe could not load');
      }
    })();
    return () => {
      cancelled = true;
      // Stripe allows one embedded form per page: take this one down before another mounts.
      checkout?.destroy();
    };
  }, [token]);

  return (
    <div className="space-y-2">
      {!ready && (
        <div role="status" className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-slate-50 py-10 text-sm text-slate-600">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          Opening a secure payment form…
        </div>
      )}
      <div ref={box} className={ready ? 'overflow-hidden rounded-xl' : 'hidden'} />
      {ready && (
        <p className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <LockClosedIcon className="h-3.5 w-3.5" />
          Card details go straight to Stripe. SchoolMule never sees them.
        </p>
      )}
    </div>
  );
}
