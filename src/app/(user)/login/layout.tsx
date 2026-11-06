import type { Metadata } from 'next'

// The one app page search engines should list: families and staff search
// "schoolmule login". Overrides the noindex in (user)/layout.tsx.
export const metadata: Metadata = {
  title: 'Log in',
  description: 'Log in to SchoolMule for your school’s attendance, grades, report cards and messages.',
  alternates: { canonical: 'https://schoolmule.ca/login' },
  robots: { index: true, follow: true },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
