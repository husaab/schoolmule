import { roleHome } from '@/lib/authRouting'

// Where the website's navbar and footer send a signed-in visitor instead of
// offering Log in, Sign up and Book a demo. A signed-in user only sees the
// website from the app's "SchoolMule website" link (lib/websiteVisit) or on a
// page that never redirects, such as /privacy.
export type SignedInHome = {
  href: string
  label: string
  /** For the phone navbar, where the full label doesn't fit. */
  short: string
}

// Signed in means the same as for the website redirect: a token and a stored user.
export const signedInHome = (
  user: { id: string | null; role: string | null },
  hasToken: boolean,
): SignedInHome | null => {
  if (!hasToken || !user.id) return null
  const href = roleHome(user.role)
  // A student's home page is called Home, not a dashboard.
  return user.role === 'STUDENT'
    ? { href, label: 'Back to home', short: 'Home' }
    : { href, label: 'Back to dashboard', short: 'Dashboard' }
}
