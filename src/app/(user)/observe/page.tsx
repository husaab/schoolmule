// src/app/(user)/observe/page.tsx
'use client'
import Link from 'next/link'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getOverview } from '@/services/observeService'
import Tile from '@/components/observe/Tile'
import Panel from '@/components/observe/Panel'
import TimeSeriesChart from '@/components/observe/TimeSeriesChart'
import BarList from '@/components/observe/BarList'
import LiveFeed from '@/components/observe/LiveFeed'
import StateBlock from '@/components/observe/StateBlock'
import { SourcePill } from '@/components/observe/pills'
import { C } from '@/components/observe/chartTheme'
import { deltaRatio, fmtMs, fmtNum, fmtPct, timeAgo } from '@/components/observe/format'

export default function OverviewPage() {
  const { data, error, loading, refetch, window } = useObserveQuery(getOverview)

  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />

  const t = data?.tiles
  const p = data?.prev
  const s = data?.series ?? []
  const spark = (k: 'requests' | 'errors' | 'activeUsers' | 'p95Ms') => s.map((x) => x[k])
  const errorTone = !t ? 'neutral' : t.errorRate >= 0.05 ? 'bad' : t.errorRate >= 0.01 ? 'warn' : 'good'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-3">
        <Tile label="Online now" value={fmtNum(t?.onlineNow)} tone={t && t.onlineNow > 0 ? 'good' : 'neutral'} sub="seen in last 10 min" loading={loading && !data} />
        <Tile label="Active users" value={fmtNum(t?.activeUsers)} delta={t && p ? deltaRatio(t.activeUsers, p.activeUsers) : null} spark={spark('activeUsers')} loading={loading && !data} />
        <Tile label="Requests" value={fmtNum(t?.requests)} delta={t && p ? deltaRatio(t.requests, p.requests) : null} spark={spark('requests')} loading={loading && !data} />
        <Tile label="Error rate" value={fmtPct(t?.errorRate)} delta={t && p ? deltaRatio(t.errorRate, p.errorRate) : null} deltaGoodWhen="down" spark={spark('errors')} tone={errorTone} sub={t ? `${t.errors} × 5xx · ${t.clientErrors} × 4xx` : undefined} loading={loading && !data} />
        <Tile label="p95 latency" value={fmtMs(t?.p95Ms)} delta={t && p ? deltaRatio(t.p95Ms, p.p95Ms) : null} deltaGoodWhen="down" spark={spark('p95Ms')} tone={t && t.p95Ms > 2000 ? 'warn' : 'neutral'} loading={loading && !data} />
        <Tile label="Logins" value={fmtNum(t?.logins)} delta={t && p ? deltaRatio(t.logins, p.logins) : null} loading={loading && !data} />
        <Tile label="Failed logins" value={fmtNum(t?.failedLogins)} delta={t && p ? deltaRatio(t.failedLogins, p.failedLogins) : null} deltaGoodWhen="down" tone={t && t.failedLogins >= 5 ? 'warn' : 'neutral'} loading={loading && !data} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel className="xl:col-span-2" title="Traffic" subtitle={`Requests, errors and active users · last ${window}`}>
          {loading && !data ? <StateBlock kind="loading" /> : (
            <TimeSeriesChart
              data={s as unknown as Record<string, string | number>[]}
              windowKey={window}
              height={260}
              series={[
                { key: 'requests', label: 'requests', color: C.primary, kind: 'area' },
                { key: 'errors', label: '5xx', color: C.bad, kind: 'bar' },
                { key: 'activeUsers', label: 'active users', color: C.violet, kind: 'line', yAxisId: 'right' },
              ]}
              rightAxisFormatter={(v) => `${v}`}
            />
          )}
        </Panel>
        <Panel title="Live feed" subtitle="Latest 50 requests" padded>
          {loading && !data ? <StateBlock kind="loading" /> : <div className="max-h-[300px] overflow-y-auto"><LiveFeed items={data?.feed ?? []} /></div>}
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Top features" subtitle="By requests" actions={<Link href="/observe/features" className="text-xs text-cyan-300 hover:underline underline-offset-4">All features</Link>}>
          {loading && !data ? <StateBlock kind="loading" /> : (
            <BarList items={(data?.topFeatures ?? []).map((f) => ({ key: f.feature, label: f.feature, value: f.requests, sub: `${f.users} users · ${f.errors} errors · p95 ${fmtMs(f.p95Ms)}`, href: '/observe/features' }))} />
          )}
        </Panel>
        <Panel title="Top errors" subtitle="Grouped by cause" actions={<Link href="/observe/errors" className="text-xs text-cyan-300 hover:underline underline-offset-4">All errors</Link>}>
          {loading && !data ? <StateBlock kind="loading" /> : (data?.topErrors.length ?? 0) === 0 ? <StateBlock kind="ok" message={`No errors in the last ${window}`} /> : (
            <ul className="divide-y divide-white/[0.04]">
              {data!.topErrors.map((e) => (
                <li key={e.fingerprint}>
                  <Link href={`/observe/errors/${e.fingerprint}`} className="flex items-center gap-3 py-2.5 group">
                    <span className="font-mono text-lg font-semibold text-rose-300 tabular-nums w-10 text-right shrink-0">{e.count}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-slate-200 truncate group-hover:text-white">{e.message}</p>
                      <p className="text-[11px] text-slate-500 truncate font-mono">{e.location ?? '—'} · {e.users} users · {timeAgo(e.lastSeen)}</p>
                    </div>
                    <SourcePill source={e.source} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
