// src/app/(user)/observe/errors/page.tsx
'use client'
import Link from 'next/link'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getErrors } from '@/services/observeService'
import Panel from '@/components/observe/Panel'
import Sparkline from '@/components/observe/Sparkline'
import StateBlock from '@/components/observe/StateBlock'
import UserChip from '@/components/observe/UserChip'
import { SourcePill, StatusPill } from '@/components/observe/pills'
import { C } from '@/components/observe/chartTheme'
import { fmtTime, timeAgo } from '@/components/observe/format'

export default function ErrorsPage() {
  const { data, error, loading, refetch, window } = useObserveQuery(getErrors)
  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  const busy = loading && !data
  const groups = data?.groups ?? []
  const total = groups.reduce((n, g) => n + g.count, 0)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
      <Panel className="xl:col-span-3" title="Error groups" subtitle={`${total} occurrences in ${groups.length} groups · last ${window}`} padded={false}>
        {busy ? <div className="px-5"><StateBlock kind="loading" /></div> : groups.length === 0 ? <StateBlock kind="ok" message={`No errors in the last ${window}`} /> : (
          <ul className="divide-y divide-white/[0.04]">
            {groups.map((g) => (
              <li key={g.fingerprint}>
                <Link href={`/observe/errors/${g.fingerprint}`} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] group">
                  <span className="font-mono text-xl font-semibold text-rose-300 tabular-nums w-12 text-right shrink-0">{g.count}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-100 truncate group-hover:text-white">{g.message}</p>
                    <p className="text-[11px] text-slate-500 truncate font-mono mt-0.5">{g.location ?? '—'}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{g.users} {g.users === 1 ? 'user' : 'users'} · first {timeAgo(g.firstSeen)} · last {timeAgo(g.lastSeen)}</p>
                  </div>
                  <div className="w-28 shrink-0 hidden sm:block"><Sparkline data={g.spark} color={C.bad} height={32} /></div>
                  <SourcePill source={g.source} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <Panel className="xl:col-span-2" title="Recent" subtitle="Latest 100 server and browser errors" padded={false}>
        {busy ? <div className="px-5"><StateBlock kind="loading" /></div> : (
          <ul className="divide-y divide-white/[0.04] max-h-[70vh] overflow-y-auto">
            {(data?.recent ?? []).map((e, i) => (
              <li key={i} className="px-5 py-2.5 text-xs">
                <Link href={`/observe/errors/${e.fingerprint}`} className="block hover:text-white">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-slate-500 tabular-nums">{fmtTime(e.ts)}</span>
                    <SourcePill source={e.source} />
                    {e.status !== null && <StatusPill status={e.status} />}
                    <span className="ml-auto min-w-0"><UserChip user={e.user} compact href={false} /></span>
                  </div>
                  <p className="text-slate-200 truncate mt-1">{e.message}</p>
                  <p className="font-mono text-slate-600 truncate">{e.location ?? ''}</p>
                </Link>
              </li>
            ))}
            {(data?.recent ?? []).length === 0 && <li className="px-5 py-8 text-center text-xs text-slate-500">Nothing in this window</li>}
          </ul>
        )}
      </Panel>
    </div>
  )
}
