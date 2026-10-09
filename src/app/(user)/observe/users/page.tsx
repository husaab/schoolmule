// src/app/(user)/observe/users/page.tsx
'use client'
import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getUsers } from '@/services/observeService'
import type { ObserveUserRow } from '@/services/types/observe'
import Panel from '@/components/observe/Panel'
import DataTable, { Column } from '@/components/observe/DataTable'
import StateBlock from '@/components/observe/StateBlock'
import { RolePill, SchoolPill } from '@/components/observe/pills'
import { fmtNum, timeAgo } from '@/components/observe/format'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

export default function UsersPage() {
  const router = useRouter()
  const { data, error, loading, refetch, window } = useObserveQuery(getUsers)
  const [q, setQ] = useState('')
  const [onlyActive, setOnlyActive] = useState(false)

  const rows = useMemo(() => {
    const all = data?.users ?? []
    const needle = q.trim().toLowerCase()
    return all.filter((u) => (!onlyActive || u.requests > 0) && (!needle || u.name.toLowerCase().includes(needle) || u.email.toLowerCase().includes(needle)))
  }, [data, q, onlyActive])

  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />

  const online = (data?.users ?? []).filter((u) => u.onlineNow).length
  const active = (data?.users ?? []).filter((u) => u.requests > 0).length

  const columns: Column<ObserveUserRow>[] = [
    { key: 'name', header: 'User', sortValue: (u) => u.name, render: (u) => (
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`h-2 w-2 rounded-full shrink-0 ${u.onlineNow ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-white/[0.12]'}`} title={u.onlineNow ? 'Online now' : 'Offline'} />
        <div className="min-w-0">
          <p className="text-slate-100 truncate">{u.name}</p>
          <p className="text-[11px] text-slate-500 truncate">{u.email}</p>
        </div>
      </div>
    ) },
    { key: 'role', header: 'Role', sortValue: (u) => u.role, render: (u) => <RolePill role={u.role} /> },
    { key: 'school', header: 'School', sortValue: (u) => u.school, render: (u) => <SchoolPill school={u.school} /> },
    { key: 'lastSeen', header: 'Last seen', sortValue: (u) => (u.lastSeenAt ? new Date(u.lastSeenAt).getTime() : null), render: (u) => <span className="text-slate-300 tabular-nums">{timeAgo(u.lastSeenAt)}</span> },
    { key: 'lastLogin', header: 'Last login', sortValue: (u) => (u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : null), render: (u) => <span className="text-slate-400 tabular-nums">{timeAgo(u.lastLoginAt)}</span> },
    { key: 'requests', header: `Requests (${window})`, align: 'right', sortValue: (u) => u.requests, render: (u) => <span className="font-mono tabular-nums text-slate-200">{fmtNum(u.requests)}</span> },
    { key: 'errors', header: 'Errors', align: 'right', sortValue: (u) => u.errors, render: (u) => <span className={`font-mono tabular-nums ${u.errors > 0 ? 'text-rose-300' : 'text-slate-600'}`}>{u.errors}</span> },
    { key: 'top', header: 'Top feature', sortValue: (u) => u.topFeature, render: (u) => <span className="text-slate-400">{u.topFeature ?? '—'}</span> },
  ]

  return (
    <Panel
      title="Users"
      subtitle={data ? `${online} online · ${active} active in the last ${window} · ${data.users.length} accounts` : undefined}
      actions={
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
            <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="accent-cyan-400" /> active only
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search" className="pl-8 pr-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-400/40 w-44" />
          </div>
        </div>
      }
    >
      {loading && !data ? <StateBlock kind="loading" /> : (
        <DataTable columns={columns} rows={rows} rowKey={(u) => u.id} onRowClick={(u) => router.push(`/observe/users/${u.id}`)} initialSort={{ key: 'lastSeen', dir: 'desc' }} empty="No users match" maxHeight="calc(100dvh - 220px)" />
      )}
    </Panel>
  )
}
