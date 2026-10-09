// src/app/(user)/observe/logins/page.tsx
'use client'
import { useObserveQuery } from '@/hooks/useObserveQuery'
import { getLogins } from '@/services/observeService'
import Panel from '@/components/observe/Panel'
import Tile from '@/components/observe/Tile'
import TimeSeriesChart from '@/components/observe/TimeSeriesChart'
import StateBlock from '@/components/observe/StateBlock'
import UserChip from '@/components/observe/UserChip'
import { OutcomePill } from '@/components/observe/pills'
import { C } from '@/components/observe/chartTheme'
import { fmtDateTime, fmtNum, timeAgo } from '@/components/observe/format'

export default function LoginsPage() {
  const { data, error, loading, refetch, window } = useObserveQuery(getLogins)
  if (error && !data) return <StateBlock kind="error" message={error} onRetry={refetch} />
  const busy = loading && !data
  const t = data?.tiles

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Tile label="Successful logins" value={fmtNum(t?.logins)} spark={data?.series.map((p) => p.success)} tone="good" loading={busy} />
        <Tile label="Unique users" value={fmtNum(t?.uniqueUsers)} loading={busy} />
        <Tile label="Failed attempts" value={fmtNum(t?.failedLogins)} spark={data?.series.map((p) => p.failed)} tone={t && t.failedLogins >= 5 ? 'warn' : 'neutral'} loading={busy} />
      </div>
      <Panel title="Sign-ins" subtitle={`last ${window}`}>
        {busy ? <StateBlock kind="loading" /> : (
          <TimeSeriesChart data={(data?.series ?? []) as unknown as Record<string, string | number>[]} windowKey={window} height={200} series={[{ key: 'success', label: 'success', color: C.good, kind: 'bar', stackId: 'l' }, { key: 'failed', label: 'failed', color: C.bad, kind: 'bar', stackId: 'l' }]} />
        )}
      </Panel>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel className="xl:col-span-2" title="Recent attempts" subtitle="Latest 100" padded={false}>
          {busy ? <div className="px-5"><StateBlock kind="loading" /></div> : (
            <ul className="divide-y divide-white/[0.04] max-h-[60vh] overflow-y-auto">
              {(data?.recent ?? []).map((l, i) => (
                <li key={i} className="px-5 py-2 flex items-center gap-3 text-xs">
                  <span className="font-mono text-slate-500 tabular-nums w-28 shrink-0">{fmtDateTime(l.ts)}</span>
                  <OutcomePill outcome={l.outcome} />
                  <span className="min-w-0 flex-1 truncate">{l.user ? <UserChip user={l.user} compact /> : <span className="text-slate-300 font-mono">{l.email}</span>}</span>
                  <span className="font-mono text-slate-500 hidden md:inline">{l.ip ?? ''}</span>
                  <span className="text-slate-600 truncate hidden lg:inline max-w-[200px]" title={l.userAgent ?? ''}>{(l.userAgent ?? '').replace(/^Mozilla\/5\.0 /, '').slice(0, 48)}</span>
                </li>
              ))}
              {(data?.recent ?? []).length === 0 && <li className="px-5 py-8 text-center text-xs text-slate-500">No sign-ins in this window</li>}
            </ul>
          )}
        </Panel>
        <Panel title="Repeat failures" subtitle="Emails with failed attempts">
          {busy ? <StateBlock kind="loading" /> : (data?.failedByEmail.length ?? 0) === 0 ? <StateBlock kind="ok" message="No failed attempts" /> : (
            <ul className="space-y-2">
              {data!.failedByEmail.map((f) => (
                <li key={f.email} className={`flex items-center gap-3 text-sm rounded-xl px-3 py-2 ${f.attempts >= 5 ? 'bg-rose-400/10' : 'bg-white/[0.02]'}`}>
                  <span className={`font-mono tabular-nums w-8 text-right ${f.attempts >= 5 ? 'text-rose-300' : 'text-amber-300'}`}>{f.attempts}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-slate-200 truncate">{f.email}</p>
                    <p className="text-[11px] text-slate-500">{f.outcomes.join(', ').replace(/_/g, ' ')} · {timeAgo(f.lastAt)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  )
}
