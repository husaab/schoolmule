// src/components/observe/UserChip.tsx
import Link from 'next/link'
import type { ObserveUserRef } from '@/services/types/observe'
import { RolePill } from './pills'

const initials = (name: string) => name.split(' ').map((s) => s[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()

export default function UserChip({ user, href = true, compact = false }: { user: ObserveUserRef | null; href?: boolean; compact?: boolean }) {
  if (!user) return <span className="text-xs text-slate-500">—</span>
  const body = (
    <span className="inline-flex items-center gap-2 min-w-0">
      <span className="h-6 w-6 shrink-0 rounded-full bg-white/[0.08] text-[10px] font-semibold text-slate-200 flex items-center justify-center">{initials(user.name)}</span>
      <span className="truncate text-sm text-slate-200">{user.name}</span>
      {!compact && user.role && <RolePill role={user.role} />}
    </span>
  )
  return href ? <Link href={`/observe/users/${user.id}`} className="hover:underline underline-offset-4 min-w-0">{body}</Link> : body
}
