// src/app/(user)/observe/users/[id]/page.tsx
'use client'
import { use } from 'react'
import Link from 'next/link'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getUser } from '@/services/observeService'
import Panel from '@/components/observe/Panel'
import Tile from '@/components/observe/Tile'
import TimeSeriesChart from '@/components/observe/TimeSeriesChart'
import BarList from '@/components/observe/BarList'
import StateBlock from '@/components/observe/StateBlock'
import { ImpersonationMark, MethodTag, OutcomePill, RolePill, SchoolPill, SourcePill, StatusPill } from '@/components/observe/pills'
import { C } from '@/components/observe/chartTheme'
import { fmtDateTime, fmtNum, fmtTime, timeAgo } from '@/components/observe/format'
import { ArrowLeftIcon } from '@heroicons/react/20/solid'

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data, error, loading, refetch, window } = useObserveQuery((w) => getUser(id, w), [id])
  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  if (loading && !data) return <StateBlock kind="loading" />
  const d = data!
  const requests = d.series.reduce((n, p) => n + p.requests, 0)
  const errors = d.series.reduce((n, p) => n + p.errors, 0)

  return (
    <div className="space-y-4">
      <Link href="/observe/users" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white"><ArrowLeftIcon className="h-4 w-4" /> Users</Link>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-semibold text-white">{d.user.name}</h2>
          <p className="text-sm text-slate-400 flex items-center gap-2 mt-1">{d.user.email} <RolePill role={d.user.role} /> <SchoolPill school={d.user.school} /> {d.user.isArchived && <span className="text-[10px] uppercase text-slate-500">archived</span>}</p>
        </div>
        <p className="text-xs text-slate-500">Joined {fmtDateTime(d.user.createdAt)}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Tile label="Last seen" value={timeAgo(d.user.lastSeenAt)} tone={d.user.lastSeenAt && new Date(d.window.to).getTime() - new Date(d.user.lastSeenAt).getTime() < 600000 ? 'good' : 'neutral'} />
        <Tile label="Last login" value={timeAgo(d.user.lastLoginAt)} />
        <Tile label={`Requests (${window})`} value={fmtNum(requests)} spark={d.series.map((p) => p.requests)} />
        <Tile label="Errors" value={fmtNum(errors)} tone={errors > 0 ? 'bad' : 'good'} spark={d.series.map((p) => p.errors)} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel className="xl:col-span-2" title="Activity" subtitle={`last ${window}`}>
          <TimeSeriesChart data={d.series as unknown as Record<string, string | number>[]} windowKey={window} height={200} series={[{ key: 'requests', label: 'requests', color: C.primary, kind: 'area' }, { key: 'errors', label: '5xx', color: C.bad, kind: 'bar' }]} />
        </Panel>
        <Panel title="Features used" subtitle="Requests in window">
          <BarList items={d.features.map((f) => ({ key: f.feature, label: f.feature, value: f.requests, sub: f.errors > 0 ? `${f.errors} errors` : undefined }))} />
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Recent requests" subtitle="Latest 100" padded={false}>
          <ul className="divide-y divide-white/[0.04] max-h-[420px] overflow-y-auto">
            {d.recentRequests.map((r) => (
              <li key={`${r.requestId}-${r.ts}`} className="px-5 py-2 flex items-center gap-3 text-xs">
                <span className="font-mono text-slate-500 tabular-nums w-16 shrink-0">{fmtTime(r.ts)}</span>
                <StatusPill status={r.status} /><MethodTag method={r.method} />
                <span className="font-mono text-slate-300 truncate flex-1" title={r.path}>{r.route}</span>
                {r.impersonated && <ImpersonationMark />}
                <span className="font-mono text-slate-500 tabular-nums">{r.durationMs} ms</span>
              </li>
            ))}
            {d.recentRequests.length === 0 && <li className="px-5 py-8 text-center text-xs text-slate-500">No requests recorded</li>}
          </ul>
        </Panel>
        <div className="space-y-4">
          <Panel title="Errors hit" subtitle={`last ${window}`} padded={false}>
            <ul className="divide-y divide-white/[0.04] max-h-[200px] overflow-y-auto">
              {d.recentErrors.map((e, i) => (
                <li key={i} className="px-5 py-2 text-xs">
                  <Link href={`/observe/errors/${e.fingerprint}`} className="flex items-center gap-2 hover:text-white">
                    <span className="font-mono text-slate-500 tabular-nums w-16 shrink-0">{fmtTime(e.ts)}</span>
                    <SourcePill source={e.source} />
                    <span className="text-slate-300 truncate flex-1">{e.message}</span>
                  </Link>
                </li>
              ))}
              {d.recentErrors.length === 0 && <li className="px-5 py-6 text-center text-xs text-emerald-300">No errors</li>}
            </ul>
          </Panel>
          <Panel title="Login history" subtitle="Latest 20" padded={false}>
            <ul className="divide-y divide-white/[0.04] max-h-[200px] overflow-y-auto">
              {d.logins.map((l, i) => (
                <li key={i} className="px-5 py-2 flex items-center gap-3 text-xs">
                  <span className="font-mono text-slate-500 tabular-nums w-28 shrink-0">{fmtDateTime(l.ts)}</span>
                  <OutcomePill outcome={l.outcome} />
                  <span className="font-mono text-slate-500 truncate">{l.ip ?? ''}</span>
                  <span className="text-slate-600 truncate hidden lg:inline" title={l.userAgent ?? ''}>{(l.userAgent ?? '').split(') ')[0].slice(0, 40)}</span>
                </li>
              ))}
              {d.logins.length === 0 && <li className="px-5 py-6 text-center text-xs text-slate-500">No logins recorded yet</li>}
            </ul>
          </Panel>
        </div>
      </div>
    </div>
  )
}
