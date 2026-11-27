// Paying inside SchoolMule's own page (Stripe's embedded Checkout) rather than
// on Stripe's. It needs the platform's publishable key, for the same Stripe
// mode the server runs in; anything else falls back to Stripe's own page.

/** The platform's Stripe publishable key (public by design). */
export const stripePublishableKey = (): string => process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''

/** "test", "live", or null for anything that isn't a publishable key. */
export function publishableKeyMode(key: string | null | undefined): 'test' | 'live' | null {
  if (/^pk_test_/.test(key || '')) return 'test'
  if (/^pk_live_/.test(key || '')) return 'live'
  return null
}

/**
 * Whether Stripe's form can show inside our page for a payment in this mode.
 * `testMode` comes from the server (null when it has no Stripe at all).
 */
export function canPayHere(key: string | null | undefined, testMode: boolean | null | undefined): boolean {
  const mode = publishableKeyMode(key)
  if (!mode || testMode == null) return false
  return mode === (testMode ? 'test' : 'live')
}
