// src/app/(user)/observe/layout.tsx
import type { Metadata } from 'next'
import ObserveShell from '@/components/observe/ObserveShell'

export const metadata: Metadata = {
  title: 'Observe',
  robots: { index: false, follow: false, nocache: true },
}

export default function ObserveLayout({ children }: { children: React.ReactNode }) {
  return <ObserveShell>{children}</ObserveShell>
}
