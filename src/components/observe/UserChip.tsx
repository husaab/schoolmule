// src/components/observe/UserChip.tsx
// A person on the owner console: their avatar (never initials, final review
// M14 — the neutral one until the payload carries a pick), name and role.
import Link from 'next/link'
import Avatar from '@/components/avatar/Avatar'
import type { ObserveUserRef } from '@/services/types/observe'
import { RolePill } from './pills'

export default function UserChip({ user, href = true, compact = false }: { user: ObserveUserRef | null; href?: boolean; compact?: boolean }) {
  if (!user) return <span className="text-xs text-slate-500">—</span>
  const body = (
    <span className="inline-flex items-center gap-2 min-w-0">
      <Avatar name={user.name} size={24} className="shrink-0" />
      <span className="truncate text-sm text-slate-200">{user.name}</span>
      {!compact && user.role && <RolePill role={user.role} />}
    </span>
  )
  return href ? <Link href={`/observe/users/${user.id}`} className="hover:underline underline-offset-4 min-w-0">{body}</Link> : body
}
