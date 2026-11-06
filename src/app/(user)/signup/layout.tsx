import type { Metadata } from 'next'

// Kept out of search results by (user)/layout.tsx; the title is for the tab.
export const metadata: Metadata = {
  title: 'Sign up',
}

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return children
}
