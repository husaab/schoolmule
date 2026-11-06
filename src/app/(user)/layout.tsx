import type { Metadata } from 'next'
import UserShell from '@/components/shell/UserShell'

// The app, not the website: keep its pages out of search results. Their HTML
// is an empty shell until the auth guard loads, so Google indexed them as
// blank pages under the site's default title. "follow" still lets crawlers
// follow links out (the logo goes to the homepage). /login opts back in so
// "schoolmule login" finds it (login/layout.tsx).
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return <UserShell>{children}</UserShell>
}
